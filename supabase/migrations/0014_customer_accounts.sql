-- =========================================================================
-- Car Rental Management System
-- Migration 0014: link a customer's login (profiles, role='customer') to
-- their real customers record, so a signed-in customer can see their own
-- actual bookings instead of landing somewhere with nothing to show.
-- Run after 0001-0013.
-- =========================================================================

alter table public.customers add column if not exists profile_id uuid references public.profiles(id) on delete set null;

-- Plain unique constraint — allows any number of NULLs (most customers
-- stay unlinked), just prevents one account being linked to two records.
alter table public.customers
  drop constraint if exists customers_profile_id_key,
  add constraint customers_profile_id_key unique (profile_id);

-- ---------------------------------------------------------------------
-- Additive select policies — existing staff-facing policies from 0003
-- are untouched; Postgres ORs multiple policies for the same command.
-- ---------------------------------------------------------------------

create policy customers_select_own on public.customers
  for select
  using (profile_id = auth.uid());

create policy rentals_select_own on public.rentals
  for select
  using (
    customer_id in (select id from public.customers where profile_id = auth.uid())
  );

-- vehicles_select (0003) is staff-only — a customer's own rental needs to
-- embed its vehicle's make/model/plate, so this lets them read (only) a
-- vehicle they've actually rented. Not a real exposure: they already know
-- the plate of a car they've driven.
create policy vehicles_select_own_rental on public.vehicles
  for select
  using (
    id in (
      select vehicle_id from public.rentals
      where customer_id in (select id from public.customers where profile_id = auth.uid())
    )
  );
