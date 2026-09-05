-- =========================================================================
-- Car Rental Management System
-- Migration 0017: real per-vehicle seats/transmission/body type, replacing
-- the hardcoded "5 seats, Automatic, Sedan / SUV" shown for every vehicle
-- on the public site and customer account area. All three are optional —
-- existing vehicles just show sensible fallback text until set.
-- Run after 0001-0016.
-- =========================================================================

create type public.transmission_type as enum ('automatic', 'manual', 'other');

create type public.body_type as enum (
  'sedan', 'suv', 'hatchback', 'coupe', 'convertible', 'van', 'truck', 'other'
);

alter table public.vehicles add column if not exists seats integer;
alter table public.vehicles add column if not exists transmission public.transmission_type;
alter table public.vehicles add column if not exists body_type public.body_type;

-- Give the 0016 placeholder vehicles real values too, so they demonstrate
-- the new fields immediately instead of showing the generic fallback.
update public.vehicles set seats = 5, transmission = 'automatic', body_type = 'sedan'
  where license_plate = 'DEMO-001';
update public.vehicles set seats = 5, transmission = 'automatic', body_type = 'suv'
  where license_plate = 'DEMO-002';
update public.vehicles set seats = 5, transmission = 'automatic', body_type = 'sedan'
  where license_plate = 'DEMO-003';
update public.vehicles set seats = 5, transmission = 'automatic', body_type = 'suv'
  where license_plate = 'DEMO-004';

-- public_vehicle_listings (0012, columns appended-only since — see 0013's
-- note on CREATE OR REPLACE VIEW column ordering) needs these three so the
-- public site and customer account area can show/search on real values.
create or replace view public.public_vehicle_listings as
select
  v.id,
  v.make,
  v.model,
  v.year,
  v.colour,
  v.daily_rental_rate,
  v.fuel_type,
  (
    select vp.storage_path
    from public.vehicle_photos vp
    where vp.vehicle_id = v.id
    order by vp.created_at asc
    limit 1
  ) as photo_storage_path,
  v.website_display_order,
  v.seats,
  v.transmission,
  v.body_type
from public.vehicles v
where v.vehicle_status = 'available'
  and v.archived_at is null
  and v.is_featured = true;
