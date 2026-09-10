-- =========================================================================
-- Car Rental Management System
-- Migration 0025:
--   1. Narrows 0024's fleet-visibility change: a vehicle only stays
--      visible while its reservation is still *pending* approval. The
--      moment it's approved (or was staff-created, which is
--      pre-approved) it comes off the public/customer fleet entirely —
--      same as an active rental already did — until it's cancelled or
--      returned. Pending-and-visible was the actual ask last time;
--      "approved means held" was the gap this request closed.
--   2. Notifies a customer in their Notification Center whenever they
--      earn or redeem loyalty points — the ledger already recorded
--      these (0024), nothing announced them.
-- Run after 0001-0024.
-- =========================================================================

-- ---------------------------------------------------------------------
-- 1. public_vehicle_listings — same columns as 0024 (appended-only,
-- see 0013/0017's note), narrower WHERE clause. Computed once in an
-- inner subquery so the "pending only" filter doesn't need to repeat
-- the correlated approval_status lookup.
-- ---------------------------------------------------------------------

create or replace view public.public_vehicle_listings as
select * from (
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
    ) as photo_storage_paths,
    v.vehicle_status,
    (
      select r.approval_status::text
      from public.rentals r
      where r.vehicle_id = v.id
        and r.rental_status in ('reserved', 'active', 'overdue')
      order by r.created_at desc
      limit 1
    ) as current_rental_approval_status
  from public.vehicles v
  where v.archived_at is null
    and v.is_featured = true
) listing
where listing.vehicle_status = 'available'
   or (listing.vehicle_status = 'reserved' and listing.current_rental_approval_status = 'pending');

grant select on public.public_vehicle_listings to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Loyalty point notifications — one trigger on the ledger itself
-- covers every source (the three automatic triggers, a manual staff
-- grant, and redemption) instead of duplicating an insert in each.
-- ---------------------------------------------------------------------

create or replace function public.notify_on_loyalty_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  select profile_id into v_profile_id from public.customers where id = new.customer_id;
  if v_profile_id is null then
    return new;
  end if;

  if new.points_delta > 0 then
    insert into public.notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
    values (
      v_profile_id, 'loyalty_points_earned', 'Loyalty points earned',
      'You earned ' || new.points_delta || ' points — ' || new.label || '.',
      'loyalty_transaction', new.id
    );
  elsif new.points_delta < 0 then
    insert into public.notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
    values (
      v_profile_id, 'loyalty_points_redeemed', 'Reward redeemed',
      abs(new.points_delta) || ' points used — ' || new.label || '.',
      'loyalty_transaction', new.id
    );
  end if;

  return new;
end;
$$;

create trigger loyalty_point_transactions_notify
  after insert on public.loyalty_point_transactions
  for each row execute function public.notify_on_loyalty_transaction();
