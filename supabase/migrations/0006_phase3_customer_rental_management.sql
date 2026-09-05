-- =========================================================================
-- Car Rental Management System — Phase 3: Customer / Renter Profile
-- Management + rental checkout.
-- Migration 0006 (run after 0001-0005).
-- =========================================================================

-- ---------------------------------------------------------------------
-- 1. New enums
-- ---------------------------------------------------------------------

create type public.customer_status as enum ('active', 'restricted', 'blacklisted', 'inactive');

create type public.document_type as enum (
  'drivers_license_front',
  'drivers_license_back',
  'national_id',
  'passport',
  'proof_of_address',
  'rental_agreement',
  'signed_document',
  'other'
);

-- ---------------------------------------------------------------------
-- 2. customers: richer profile fields + status
-- ---------------------------------------------------------------------

alter table public.customers add column if not exists customer_number text;
alter table public.customers add column if not exists middle_name text;
alter table public.customers rename column phone to primary_phone;
alter table public.customers add column if not exists secondary_phone text;
alter table public.customers add column if not exists date_of_birth date;
alter table public.customers add column if not exists gender text;
alter table public.customers add column if not exists city_parish text;
alter table public.customers add column if not exists country text;
alter table public.customers add column if not exists emergency_contact_name text;
alter table public.customers add column if not exists emergency_contact_phone text;
alter table public.customers add column if not exists drivers_license_issuing_country text;
alter table public.customers add column if not exists drivers_license_issue_date date;
alter table public.customers add column if not exists passport_number text;
alter table public.customers add column if not exists photo_storage_path text;
alter table public.customers add column if not exists status public.customer_status not null default 'active';

-- Best-effort split of the old free-text emergency contact into the new
-- name/phone columns, then retire it.
update public.customers
set emergency_contact_name = emergency_contact
where emergency_contact_name is null and emergency_contact is not null;

alter table public.customers drop column if exists emergency_contact;

-- customer_number: 'CUS-000001', auto-generated, mirrors the existing
-- rental_number pattern in 0002_functions_triggers.sql.
create sequence if not exists public.customer_number_seq;

create or replace function public.generate_customer_number()
returns trigger
language plpgsql
as $$
begin
  if new.customer_number is null or new.customer_number = '' then
    new.customer_number := 'CUS-' || lpad(nextval('public.customer_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger generate_customer_number before insert on public.customers
  for each row execute function public.generate_customer_number();

-- Backfill any pre-existing rows, then lock the column down.
update public.customers
set customer_number = 'CUS-' || lpad(nextval('public.customer_number_seq')::text, 6, '0')
where customer_number is null;

alter table public.customers alter column customer_number set not null;
alter table public.customers add constraint customers_customer_number_key unique (customer_number);

create index if not exists customers_status_idx on public.customers (status);

-- ---------------------------------------------------------------------
-- 3. customer_documents — metadata only; files live in the private
--    'customer-documents' Storage bucket created below.
-- ---------------------------------------------------------------------

create table public.customer_documents (
  id             uuid primary key default gen_random_uuid(),
  customer_id    uuid not null references public.customers (id) on delete cascade,
  document_type  public.document_type not null,
  file_name      text not null,
  storage_path   text not null,
  uploaded_by    uuid references public.profiles (id) on delete set null,
  uploaded_at    timestamptz not null default now(),
  expiry_date    date,
  notes          text,
  created_at     timestamptz not null default now()
);

create index customer_documents_customer_id_idx on public.customer_documents (customer_id);

alter table public.customer_documents enable row level security;

create policy customer_documents_select on public.customer_documents
  for select
  using (public.auth_role() in ('super_admin', 'manager', 'staff'));

-- Any authenticated staff member can add a document (intake happens at
-- the front desk); only manager+ can edit/remove one after the fact.
create policy customer_documents_insert on public.customer_documents
  for insert
  with check (public.auth_role() in ('super_admin', 'manager', 'staff'));

create policy customer_documents_update on public.customer_documents
  for update
  using (public.auth_role() in ('super_admin', 'manager'))
  with check (public.auth_role() in ('super_admin', 'manager'));

create policy customer_documents_delete on public.customer_documents
  for delete
  using (public.auth_role() in ('super_admin', 'manager'));

-- ---------------------------------------------------------------------
-- 4. audit_logs — append-only. No update/delete policy exists for any
--    role, including super_admin: history can't be altered via the API.
-- ---------------------------------------------------------------------

create table public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles (id) on delete set null,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  entity_label text,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

create policy audit_logs_select on public.audit_logs
  for select
  using (public.auth_role() in ('super_admin', 'manager'));

-- Anyone signed in can log an action, but only as themselves.
create policy audit_logs_insert on public.audit_logs
  for insert
  with check (actor_id = auth.uid());

-- ---------------------------------------------------------------------
-- 5. customers RLS: widen create/update to staff (Phase 1 deferred this
--    exact change to "a later phase" — this is that phase). Status
--    changes are NOT covered by this — they only ever happen through
--    set_customer_status() below. Hard delete narrows to super_admin
--    only; the app no longer exposes delete at all (archive via status
--    = 'inactive' instead), this is just a safety net.
-- ---------------------------------------------------------------------

drop policy if exists customers_write on public.customers;

create policy customers_insert on public.customers
  for insert
  with check (public.auth_role() in ('super_admin', 'manager', 'staff'));

create policy customers_update on public.customers
  for update
  using (public.auth_role() in ('super_admin', 'manager', 'staff'))
  with check (public.auth_role() in ('super_admin', 'manager', 'staff'));

create policy customers_delete on public.customers
  for delete
  using (public.auth_role() = 'super_admin');

-- ---------------------------------------------------------------------
-- 6. Storage: private customer-documents bucket + public customer-photos
--    bucket (mirrors vehicle-photos from 0004, just private for docs).
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('customer-documents', 'customer-documents', false)
on conflict (id) do nothing;

create policy customer_documents_storage_select on storage.objects
  for select
  using (
    bucket_id = 'customer-documents'
    and public.auth_role() in ('super_admin', 'manager', 'staff')
  );

create policy customer_documents_storage_insert on storage.objects
  for insert
  with check (
    bucket_id = 'customer-documents'
    and public.auth_role() in ('super_admin', 'manager', 'staff')
  );

create policy customer_documents_storage_update on storage.objects
  for update
  using (
    bucket_id = 'customer-documents'
    and public.auth_role() in ('super_admin', 'manager')
  );

create policy customer_documents_storage_delete on storage.objects
  for delete
  using (
    bucket_id = 'customer-documents'
    and public.auth_role() in ('super_admin', 'manager')
  );

insert into storage.buckets (id, name, public)
values ('customer-photos', 'customer-photos', true)
on conflict (id) do nothing;

create policy customer_photos_storage_insert on storage.objects
  for insert
  with check (
    bucket_id = 'customer-photos'
    and public.auth_role() in ('super_admin', 'manager', 'staff')
  );

create policy customer_photos_storage_update on storage.objects
  for update
  using (
    bucket_id = 'customer-photos'
    and public.auth_role() in ('super_admin', 'manager', 'staff')
  );

create policy customer_photos_storage_delete on storage.objects
  for delete
  using (
    bucket_id = 'customer-photos'
    and public.auth_role() in ('super_admin', 'manager', 'staff')
  );

-- ---------------------------------------------------------------------
-- 7. set_customer_status() — the ONLY way a customer's status changes.
--    SECURITY DEFINER so the manager+ check is enforced in the database
--    itself, independent of the widened customers_update policy above.
-- ---------------------------------------------------------------------

create or replace function public.set_customer_status(
  p_customer_id uuid,
  p_status public.customer_status,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_old_status public.customer_status;
begin
  v_role := public.auth_role();
  if v_role is null or v_role not in ('super_admin', 'manager') then
    raise exception 'Only a manager or super admin can change a customer''s status.';
  end if;

  select status into v_old_status from public.customers where id = p_customer_id;
  if not found then
    raise exception 'Customer % does not exist', p_customer_id;
  end if;

  update public.customers set status = p_status where id = p_customer_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'customer_status_changed',
    'customer',
    p_customer_id,
    jsonb_build_object('from', v_old_status, 'to', p_status, 'reason', p_reason)
  );
end;
$$;

grant execute on function public.set_customer_status(uuid, public.customer_status, text) to authenticated;

-- ---------------------------------------------------------------------
-- 8. checkout_rental() — the only path that creates a rental. Lets
--    staff perform this one specific, validated action without general
--    write access to rentals/payments (both stay manager+-only at the
--    table level, unchanged from 0003). SECURITY DEFINER so it can
--    write to rentals/payments/vehicles/audit_logs atomically.
--    The check_vehicle_available_for_rental trigger from 0005 still
--    fires on the insert below and remains the real availability guard.
-- ---------------------------------------------------------------------

create or replace function public.checkout_rental(
  p_customer_id uuid,
  p_vehicle_id uuid,
  p_rental_start timestamptz,
  p_duration_days integer,
  p_deposit_amount numeric default 0,
  p_payment_amount numeric default 0,
  p_payment_method public.payment_method default null,
  p_payment_reference text default null,
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
  v_mileage integer;
  v_expected_return timestamptz;
  v_subtotal numeric(10, 2);
  v_balance numeric(10, 2);
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

  select daily_rental_rate, current_mileage into v_daily_rate, v_mileage
  from public.vehicles where id = p_vehicle_id;
  if not found then
    raise exception 'Vehicle % does not exist', p_vehicle_id;
  end if;

  v_expected_return := p_rental_start + (p_duration_days || ' days')::interval;
  v_subtotal := coalesce(v_daily_rate, 0) * p_duration_days;
  v_balance := v_subtotal - coalesce(p_payment_amount, 0);

  -- check_vehicle_available_for_rental (0005) fires here and rejects an
  -- unavailable vehicle before this insert completes.
  insert into public.rentals (
    vehicle_id, customer_id, rental_start_datetime, rental_duration_days,
    expected_return_datetime, daily_rate, subtotal, total_amount,
    amount_paid, balance_due, deposit_amount, rental_status,
    checkout_mileage, notes, created_by
  ) values (
    p_vehicle_id, p_customer_id, p_rental_start, p_duration_days,
    v_expected_return, v_daily_rate, v_subtotal, v_subtotal,
    coalesce(p_payment_amount, 0), v_balance, coalesce(p_deposit_amount, 0), 'active',
    v_mileage, p_notes, auth.uid()
  ) returning id into v_rental_id;

  if coalesce(p_payment_amount, 0) > 0 then
    insert into public.payments (
      rental_id, customer_id, payment_amount, payment_method, payment_reference, received_by
    ) values (
      v_rental_id, p_customer_id, p_payment_amount, p_payment_method, p_payment_reference, auth.uid()
    );
  end if;

  update public.vehicles set vehicle_status = 'rented' where id = p_vehicle_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'rental_checkout',
    'rental',
    v_rental_id,
    jsonb_build_object(
      'customer_id', p_customer_id,
      'vehicle_id', p_vehicle_id,
      'blacklist_override', (v_customer_status = 'blacklisted' and p_override_blacklist)
    )
  );

  return v_rental_id;
end;
$$;

grant execute on function public.checkout_rental(
  uuid, uuid, timestamptz, integer, numeric, numeric, public.payment_method, text, text, boolean
) to authenticated;
