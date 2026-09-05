-- =========================================================================
-- Car Rental Management System — Phase 2: Fleet Management
-- Migration 0005: guard rail preventing a rental from being created
-- against a vehicle that isn't available. The rental-creation UI itself
-- is Phase 3, but this trigger has no UI dependency, so it's safe (and
-- required by the Phase 2 spec) to put in place now.
-- =========================================================================

create or replace function public.check_vehicle_available_for_rental()
returns trigger
language plpgsql
as $$
declare
  v_status public.vehicle_status;
begin
  select vehicle_status into v_status from public.vehicles where id = new.vehicle_id;

  if v_status is null then
    raise exception 'Vehicle % does not exist', new.vehicle_id;
  end if;

  if v_status not in ('available', 'reserved') then
    raise exception 'Vehicle is not available for a new rental (current status: %)', v_status;
  end if;

  return new;
end;
$$;

create trigger check_vehicle_available_for_rental
  before insert on public.rentals
  for each row execute function public.check_vehicle_available_for_rental();
