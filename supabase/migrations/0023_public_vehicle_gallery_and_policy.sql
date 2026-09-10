-- =========================================================================
-- Car Rental Management System
-- Migration 0023: backend support for the richer public/customer Vehicle
-- Details page — an image gallery (previously only the first uploaded
-- photo was exposed publicly) and a real, staff-controlled rental policy
-- (deposit/mileage/fuel/late-fee) instead of that page inventing generic
-- policy copy.
-- Run after 0001-0022.
-- =========================================================================

-- ---------------------------------------------------------------------
-- 1. public_vehicle_listings — additive `photo_storage_paths`, every
-- uploaded photo for the vehicle (oldest first) rather than just the
-- first one. Everything else — columns, order, and critically the
-- `is_featured = true` filter (0013/0017: an admin curates this pool
-- via Settings -> Website) — is carried over unchanged from 0017, the
-- last migration to touch this view. `photo_storage_path` (singular)
-- stays too — existing code that only ever wanted a thumbnail keeps
-- working unchanged.
-- ---------------------------------------------------------------------

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
  v.body_type,
  (
    select array_agg(vp.storage_path order by vp.created_at asc)
    from public.vehicle_photos vp
    where vp.vehicle_id = v.id
  ) as photo_storage_paths
from public.vehicles v
where v.vehicle_status = 'available'
  and v.archived_at is null
  and v.is_featured = true;

grant select on public.public_vehicle_listings to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. public_rental_policy — the subset of app_settings (0010) that's
-- genuinely useful on a customer-facing vehicle page (deposit, mileage
-- allowance, fuel policy, late fee, hours) and safe to publish (excludes
-- tax_rate/default_daily_rate/grace_period internals staff wouldn't want
-- shown as marketing copy... except grace_period_hours, which IS shown —
-- "how late can I return without a fee" is exactly what a renter needs
-- to know upfront).
-- ---------------------------------------------------------------------

create view public.public_rental_policy as
select
  currency,
  grace_period_hours,
  late_fee_per_day,
  default_security_deposit,
  mileage_limit_per_day,
  mileage_overage_fee,
  fuel_policy,
  business_hours
from public.app_settings
where id = 1;

grant select on public.public_rental_policy to anon, authenticated;
