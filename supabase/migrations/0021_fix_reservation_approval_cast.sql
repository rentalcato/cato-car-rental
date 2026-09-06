-- =========================================================================
-- Car Rental Management System
-- Migration 0021: fixes a real bug in 0020's create_reservation() —
-- "column approval_status is of type reservation_approval_status but
-- expression is of type text".
--
-- `case when v_is_staff then null else 'pending' end` resolves its own
-- type before the INSERT's target-column assignment context applies.
-- An untyped string literal next to a bare NULL defaults to `text`, and
-- Postgres will not implicitly cast `text` to a custom enum (only an
-- `unknown`-typed literal used directly gets that implicit cast) — so
-- every reservation attempt failed outright. Fixed by casting the
-- literal explicitly so the CASE expression's type is the enum itself.
-- Run after 0001-0020.
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
    case when v_is_staff then null else 'pending'::public.reservation_approval_status end,
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
