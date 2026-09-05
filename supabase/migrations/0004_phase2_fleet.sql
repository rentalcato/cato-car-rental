-- =========================================================================
-- Car Rental Management System — Phase 2: Fleet Management
-- Migration 0004: archive support + vehicle photos (run after 0001-0003)
-- =========================================================================

-- ---------------------------------------------------------------------
-- 1. Archive support for vehicles ("Remove vehicle" = soft delete).
--    rentals.vehicle_id is `on delete restrict` (0001), so a hard delete
--    would fail anyway once a vehicle has rental history — archiving is
--    the correct, safe behaviour.
-- ---------------------------------------------------------------------

alter table public.vehicles add column if not exists archived_at timestamptz;

create index if not exists vehicles_archived_at_idx on public.vehicles (archived_at);

-- ---------------------------------------------------------------------
-- 2. Vehicle photos — one row per uploaded image, actual files live in
--    the 'vehicle-photos' Storage bucket created below.
-- ---------------------------------------------------------------------

create table public.vehicle_photos (
  id            uuid primary key default gen_random_uuid(),
  vehicle_id    uuid not null references public.vehicles (id) on delete cascade,
  storage_path  text not null,
  created_at    timestamptz not null default now()
);

create index vehicle_photos_vehicle_id_idx on public.vehicle_photos (vehicle_id);

alter table public.vehicle_photos enable row level security;

-- Mirrors vehicles_select / vehicles_write from 0003 (same auth_role() helper).
create policy vehicle_photos_select on public.vehicle_photos
  for select
  using (public.auth_role() in ('super_admin', 'manager', 'staff'));

create policy vehicle_photos_write on public.vehicle_photos
  for all
  using (public.auth_role() in ('super_admin', 'manager'))
  with check (public.auth_role() in ('super_admin', 'manager'));

-- ---------------------------------------------------------------------
-- 3. Storage bucket for vehicle photos. Public bucket = anyone with the
--    public URL can view an image (fine, these aren't sensitive), but
--    uploading/deleting still goes through the authenticated Storage API
--    and is RLS-gated below.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', true)
on conflict (id) do nothing;

create policy vehicle_photos_storage_insert on storage.objects
  for insert
  with check (
    bucket_id = 'vehicle-photos'
    and public.auth_role() in ('super_admin', 'manager')
  );

create policy vehicle_photos_storage_update on storage.objects
  for update
  using (
    bucket_id = 'vehicle-photos'
    and public.auth_role() in ('super_admin', 'manager')
  );

create policy vehicle_photos_storage_delete on storage.objects
  for delete
  using (
    bucket_id = 'vehicle-photos'
    and public.auth_role() in ('super_admin', 'manager')
  );
