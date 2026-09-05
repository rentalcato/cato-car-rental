-- =========================================================================
-- Car Rental Management System
-- Migration 0016: seeds the four placeholder vehicles that previously
-- only existed as hardcoded stock photos in src/lib/marketing/queries.ts
-- (FALLBACK_VEHICLES, shown on the public site only when the fleet was
-- empty) as real, manageable vehicles rows instead.
--
-- Why: as real rows, they now show up in the normal Vehicles list and in
-- Settings -> Website (0013) exactly like any other vehicle, so they can
-- be un-featured, archived or deleted from there once real inventory
-- exists — no code change needed to "turn them off." None of them have
-- an uploaded photo, so they keep showing the same stock photography as
-- before via getFleetShowcase()'s per-id fallback image assignment.
--
-- FALLBACK_VEHICLES itself is intentionally left in the code, as a
-- last-resort safety net for the (now unlikely) case where every
-- vehicle, placeholders included, has been removed — the public site
-- should never show a truly empty fleet section.
--
-- Idempotent: safe to re-run, does nothing if these plates already exist.
-- Run after 0001-0015.
-- =========================================================================

insert into public.vehicles (
  license_plate, make, model, year, daily_rental_rate, vehicle_status,
  is_featured, website_display_order, notes
) values
  ('DEMO-001', 'Mercedes-Benz', 'AMG C63S', null, 28000, 'available', true, 0,
   'Placeholder vehicle — safe to un-feature (Settings -> Website), archive, or delete once you have real inventory.'),
  ('DEMO-002', 'Mercedes-Benz', 'GLE SUV', null, 32000, 'available', true, 1,
   'Placeholder vehicle — safe to un-feature (Settings -> Website), archive, or delete once you have real inventory.'),
  ('DEMO-003', 'BMW', '5 Series', null, 18000, 'available', true, 2,
   'Placeholder vehicle — safe to un-feature (Settings -> Website), archive, or delete once you have real inventory.'),
  ('DEMO-004', 'Premium', 'Urban SUV', null, 20000, 'available', true, 3,
   'Placeholder vehicle — safe to un-feature (Settings -> Website), archive, or delete once you have real inventory.')
on conflict (license_plate) do nothing;
