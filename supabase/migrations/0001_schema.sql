-- =========================================================================
-- Car Rental Management System — Phase 1
-- Migration 0001: extensions, enums, tables, indexes, foreign keys
-- Run this in the Supabase SQL Editor first (before 0002 and 0003).
-- =========================================================================

-- gen_random_uuid() lives here; Supabase projects usually have it already,
-- "if not exists" makes this safe to re-run.
create extension if not exists pgcrypto with schema extensions;

-- Keep the database's own idea of "now" readable in Jamaica local time
-- (Jamaica does not observe DST, fixed UTC-5). All timestamp columns are
-- still stored as timestamptz (UTC) — this only affects things like
-- default expressions and SQL Editor debugging. Wrapped so a permissions
-- error on hosted Postgres doesn't abort the rest of the migration; the
-- app formats every displayed date/time in America/Jamaica regardless.
do $$
begin
  execute 'alter database postgres set timezone to ''America/Jamaica''';
exception when insufficient_privilege then
  raise notice 'Skipped ALTER DATABASE timezone (insufficient privilege) — app-level formatting still applies America/Jamaica.';
end
$$;

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------

create type public.user_role as enum ('super_admin', 'manager', 'staff');

create type public.vehicle_status as enum (
  'available',
  'reserved',
  'rented',
  'overdue',
  'maintenance',
  'out_of_service'
);

create type public.rental_status as enum (
  'reserved',
  'active',
  'completed',
  'overdue',
  'cancelled'
);

create type public.issue_status as enum ('open', 'in_progress', 'resolved');

-- Not specified in the original spec — reasonable default, edit freely
-- before running this migration if you want different values.
create type public.issue_severity as enum ('low', 'medium', 'high', 'critical');

-- Not specified in the original spec — reasonable default.
create type public.fuel_type as enum (
  'gasoline',
  'diesel',
  'hybrid',
  'electric',
  'other'
);

-- Not specified in the original spec — reasonable default.
create type public.payment_method as enum (
  'cash',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'cheque',
  'online',
  'other'
);

-- ---------------------------------------------------------------------
-- PROFILES  (extends auth.users; this is where role lives)
-- ---------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  role        public.user_role not null default 'staff',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'App-level profile + role for each auth.users row.';

-- ---------------------------------------------------------------------
-- VEHICLES
-- ---------------------------------------------------------------------

create table public.vehicles (
  id                  uuid primary key default gen_random_uuid(),
  license_plate       text not null,
  make                text,
  model               text,
  year                integer,
  colour              text,
  vin                 text,
  daily_rental_rate   numeric(10, 2),
  current_mileage     integer,
  fuel_type           public.fuel_type,
  vehicle_status      public.vehicle_status not null default 'available',
  notes               text,
  date_added          date not null default current_date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint vehicles_license_plate_key unique (license_plate),
  constraint vehicles_vin_key unique (vin)
);

create index vehicles_vehicle_status_idx on public.vehicles (vehicle_status);
create index vehicles_make_model_idx on public.vehicles (make, model);

-- ---------------------------------------------------------------------
-- CUSTOMERS
-- ---------------------------------------------------------------------

create table public.customers (
  id                        uuid primary key default gen_random_uuid(),
  first_name                text not null,
  last_name                 text not null,
  email                     text,
  phone                     text,
  address                   text,
  drivers_license_number    text,
  drivers_license_expiry    date,
  identification_type       text,
  identification_number     text,
  emergency_contact         text,
  notes                     text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  constraint customers_email_key unique (email)
);

create index customers_drivers_license_number_idx on public.customers (drivers_license_number);
create index customers_last_name_first_name_idx on public.customers (last_name, first_name);

-- ---------------------------------------------------------------------
-- RENTALS
-- ---------------------------------------------------------------------

create table public.rentals (
  id                        uuid primary key default gen_random_uuid(),
  rental_number             text not null,
  vehicle_id                uuid not null references public.vehicles (id) on delete restrict,
  customer_id               uuid not null references public.customers (id) on delete restrict,
  rental_start_datetime     timestamptz,
  rental_duration_days      integer,
  expected_return_datetime  timestamptz,
  actual_return_datetime    timestamptz,
  daily_rate                numeric(10, 2),
  subtotal                  numeric(10, 2),
  discount                  numeric(10, 2) not null default 0,
  late_fee                  numeric(10, 2) not null default 0,
  additional_charges        numeric(10, 2) not null default 0,
  total_amount              numeric(10, 2),
  amount_paid               numeric(10, 2) not null default 0,
  balance_due               numeric(10, 2),
  deposit_amount            numeric(10, 2) not null default 0,
  rental_status             public.rental_status not null default 'reserved',
  checkout_mileage          integer,
  return_mileage            integer,
  -- Fuel level wasn't specified as a data type in the spec — using free
  -- text (e.g. "Full", "3/4", "1/2") to match common rental paperwork.
  checkout_fuel_level       text,
  return_fuel_level         text,
  notes                     text,
  created_by                uuid references public.profiles (id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  constraint rentals_rental_number_key unique (rental_number)
);

create index rentals_vehicle_id_idx on public.rentals (vehicle_id);
create index rentals_customer_id_idx on public.rentals (customer_id);
create index rentals_rental_status_idx on public.rentals (rental_status);
create index rentals_rental_start_datetime_idx on public.rentals (rental_start_datetime);
create index rentals_created_by_idx on public.rentals (created_by);

-- ---------------------------------------------------------------------
-- PAYMENTS
-- ---------------------------------------------------------------------

create table public.payments (
  id                 uuid primary key default gen_random_uuid(),
  rental_id          uuid not null references public.rentals (id) on delete restrict,
  customer_id        uuid not null references public.customers (id) on delete restrict,
  payment_amount     numeric(10, 2) not null,
  payment_method     public.payment_method,
  payment_reference  text,
  payment_date       timestamptz not null default now(),
  notes              text,
  received_by        uuid references public.profiles (id) on delete set null,
  -- Not in the original spec — added for audit consistency with the rest
  -- of the schema (payments have no updated_at: they're treated as immutable).
  created_at         timestamptz not null default now()
);

create index payments_rental_id_idx on public.payments (rental_id);
create index payments_customer_id_idx on public.payments (customer_id);
create index payments_payment_date_idx on public.payments (payment_date);

-- ---------------------------------------------------------------------
-- VEHICLE ISSUES
-- ---------------------------------------------------------------------

create table public.vehicle_issues (
  id             uuid primary key default gen_random_uuid(),
  vehicle_id     uuid not null references public.vehicles (id) on delete cascade,
  rental_id      uuid references public.rentals (id) on delete set null,
  issue_type     text,
  description    text,
  severity       public.issue_severity,
  reported_date  timestamptz not null default now(),
  resolved_date  timestamptz,
  repair_cost    numeric(10, 2),
  status         public.issue_status not null default 'open',
  reported_by    uuid references public.profiles (id) on delete set null,
  -- Not in the original spec — added for audit consistency.
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index vehicle_issues_vehicle_id_idx on public.vehicle_issues (vehicle_id);
create index vehicle_issues_rental_id_idx on public.vehicle_issues (rental_id);
create index vehicle_issues_status_idx on public.vehicle_issues (status);

-- ---------------------------------------------------------------------
-- MAINTENANCE
-- ---------------------------------------------------------------------

create table public.maintenance (
  id                     uuid primary key default gen_random_uuid(),
  vehicle_id             uuid not null references public.vehicles (id) on delete cascade,
  maintenance_type       text,
  description            text,
  service_date           date,
  next_service_date      date,
  mileage_at_service     integer,
  next_service_mileage   integer,
  cost                   numeric(10, 2),
  service_provider       text,
  notes                  text,
  -- Not in the original spec — added for audit consistency.
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index maintenance_vehicle_id_idx on public.maintenance (vehicle_id);
create index maintenance_service_date_idx on public.maintenance (service_date);
create index maintenance_next_service_date_idx on public.maintenance (next_service_date);
