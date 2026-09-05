-- =========================================================================
-- Car Rental Management System
-- Migration 0015: lets a linked customer (0014) book/cancel their own
-- reservation, and — not optional — fixes a real gap this surfaced in
-- create_reservation/activate_reservation/cancel_reservation (0007).
--
-- Those three are SECURITY DEFINER functions granted to the whole
-- `authenticated` role. Each only checked that the caller had *a* role
-- at all (public.auth_role() is not null) — never that the caller had
-- any right to the specific customer_id/rental_id passed in. That was
-- harmless while only trusted staff held accounts. It is not harmless
-- now: any signed-up `customer` could already call these RPCs directly
-- (bypassing the app entirely, e.g. via supabase.rpc(...) in a browser
-- console) to create a reservation under someone else's customer_id, or
-- cancel/check-in *any* rental in the system by id. Fixed below with an
-- ownership check for any non-staff caller. Run after 0001-0014.
-- =========================================================================

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

  -- New: a non-staff caller (i.e. a customer booking themselves) may
  -- only ever book under their own linked customer record. IS DISTINCT
  -- FROM (not <>) matters here: an unlinked caller's subquery returns
  -- no row (NULL), and `p_customer_id <> NULL` evaluates to NULL, which
  -- `if` treats as false — silently skipping this check entirely for
  -- exactly the caller who most needs to be blocked.
  if v_role not in ('super_admin', 'manager', 'staff') then
    if p_customer_id is distinct from (select id from public.customers where profile_id = auth.uid()) then
      raise exception 'You can only book a reservation for your own account.';
    end if;
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

  -- check_vehicle_available_for_rental (0007) fires here and rejects a
  -- vehicle that isn't currently 'available'.
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
    jsonb_build_object('customer_id', p_customer_id, 'vehicle_id', p_vehicle_id, 'self_service', v_role = 'customer')
  );

  return v_rental_id;
end;
$$;

-- ---------------------------------------------------------------------
-- activate_reservation — now staff-only outright. Checking a car out is
-- an in-person, ID-verifying, key-handover action, never something a
-- customer does themselves over the web.
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
  if v_role is null or v_role not in ('super_admin', 'manager', 'staff') then
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

-- ---------------------------------------------------------------------
-- cancel_reservation — a non-staff caller may only cancel a reservation
-- on their own linked customer record.
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

  -- Same IS DISTINCT FROM reasoning as create_reservation above — an
  -- unlinked non-staff caller must still be rejected, not silently pass.
  if v_role not in ('super_admin', 'manager', 'staff') then
    if v_rental.customer_id is distinct from (select id from public.customers where profile_id = auth.uid()) then
      raise exception 'You can only cancel your own reservation.';
    end if;
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
    jsonb_build_object('reason', p_reason, 'self_service', v_role = 'customer')
  );
end;
$$;
