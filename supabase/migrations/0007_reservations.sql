-- =========================================================================
-- Car Rental Management System — Reservations
-- Migration 0007 (run after 0001-0006).
--
-- A reservation is a `rentals` row with rental_status = 'reserved' — no
-- new table. Checking one in updates that same row in place (reserved ->
-- active); cancelling sets it to 'cancelled'. See create_reservation() /
-- activate_reservation() / cancel_reservation() below.
-- =========================================================================

-- ---------------------------------------------------------------------
-- 1. Tighten the 0005 availability guard. It used to allow inserting a
--    new rental when the vehicle was 'available' OR 'reserved' — the
--    'reserved' branch was presumably meant for reserved -> active
--    conversion, but that conversion is an UPDATE (below), not an
--    INSERT, so this trigger only ever runs for brand-new rentals/
--    reservations. Left as-is it would silently allow double-booking an
--    already-reserved vehicle with a second, unrelated reservation.
-- ---------------------------------------------------------------------

create or replace function public.check_vehicle_available_for_rental()
returns trigger
language plpgsql
as $$
declare
  v_status public.vehicle_status;
begin
  select vehicle_status into v_status from public.vehicles where id = new.vehicle_id;

  if v_status is null then
    raise exception 'Vehicle % does not exist', new.vehicle_id;
  end if;

  if v_status <> 'available' then
    raise exception 'Vehicle is not available for a new rental (current status: %)', v_status;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. create_reservation() — books a vehicle for a future pickup. Same
--    shape as checkout_rental() (0006): blacklist-block-unless-manager-
--    override, same pricing snapshot, but rental_status = 'reserved',
--    vehicle -> 'reserved', no checkout_mileage/payment yet (the car
--    hasn't been handed over).
-- ---------------------------------------------------------------------

create or replace function public.create_reservation(
  p_customer_id uuid,
  p_vehicle_id uuid,
  p_rental_start timestamptz,
  p_duration_days integer,
  p_deposit_amount numeric default 0,
  p_notes text default null,
  p_override_blacklist boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_customer_status public.customer_status;
  v_daily_rate numeric(10, 2);
  v_expected_return timestamptz;
  v_subtotal numeric(10, 2);
  v_rental_id uuid;
begin
  v_role := public.auth_role();
  if v_role is null then
    raise exception 'Not authorized.';
  end if;

  if p_duration_days is null or p_duration_days < 1 then
    raise exception 'Rental duration must be at least 1 day.';
  end if;

  select status into v_customer_status from public.customers where id = p_customer_id;
  if not found then
    raise exception 'Customer % does not exist', p_customer_id;
  end if;

  if v_customer_status = 'blacklisted'
     and (v_role not in ('super_admin', 'manager') or not p_override_blacklist) then
    raise exception 'This customer is blacklisted. A manager or super admin must override to continue.';
  end if;

  select daily_rental_rate into v_daily_rate
  from public.vehicles where id = p_vehicle_id;
  if not found then
    raise exception 'Vehicle % does not exist', p_vehicle_id;
  end if;

  v_expected_return := p_rental_start + (p_duration_days || ' days')::interval;
  v_subtotal := coalesce(v_daily_rate, 0) * p_duration_days;

  -- check_vehicle_available_for_rental (tightened above) fires here and
  -- rejects a vehicle that isn't currently 'available'.
  insert into public.rentals (
    vehicle_id, customer_id, rental_start_datetime, rental_duration_days,
    expected_return_datetime, daily_rate, subtotal, total_amount,
    amount_paid, balance_due, deposit_amount, rental_status,
    notes, created_by
  ) values (
    p_vehicle_id, p_customer_id, p_rental_start, p_duration_days,
    v_expected_return, v_daily_rate, v_subtotal, v_subtotal,
    0, v_subtotal, coalesce(p_deposit_amount, 0), 'reserved',
    p_notes, auth.uid()
  ) returning id into v_rental_id;

  update public.vehicles set vehicle_status = 'reserved' where id = p_vehicle_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'reservation_created',
    'rental',
    v_rental_id,
    jsonb_build_object('customer_id', p_customer_id, 'vehicle_id', p_vehicle_id)
  );

  return v_rental_id;
end;
$$;

grant execute on function public.create_reservation(
  uuid, uuid, timestamptz, integer, numeric, text, boolean
) to authenticated;

-- ---------------------------------------------------------------------
-- 3. activate_reservation() — "check in": the reserved rental becomes
--    active. Updates the SAME rentals row (no second row is ever
--    created for one booking). Re-checks blacklist status since it may
--    have changed since booking.
-- ---------------------------------------------------------------------

create or replace function public.activate_reservation(
  p_rental_id uuid,
  p_payment_amount numeric default 0,
  p_payment_method public.payment_method default null,
  p_payment_reference text default null,
  p_override_blacklist boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_rental public.rentals;
  v_customer_status public.customer_status;
  v_mileage integer;
  v_new_amount_paid numeric(10, 2);
  v_new_balance numeric(10, 2);
begin
  v_role := public.auth_role();
  if v_role is null then
    raise exception 'Not authorized.';
  end if;

  select * into v_rental from public.rentals where id = p_rental_id;
  if not found then
    raise exception 'Reservation % does not exist', p_rental_id;
  end if;
  if v_rental.rental_status <> 'reserved' then
    raise exception 'This reservation is no longer pending (current status: %)', v_rental.rental_status;
  end if;

  select status into v_customer_status from public.customers where id = v_rental.customer_id;
  if v_customer_status = 'blacklisted'
     and (v_role not in ('super_admin', 'manager') or not p_override_blacklist) then
    raise exception 'This customer is blacklisted. A manager or super admin must override to continue.';
  end if;

  select current_mileage into v_mileage from public.vehicles where id = v_rental.vehicle_id;

  v_new_amount_paid := v_rental.amount_paid + coalesce(p_payment_amount, 0);
  v_new_balance := coalesce(v_rental.total_amount, 0) - v_new_amount_paid;

  update public.rentals
  set rental_status = 'active',
      checkout_mileage = v_mileage,
      amount_paid = v_new_amount_paid,
      balance_due = v_new_balance
  where id = p_rental_id;

  if coalesce(p_payment_amount, 0) > 0 then
    insert into public.payments (
      rental_id, customer_id, payment_amount, payment_method, payment_reference, received_by
    ) values (
      p_rental_id, v_rental.customer_id, p_payment_amount, p_payment_method, p_payment_reference, auth.uid()
    );
  end if;

  update public.vehicles set vehicle_status = 'rented' where id = v_rental.vehicle_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'reservation_activated',
    'rental',
    p_rental_id,
    jsonb_build_object('blacklist_override', (v_customer_status = 'blacklisted' and p_override_blacklist))
  );
end;
$$;

grant execute on function public.activate_reservation(
  uuid, numeric, public.payment_method, text, boolean
) to authenticated;

-- ---------------------------------------------------------------------
-- 4. cancel_reservation() — frees the vehicle back to 'available'.
-- ---------------------------------------------------------------------

create or replace function public.cancel_reservation(
  p_rental_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_rental public.rentals;
begin
  v_role := public.auth_role();
  if v_role is null then
    raise exception 'Not authorized.';
  end if;

  select * into v_rental from public.rentals where id = p_rental_id;
  if not found then
    raise exception 'Reservation % does not exist', p_rental_id;
  end if;
  if v_rental.rental_status <> 'reserved' then
    raise exception 'This reservation is no longer pending (current status: %)', v_rental.rental_status;
  end if;

  update public.rentals set rental_status = 'cancelled' where id = p_rental_id;

  -- Only clear the vehicle if it's still sitting in the state this
  -- reservation put it in (defensive — should always be true).
  update public.vehicles
  set vehicle_status = 'available'
  where id = v_rental.vehicle_id and vehicle_status = 'reserved';

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'reservation_cancelled',
    'rental',
    p_rental_id,
    jsonb_build_object('reason', p_reason)
  );
end;
$$;

grant execute on function public.cancel_reservation(uuid, text) to authenticated;
