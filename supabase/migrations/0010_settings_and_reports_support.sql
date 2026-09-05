-- =========================================================================
-- Car Rental Management System
-- Migration 0010: Settings (business/rental config + user management) and
-- Reports support. Run after 0001-0009.
--
-- Reports needs no new tables — it's pure aggregate reads over existing
-- rentals/payments/maintenance/vehicles/audit_logs. Settings needs one new
-- singleton table for business/rental defaults; "Users & Roles" management
-- reuses the existing `profiles` table and its RLS as-is.
-- =========================================================================

-- ---------------------------------------------------------------------
-- 1. app_settings — a single row of business/rental configuration.
--    `id smallint primary key check (id = 1)` is the standard Postgres
--    singleton-table pattern: the check constraint makes a second row
--    physically impossible.
-- ---------------------------------------------------------------------

create table public.app_settings (
  id                        smallint primary key default 1,
  business_name             text,
  logo_storage_path         text,
  address                   text,
  phone                     text,
  email                     text,
  -- Stored/editable now; not yet threaded through every formatCurrency/
  -- formatDate call site in the app (see migration comment history /
  -- README) — that's a larger follow-up change, not a silent no-op.
  currency                  text not null default 'JMD',
  timezone                  text not null default 'America/Jamaica',
  tax_rate                  numeric(5, 2) not null default 0,
  default_daily_rate        numeric(10, 2),
  grace_period_hours        integer not null default 0,
  late_fee_per_day          numeric(10, 2) not null default 0,
  default_security_deposit  numeric(10, 2) not null default 0,
  mileage_limit_per_day     integer,
  mileage_overage_fee       numeric(10, 2),
  fuel_policy               text,
  updated_at                timestamptz not null default now(),

  constraint app_settings_singleton check (id = 1)
);

create trigger set_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

insert into public.app_settings (id, business_name, currency, timezone)
values (1, 'Fleet Manager', 'JMD', 'America/Jamaica')
on conflict (id) do nothing;

alter table public.app_settings enable row level security;

-- All three roles can read it (branding + form pre-fills apply everywhere);
-- only super_admin can change it, matching nav-config's existing gate on
-- the Settings page and `profiles`' own super_admin-only write policy.
create policy app_settings_select on public.app_settings
  for select
  using (public.auth_role() in ('super_admin', 'manager', 'staff'));

create policy app_settings_write on public.app_settings
  for all
  using (public.auth_role() = 'super_admin')
  with check (public.auth_role() = 'super_admin');

-- ---------------------------------------------------------------------
-- 2. business-assets — public bucket for the business logo, mirroring
--    vehicle-photos/customer-photos (0004/0006).
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('business-assets', 'business-assets', true)
on conflict (id) do nothing;

create policy business_assets_storage_insert on storage.objects
  for insert
  with check (bucket_id = 'business-assets' and public.auth_role() = 'super_admin');

create policy business_assets_storage_update on storage.objects
  for update
  using (bucket_id = 'business-assets' and public.auth_role() = 'super_admin');

create policy business_assets_storage_delete on storage.objects
  for delete
  using (bucket_id = 'business-assets' and public.auth_role() = 'super_admin');
