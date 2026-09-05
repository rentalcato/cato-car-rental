-- =========================================================================
-- Car Rental Management System
-- Migration 0013: let an admin curate which vehicles appear on the public
-- homepage's fleet showcase, and in what order.
-- Run after 0001-0012.
-- =========================================================================

-- Defaults to true so existing behavior (every available vehicle shows)
-- doesn't change until an admin actually unfeatures something — this is
-- opt-out curation, not opt-in-and-suddenly-empty.
alter table public.vehicles add column if not exists is_featured boolean not null default true;
alter table public.vehicles add column if not exists website_display_order integer not null default 0;

-- Same policy shape as 0003/0012 — no RLS changes needed, vehicles_write
-- (manager+) already covers these two columns.

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
  v.website_display_order
from public.vehicles v
where v.vehicle_status = 'available'
  and v.archived_at is null
  and v.is_featured = true;
