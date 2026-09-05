-- =========================================================================
-- Car Rental Management System — Phase 1
-- Migration 0003: Row Level Security (run after 0001 and 0002)
--
-- Model:
--   - super_admin: full access to everything.
--   - manager: can manage vehicles/customers/rentals/payments/maintenance/
--     vehicle issues (matches the Phase 1 spec exactly).
--   - staff: read-only on those tables for now. Staff permissions are
--     "configurable later" per the spec — when that phase arrives, replace
--     the single `auth_role() in ('super_admin','manager')` write-policies
--     below with a per-staff-member permission table.
-- =========================================================================

-- ---------------------------------------------------------------------
-- Helper: current user's role, bypassing RLS on profiles to avoid
-- recursive policy evaluation (standard Supabase pattern).
-- ---------------------------------------------------------------------

create or replace function public.auth_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.customers enable row level security;
alter table public.rentals enable row level security;
alter table public.payments enable row level security;
alter table public.vehicle_issues enable row level security;
alter table public.maintenance enable row level security;

-- ---------------------------------------------------------------------
-- PROFILES
-- ---------------------------------------------------------------------

-- Everyone can read their own profile; super_admin can read all (needed
-- for a future "manage users" screen).
create policy profiles_select on public.profiles
  for select
  using (id = auth.uid() or public.auth_role() = 'super_admin');

-- Only super_admin can create/update/delete profiles by hand. Normal
-- signup provisioning happens via the handle_new_user trigger (Phase 1
-- has no self-service profile editing UI yet).
create policy profiles_write on public.profiles
  for all
  using (public.auth_role() = 'super_admin')
  with check (public.auth_role() = 'super_admin');

-- ---------------------------------------------------------------------
-- VEHICLES
-- ---------------------------------------------------------------------

create policy vehicles_select on public.vehicles
  for select
  using (public.auth_role() in ('super_admin', 'manager', 'staff'));

create policy vehicles_write on public.vehicles
  for all
  using (public.auth_role() in ('super_admin', 'manager'))
  with check (public.auth_role() in ('super_admin', 'manager'));

-- ---------------------------------------------------------------------
-- CUSTOMERS
-- ---------------------------------------------------------------------

create policy customers_select on public.customers
  for select
  using (public.auth_role() in ('super_admin', 'manager', 'staff'));

create policy customers_write on public.customers
  for all
  using (public.auth_role() in ('super_admin', 'manager'))
  with check (public.auth_role() in ('super_admin', 'manager'));

-- ---------------------------------------------------------------------
-- RENTALS
-- ---------------------------------------------------------------------

create policy rentals_select on public.rentals
  for select
  using (public.auth_role() in ('super_admin', 'manager', 'staff'));

create policy rentals_write on public.rentals
  for all
  using (public.auth_role() in ('super_admin', 'manager'))
  with check (public.auth_role() in ('super_admin', 'manager'));

-- ---------------------------------------------------------------------
-- PAYMENTS
-- ---------------------------------------------------------------------

create policy payments_select on public.payments
  for select
  using (public.auth_role() in ('super_admin', 'manager', 'staff'));

create policy payments_write on public.payments
  for all
  using (public.auth_role() in ('super_admin', 'manager'))
  with check (public.auth_role() in ('super_admin', 'manager'));

-- ---------------------------------------------------------------------
-- VEHICLE ISSUES
-- ---------------------------------------------------------------------

create policy vehicle_issues_select on public.vehicle_issues
  for select
  using (public.auth_role() in ('super_admin', 'manager', 'staff'));

create policy vehicle_issues_write on public.vehicle_issues
  for all
  using (public.auth_role() in ('super_admin', 'manager'))
  with check (public.auth_role() in ('super_admin', 'manager'));

-- ---------------------------------------------------------------------
-- MAINTENANCE
-- ---------------------------------------------------------------------

create policy maintenance_select on public.maintenance
  for select
  using (public.auth_role() in ('super_admin', 'manager', 'staff'));

create policy maintenance_write on public.maintenance
  for all
  using (public.auth_role() in ('super_admin', 'manager'))
  with check (public.auth_role() in ('super_admin', 'manager'));
