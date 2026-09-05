-- =========================================================================
-- Car Rental Management System — Phase 1
-- Migration 0002: functions + triggers (run after 0001)
-- =========================================================================

-- ---------------------------------------------------------------------
-- updated_at auto-touch, applied to every table that has the column
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.vehicles
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.rentals
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.vehicle_issues
  for each row execute function public.set_updated_at();

create trigger set_updated_at before update on public.maintenance
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- rental_number auto-generation: RNT-<year>-000001, per-year sequence
-- ---------------------------------------------------------------------

create sequence if not exists public.rental_number_seq;

create or replace function public.generate_rental_number()
returns trigger
language plpgsql
as $$
begin
  if new.rental_number is null or new.rental_number = '' then
    new.rental_number := 'RNT-' || to_char(now() at time zone 'America/Jamaica', 'YYYY')
      || '-' || lpad(nextval('public.rental_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger generate_rental_number before insert on public.rentals
  for each row execute function public.generate_rental_number();

-- ---------------------------------------------------------------------
-- New auth.users row -> matching public.profiles row (default role: staff)
-- Promote the first real user to super_admin manually, see README.
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
    'staff'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
