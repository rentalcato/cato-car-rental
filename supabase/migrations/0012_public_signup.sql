-- =========================================================================
-- Car Rental Management System
-- Migration 0012: public landing page + real self-service sign-up.
-- Run after 0001-0011.
--
-- Sign-up uses the SAME Supabase Auth system as everything else — no
-- second auth system. What changes is the default role a brand-new
-- profile gets, plus two narrow public-read views so the landing page
-- can show real fleet/business data without loosening any existing RLS
-- policy on vehicles/vehicle_photos/app_settings.
-- =========================================================================

-- ---------------------------------------------------------------------
-- 1. New role: 'customer'. Additive to the enum. It intentionally never
--    appears in any requireRole([...]) allowlist or nav-config entry
--    anywhere in the app, so it has zero dashboard access by omission —
--    no RLS policy needs to change for this to be true.
-- ---------------------------------------------------------------------

alter type public.user_role add value if not exists 'customer';

-- ---------------------------------------------------------------------
-- 2. handle_new_user() — same trigger (0002), only the default role
--    changes: 'staff' -> 'customer'. This applies both to public
--    sign-ups AND to accounts an admin creates via the Supabase
--    dashboard — an admin now promotes a new hire to staff/manager/
--    super_admin from Settings -> Users & Roles instead.
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. public_vehicle_listings — safe subset for the public landing page.
--    Views run with their creator's privileges by default (this
--    migration's role), bypassing RLS on the underlying tables without
--    changing any policy on them. Deliberately omits license_plate —
--    the internal "primary business identifier" has no reason to be
--    published on a marketing page.
-- ---------------------------------------------------------------------

create view public.public_vehicle_listings as
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
  ) as photo_storage_path
from public.vehicles v
where v.vehicle_status = 'available'
  and v.archived_at is null;

grant select on public.public_vehicle_listings to anon, authenticated;

-- ---------------------------------------------------------------------
-- 4. public_business_info — just enough for the site footer/branding.
--    Excludes rental defaults/tax rate, which stay internal-only.
-- ---------------------------------------------------------------------

create view public.public_business_info as
select
  business_name,
  logo_storage_path,
  address,
  phone,
  email
from public.app_settings
where id = 1;

grant select on public.public_business_info to anon, authenticated;
