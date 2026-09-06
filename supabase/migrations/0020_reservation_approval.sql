-- =========================================================================
-- Car Rental Management System
-- Migration 0020: a real accept/deny workflow for a customer's
-- self-service reservation — until now, create_reservation() (0007,
-- tightened in 0015) fully committed a booking the instant it was
-- submitted, identically whether staff or a customer created it. There
-- was nothing to "accept" — the customer-facing "Pending Reservation"
-- wording (earlier this session) was cosmetic only. This makes it real.
--
-- A staff-created reservation is implicitly pre-approved (approval_status
-- stays null — nothing for staff to approve about their own booking); a
-- customer's self-service one starts 'pending' and needs a manager+ (or
-- staff+? see below) decision before it's checked in.
-- Run after 0001-0019.
-- =========================================================================

create type public.reservation_approval_status as enum ('pending', 'approved', 'denied');

alter table public.rentals add column if not exists approval_status public.reservation_approval_status;

-- ---------------------------------------------------------------------
-- create_reservation — same signature and logic as 0015, plus stamping
-- approval_status based on who's booking. The vehicle is still marked
-- 'reserved' immediately either way (unchanged) — holding it during
-- review avoids a second booking racing it while pending, since this
-- system tracks a vehicle's single current status rather than
-- per-date-range availability.
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
  v_is_staff boolean;
begin
  v_role := public.auth_role();
  if v_role is null then
    raise exception 'Not authorized.';
  end if;
  v_is_staff := v_role in ('super_admin', 'manager', 'staff');

  if not v_is_staff then
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

  insert into public.rentals (
    vehicle_id, customer_id, rental_start_datetime, rental_duration_days,
    expected_return_datetime, daily_rate, subtotal, total_amount,
    amount_paid, balance_due, deposit_amount, rental_status,
    approval_status, notes, created_by
  ) values (
    p_vehicle_id, p_customer_id, p_rental_start, p_duration_days,
    v_expected_return, v_daily_rate, v_subtotal, v_subtotal,
    0, v_subtotal, coalesce(p_deposit_amount, 0), 'reserved',
    case when v_is_staff then null else 'pending' end,
    p_notes, auth.uid()
  ) returning id into v_rental_id;

  update public.vehicles set vehicle_status = 'reserved' where id = p_vehicle_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'reservation_created',
    'rental',
    v_rental_id,
    jsonb_build_object('customer_id', p_customer_id, 'vehicle_id', p_vehicle_id, 'self_service', not v_is_staff)
  );

  return v_rental_id;
end;
$$;

-- ---------------------------------------------------------------------
-- approve_reservation — staff+ only. Marks a pending self-service
-- reservation approved; Check-In then proceeds exactly as for any other
-- reservation (activate_reservation, unchanged).
-- ---------------------------------------------------------------------

create or replace function public.approve_reservation(p_rental_id uuid)
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
  if v_role is null or v_role not in ('super_admin', 'manager', 'staff') then
    raise exception 'Not authorized.';
  end if;

  select * into v_rental from public.rentals where id = p_rental_id;
  if not found then
    raise exception 'Reservation % does not exist', p_rental_id;
  end if;
  if v_rental.rental_status <> 'reserved' or v_rental.approval_status <> 'pending' then
    raise exception 'This reservation is not awaiting approval.';
  end if;

  update public.rentals set approval_status = 'approved' where id = p_rental_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id)
  values (auth.uid(), 'reservation_approved', 'rental', p_rental_id);
end;
$$;

-- ---------------------------------------------------------------------
-- deny_reservation — staff+ only. Same effect as cancel_reservation
-- (rental cancelled, vehicle freed) plus stamping approval_status so
-- it's distinguishable from a plain cancellation in the audit trail.
-- ---------------------------------------------------------------------

create or replace function public.deny_reservation(p_rental_id uuid, p_reason text default null)
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
  if v_role is null or v_role not in ('super_admin', 'manager', 'staff') then
    raise exception 'Not authorized.';
  end if;

  select * into v_rental from public.rentals where id = p_rental_id;
  if not found then
    raise exception 'Reservation % does not exist', p_rental_id;
  end if;
  if v_rental.rental_status <> 'reserved' or v_rental.approval_status <> 'pending' then
    raise exception 'This reservation is not awaiting approval.';
  end if;

  update public.rentals
  set rental_status = 'cancelled', approval_status = 'denied'
  where id = p_rental_id;

  update public.vehicles
  set vehicle_status = 'available'
  where id = v_rental.vehicle_id and vehicle_status = 'reserved';

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'reservation_denied', 'rental', p_rental_id, jsonb_build_object('reason', p_reason));
end;
$$;
