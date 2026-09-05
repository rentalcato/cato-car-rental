-- =========================================================================
-- Car Rental Management System
-- Migration 0008: rental completion (check-in/return) + fixes surfaced by
-- code review — a vehicle's status could previously be edited directly
-- (bypassing checkout/reservation state) with no way to properly close
-- out a rental at all. Run after 0001-0007.
-- =========================================================================

-- ---------------------------------------------------------------------
-- 1. Lock down manual vehicle_status edits so they can't recreate the
--    double-booking scenario 0005/0007 were written to prevent. Only
--    blocks the specific dangerous transitions (landing on 'available'
--    while a rental/reservation is genuinely still open); maintenance/
--    out_of_service/overdue transitions are untouched — this isn't a
--    full state machine, just closes the one exploitable gap:
--    `updateVehicle` (a plain table update, unlike checkout/reservation/
--    complete which all go through SECURITY DEFINER functions) could set
--    vehicle_status back to 'available' on a vehicle with an active
--    rental, letting it be checked out to a second customer.
-- ---------------------------------------------------------------------

create or replace function public.protect_vehicle_status_transition()
returns trigger
language plpgsql
as $$
begin
  if new.vehicle_status in ('available', 'reserved') then
    if exists (
      select 1 from public.rentals
      where vehicle_id = old.id and rental_status in ('active', 'overdue')
    ) then
      raise exception 'Cannot set this vehicle to % — it has an active rental. Complete or cancel the rental first.', new.vehicle_status;
    end if;
  end if;

  if new.vehicle_status = 'available' then
    if exists (
      select 1 from public.rentals
      where vehicle_id = old.id and rental_status = 'reserved'
    ) then
      raise exception 'Cannot set this vehicle to available — it has a pending reservation. Check in or cancel the reservation first.';
    end if;
  end if;

  return new;
end;
$$;

create trigger protect_vehicle_status_transition
  before update of vehicle_status on public.vehicles
  for each row
  when (old.vehicle_status is distinct from new.vehicle_status)
  execute function public.protect_vehicle_status_transition();

-- checkout_rental/create_reservation/activate_reservation/cancel_reservation
-- (0006/0007) all update the `rentals` row to its new status BEFORE
-- updating `vehicles`, so by the time each of those functions touches
-- vehicle_status, this trigger's EXISTS checks no longer see the old
-- rental as open — they remain unaffected by this guard.

-- Correct a stale comment from 0002 rather than editing that migration
-- (migrations here are append-only) — the sequence never actually resets
-- per year despite the RNT-<year>- prefix; the year is just a label.
comment on sequence public.rental_number_seq is
  'Feeds generate_rental_number(). Monotonic for the life of the database — '
  'despite the RNT-<year>-###### format, the counter does NOT reset when '
  'the year rolls over; the year segment is a label, not a scope.';

-- ---------------------------------------------------------------------
-- 2. complete_rental() — the missing other half of checkout: records an
--    actual return, settles late fees/additional charges/final payment,
--    and frees the vehicle. SECURITY DEFINER, same shape/role model as
--    checkout_rental/activate_reservation (0006/0007) — staff+ may call
--    it; direct writes to rentals/payments stay manager+-only.
-- ---------------------------------------------------------------------

create or replace function public.complete_rental(
  p_rental_id uuid,
  p_actual_return timestamptz default now(),
  p_return_mileage integer default null,
  p_return_fuel_level text default null,
  p_late_fee numeric default null,
  p_additional_charges numeric default null,
  p_payment_amount numeric default 0,
  p_payment_method public.payment_method default null,
  p_payment_reference text default null,
  p_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_rental public.rentals;
  v_late_fee numeric(10, 2);
  v_additional_charges numeric(10, 2);
  v_new_total numeric(10, 2);
  v_new_amount_paid numeric(10, 2);
  v_new_balance numeric(10, 2);
begin
  v_role := public.auth_role();
  if v_role is null then
    raise exception 'Not authorized.';
  end if;

  select * into v_rental from public.rentals where id = p_rental_id;
  if not found then
    raise exception 'Rental % does not exist', p_rental_id;
  end if;
  if v_rental.rental_status not in ('active', 'overdue') then
    raise exception 'This rental is not active (current status: %)', v_rental.rental_status;
  end if;

  v_late_fee := coalesce(p_late_fee, v_rental.late_fee, 0);
  v_additional_charges := coalesce(p_additional_charges, v_rental.additional_charges, 0);
  v_new_total := coalesce(v_rental.subtotal, 0) - coalesce(v_rental.discount, 0)
                 + v_late_fee + v_additional_charges;
  v_new_amount_paid := coalesce(v_rental.amount_paid, 0) + coalesce(p_payment_amount, 0);
  v_new_balance := v_new_total - v_new_amount_paid;

  update public.rentals
  set rental_status = 'completed',
      actual_return_datetime = coalesce(p_actual_return, now()),
      return_mileage = coalesce(p_return_mileage, v_rental.return_mileage),
      return_fuel_level = coalesce(p_return_fuel_level, v_rental.return_fuel_level),
      late_fee = v_late_fee,
      additional_charges = v_additional_charges,
      total_amount = v_new_total,
      amount_paid = v_new_amount_paid,
      balance_due = v_new_balance,
      notes = coalesce(p_notes, v_rental.notes)
  where id = p_rental_id;

  if coalesce(p_payment_amount, 0) > 0 then
    insert into public.payments (
      rental_id, customer_id, payment_amount, payment_method, payment_reference, received_by
    ) values (
      p_rental_id, v_rental.customer_id, p_payment_amount, p_payment_method, p_payment_reference, auth.uid()
    );
  end if;

  -- rentals is already 'completed' above, so protect_vehicle_status_transition
  -- (this migration) sees no open rental for this vehicle and allows this.
  update public.vehicles
  set vehicle_status = 'available',
      current_mileage = greatest(coalesce(current_mileage, 0), coalesce(p_return_mileage, 0))
  where id = v_rental.vehicle_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'rental_completed',
    'rental',
    p_rental_id,
    jsonb_build_object('late_fee', v_late_fee, 'additional_charges', v_additional_charges)
  );
end;
$$;

grant execute on function public.complete_rental(
  uuid, timestamptz, integer, text, numeric, numeric, numeric, public.payment_method, text, text
) to authenticated;
