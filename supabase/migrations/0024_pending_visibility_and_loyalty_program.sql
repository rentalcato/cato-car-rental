-- =========================================================================
-- Car Rental Management System
-- Migration 0024:
--   1. A vehicle with a pending (or any other open) reservation stays
--      visible in the public/customer fleet instead of disappearing the
--      instant a reservation is created — it just shows an honest status.
--      (check_vehicle_available_for_rental, 0007, already rejects a second
--      rental against a non-'available' vehicle — that conflict guard
--      needs no change here, only what the public listing shows.)
--   2. A non-staff customer may only have one pending (awaiting-approval)
--      reservation at a time.
--   3. A real, admin-configurable loyalty program: earning rules, redeemable
--      rewards, and a per-customer point ledger — replacing the
--      hardcoded tiers in lib/loyalty/compute.ts.
-- Run after 0001-0023.
-- =========================================================================

-- ---------------------------------------------------------------------
-- 1. create_reservation (0021, latest) — additive: a non-staff caller
-- may not open a second pending reservation while one is still awaiting
-- approval. Staff are unaffected (they may need to create/manage several
-- reservations for different walk-in customers). Everything else here is
-- copied verbatim from 0021 — see that file for the approval_status cast
-- fix this preserves.
-- ---------------------------------------------------------------------

create or replace function public.create_reservation(
  p_customer_id uuid,
  p_vehicle_id uuid,
  p_rental_start timestamptz,
  p_duration_days integer,
  p_deposit_amount numeric default 0,
  p_notes text default null,
  p_override_blacklist boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_customer_status public.customer_status;
  v_daily_rate numeric(10, 2);
  v_expected_return timestamptz;
  v_subtotal numeric(10, 2);
  v_rental_id uuid;
  v_is_staff boolean;
begin
  v_role := public.auth_role();
  if v_role is null then
    raise exception 'Not authorized.';
  end if;
  v_is_staff := v_role in ('super_admin', 'manager', 'staff');

  if not v_is_staff then
    if p_customer_id is distinct from (select id from public.customers where profile_id = auth.uid()) then
      raise exception 'You can only book a reservation for your own account.';
    end if;

    if exists (
      select 1 from public.rentals
      where customer_id = p_customer_id
        and rental_status = 'reserved'
        and approval_status = 'pending'
    ) then
      raise exception 'You already have a pending reservation. Please wait for it to be reviewed or manage your existing reservation before submitting another.';
    end if;
  end if;

  if p_duration_days is null or p_duration_days < 1 then
    raise exception 'Rental duration must be at least 1 day.';
  end if;

  select status into v_customer_status from public.customers where id = p_customer_id;
  if not found then
    raise exception 'Customer % does not exist', p_customer_id;
  end if;

  if v_customer_status = 'blacklisted'
     and (v_role not in ('super_admin', 'manager') or not p_override_blacklist) then
    raise exception 'This customer is blacklisted. A manager or super admin must override to continue.';
  end if;

  select daily_rental_rate into v_daily_rate
  from public.vehicles where id = p_vehicle_id;
  if not found then
    raise exception 'Vehicle % does not exist', p_vehicle_id;
  end if;

  v_expected_return := p_rental_start + (p_duration_days || ' days')::interval;
  v_subtotal := coalesce(v_daily_rate, 0) * p_duration_days;

  insert into public.rentals (
    vehicle_id, customer_id, rental_start_datetime, rental_duration_days,
    expected_return_datetime, daily_rate, subtotal, total_amount,
    amount_paid, balance_due, deposit_amount, rental_status,
    approval_status, notes, created_by
  ) values (
    p_vehicle_id, p_customer_id, p_rental_start, p_duration_days,
    v_expected_return, v_daily_rate, v_subtotal, v_subtotal,
    0, v_subtotal, coalesce(p_deposit_amount, 0), 'reserved',
    case when v_is_staff then null else 'pending'::public.reservation_approval_status end,
    p_notes, auth.uid()
  ) returning id into v_rental_id;

  update public.vehicles set vehicle_status = 'reserved' where id = p_vehicle_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'reservation_created',
    'rental',
    v_rental_id,
    jsonb_build_object('customer_id', p_customer_id, 'vehicle_id', p_vehicle_id, 'self_service', not v_is_staff)
  );

  return v_rental_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. public_vehicle_listings — widen from `vehicle_status = 'available'`
-- to also include 'reserved'/'rented'/'overdue' (genuinely unavailable
-- states — maintenance/damaged/out_of_service — stay hidden; showing a
-- damaged car on the public site helps no one). Adds `vehicle_status`
-- itself plus the current open rental's approval_status, so the app can
-- render "Available" / "Reservation Pending" / "Reserved" / "Currently
-- Rented" instead of just disappearing. Column order: appended-only,
-- same CREATE OR REPLACE VIEW constraint noted in 0013/0017.
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
where v.vehicle_status in ('available', 'reserved', 'rented', 'overdue')
  and v.archived_at is null
  and v.is_featured = true;

grant select on public.public_vehicle_listings to anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Loyalty program — earning rules, redeemable rewards, and a
-- per-customer point ledger (balance is always SUM(points_delta), never
-- a separately-stored counter that could drift out of sync).
-- ---------------------------------------------------------------------

create table public.loyalty_earning_rules (
  id            uuid primary key default gen_random_uuid(),
  action_key    text not null unique,
  name          text not null,
  description   text,
  points        integer not null default 0,
  is_active     boolean not null default true,
  -- True for the handful of actions a real trigger below awards
  -- automatically (account_created, rental_completed, spend_per_dollar).
  -- Not a lock on the row — an admin can still rename/retune/disable
  -- any rule — it's purely informational, shown in the admin UI so
  -- editing action_key on one of these doesn't silently break the
  -- trigger it's wired to.
  is_system     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger set_updated_at before update on public.loyalty_earning_rules
  for each row execute function public.set_updated_at();

create table public.loyalty_rewards (
  id                uuid primary key default gen_random_uuid(),
  name              text not null unique,
  description       text,
  points_required   integer not null,
  -- Free text, not an enum: reward_value's shape genuinely differs by
  -- type ("$10", "15%", "1 day", "Next class up, subject to availability")
  -- and every type in the spec needs to render as a short label, not a
  -- computed amount.
  reward_type       text not null default 'custom',
  reward_value      text,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger set_updated_at before update on public.loyalty_rewards
  for each row execute function public.set_updated_at();

create table public.loyalty_point_transactions (
  id                    uuid primary key default gen_random_uuid(),
  customer_id           uuid not null references public.customers(id) on delete cascade,
  -- Positive = earned/adjusted up, negative = redeemed/adjusted down.
  points_delta          integer not null,
  transaction_type      text not null check (transaction_type in ('earned', 'redeemed', 'adjusted')),
  rule_id               uuid references public.loyalty_earning_rules(id) on delete set null,
  reward_id             uuid references public.loyalty_rewards(id) on delete set null,
  -- Label (and, for redemptions, the reward's points/value at the time)
  -- are snapshotted so history reads correctly even after the rule or
  -- reward is later edited or removed.
  label                 text not null,
  related_entity_type   text,
  related_entity_id     uuid,
  created_by            uuid references public.profiles(id) on delete set null,
  created_at            timestamptz not null default now()
);

create index loyalty_point_transactions_customer_id_idx
  on public.loyalty_point_transactions (customer_id, created_at desc);

alter table public.loyalty_earning_rules enable row level security;
alter table public.loyalty_rewards enable row level security;
alter table public.loyalty_point_transactions enable row level security;

-- Any signed-in user can see active rules/rewards (the customer loyalty
-- page needs "how to earn points" and "available rewards"); staff+ can
-- see everything, including inactive, for management.
create policy loyalty_earning_rules_select_active on public.loyalty_earning_rules
  for select using (is_active or public.auth_role() in ('super_admin', 'manager', 'staff'));

create policy loyalty_rewards_select_active on public.loyalty_rewards
  for select using (is_active or public.auth_role() in ('super_admin', 'manager', 'staff'));

-- Writes to rules/rewards are super_admin only, matching Settings'
-- existing access level (business/rental settings, users & roles,
-- website curation are all super_admin-gated — src/app/(dashboard)/settings).
create policy loyalty_earning_rules_write on public.loyalty_earning_rules
  for all
  using (public.auth_role() = 'super_admin')
  with check (public.auth_role() = 'super_admin');

create policy loyalty_rewards_write on public.loyalty_rewards
  for all
  using (public.auth_role() = 'super_admin')
  with check (public.auth_role() = 'super_admin');

-- A customer sees only their own transactions; staff+ can see everyone's
-- (customer support, and the manual "Award Points" tool needs a history
-- to show what's already been granted). No insert/update/delete policy
-- for `authenticated` at all — every write goes through the
-- SECURITY DEFINER functions below.
create policy loyalty_point_transactions_select_own on public.loyalty_point_transactions
  for select
  using (
    customer_id in (select id from public.customers where profile_id = auth.uid())
    or public.auth_role() in ('super_admin', 'manager', 'staff')
  );

-- ---------------------------------------------------------------------
-- 3a. Seed the exact examples from the spec — an admin can freely edit,
-- add to, or deactivate every one of these afterward.
-- ---------------------------------------------------------------------

insert into public.loyalty_earning_rules (action_key, name, description, points, is_active, is_system) values
  ('account_created', 'Create an account', 'Awarded once, the first time a customer''s login is connected to their customer record.', 100, true, true),
  ('rental_completed', 'Complete a rental', 'Awarded automatically when a rental is marked completed.', 500, true, true),
  ('spend_per_dollar', 'Spend $1', 'Points per whole currency unit paid — awarded automatically on every payment received.', 1, true, true),
  ('review_submitted', 'Leave a review', 'Manually awarded by staff until an on-site review feature exists.', 100, true, false),
  ('referral_completed', 'Refer a customer', 'Manually awarded by staff once a referred friend completes a rental.', 500, true, false)
on conflict (action_key) do nothing;

insert into public.loyalty_rewards (name, description, points_required, reward_type, reward_value, is_active) values
  ('$10 Discount', 'A flat discount applied to your next rental.', 500, 'fixed_discount', '$10', true),
  ('Free Vehicle Upgrade', 'Upgrade to the next vehicle class, subject to availability.', 1000, 'free_upgrade', 'Next class up', true),
  ('Free Rental Day', 'One additional rental day at no charge.', 2000, 'free_rental_day', '1 day', true)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------
-- 3b. grant_loyalty_points — the manual side: staff can award points for
-- any rule (including ones with no automatic trigger, like reviews and
-- referrals) to a specific customer.
-- ---------------------------------------------------------------------

create or replace function public.grant_loyalty_points(
  p_customer_id uuid,
  p_rule_id uuid,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_rule public.loyalty_earning_rules;
begin
  v_role := public.auth_role();
  if v_role is null or v_role not in ('super_admin', 'manager', 'staff') then
    raise exception 'Not authorized.';
  end if;

  select * into v_rule from public.loyalty_earning_rules where id = p_rule_id;
  if not found then
    raise exception 'Loyalty rule % does not exist', p_rule_id;
  end if;
  if not v_rule.is_active then
    raise exception 'This earning rule is currently inactive.';
  end if;
  if not exists (select 1 from public.customers where id = p_customer_id) then
    raise exception 'Customer % does not exist', p_customer_id;
  end if;

  insert into public.loyalty_point_transactions (
    customer_id, points_delta, transaction_type, rule_id, label, created_by
  ) values (
    p_customer_id, v_rule.points, 'earned', v_rule.id,
    v_rule.name || coalesce(' — ' || p_note, ''), auth.uid()
  );
end;
$$;

grant execute on function public.grant_loyalty_points(uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- 3c. redeem_loyalty_reward — the customer side: spend points on an
-- active reward, only if the balance covers it.
-- ---------------------------------------------------------------------

create or replace function public.redeem_loyalty_reward(p_reward_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_reward public.loyalty_rewards;
  v_balance integer;
begin
  if auth.uid() is null then
    raise exception 'Not authorized.';
  end if;

  select id into v_customer_id from public.customers where profile_id = auth.uid();
  if v_customer_id is null then
    raise exception 'Your account is not linked to a customer record yet.';
  end if;

  select * into v_reward from public.loyalty_rewards where id = p_reward_id;
  if not found then
    raise exception 'Reward % does not exist', p_reward_id;
  end if;
  if not v_reward.is_active then
    raise exception 'This reward is no longer available.';
  end if;

  select coalesce(sum(points_delta), 0) into v_balance
  from public.loyalty_point_transactions where customer_id = v_customer_id;

  if v_balance < v_reward.points_required then
    raise exception 'You need % more points to redeem this reward.', v_reward.points_required - v_balance;
  end if;

  insert into public.loyalty_point_transactions (
    customer_id, points_delta, transaction_type, reward_id, label
  ) values (
    v_customer_id, -v_reward.points_required, 'redeemed', v_reward.id, 'Redeemed: ' || v_reward.name
  );

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(), 'loyalty_reward_redeemed', 'customer', v_customer_id,
    jsonb_build_object('reward_id', v_reward.id, 'reward_name', v_reward.name, 'points_required', v_reward.points_required)
  );
end;
$$;

grant execute on function public.redeem_loyalty_reward(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 3d. Automatic earning triggers — each checks its rule is active and
-- looks up its current point value at the moment it fires (so a later
-- admin edit to the rule's points applies to every future award
-- immediately, per the spec, without touching these functions).
-- ---------------------------------------------------------------------

create or replace function public.award_points_on_customer_linked()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rule public.loyalty_earning_rules;
  v_newly_linked boolean;
begin
  v_newly_linked := new.profile_id is not null
    and (tg_op = 'INSERT' or old.profile_id is null);

  if not v_newly_linked then
    return new;
  end if;

  select * into v_rule from public.loyalty_earning_rules
  where action_key = 'account_created' and is_active;
  if not found then
    return new;
  end if;

  -- Idempotency guard: never award this twice for the same customer,
  -- even if this trigger somehow fires again for an unrelated update.
  if exists (
    select 1 from public.loyalty_point_transactions
    where customer_id = new.id and rule_id = v_rule.id
  ) then
    return new;
  end if;

  insert into public.loyalty_point_transactions (
    customer_id, points_delta, transaction_type, rule_id, label
  ) values (
    new.id, v_rule.points, 'earned', v_rule.id, v_rule.name
  );

  return new;
end;
$$;

create trigger customers_award_points_on_link
  after insert or update on public.customers
  for each row execute function public.award_points_on_customer_linked();

create or replace function public.award_points_on_rental_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rule public.loyalty_earning_rules;
begin
  if new.rental_status <> 'completed' or old.rental_status = 'completed' then
    return new;
  end if;

  select * into v_rule from public.loyalty_earning_rules
  where action_key = 'rental_completed' and is_active;
  if not found then
    return new;
  end if;

  insert into public.loyalty_point_transactions (
    customer_id, points_delta, transaction_type, rule_id, label,
    related_entity_type, related_entity_id
  ) values (
    new.customer_id, v_rule.points, 'earned', v_rule.id, v_rule.name,
    'rental', new.id
  );

  return new;
end;
$$;

create trigger rentals_award_points_on_completed
  after update on public.rentals
  for each row execute function public.award_points_on_rental_completed();

create or replace function public.award_points_on_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rule public.loyalty_earning_rules;
  v_points integer;
begin
  if new.payment_amount <= 0 then
    return new;
  end if;

  select * into v_rule from public.loyalty_earning_rules
  where action_key = 'spend_per_dollar' and is_active;
  if not found then
    return new;
  end if;

  v_points := floor(new.payment_amount * v_rule.points);
  if v_points <= 0 then
    return new;
  end if;

  insert into public.loyalty_point_transactions (
    customer_id, points_delta, transaction_type, rule_id, label,
    related_entity_type, related_entity_id
  ) values (
    new.customer_id, v_points, 'earned', v_rule.id, v_rule.name,
    'payment', new.id
  );

  return new;
end;
$$;

create trigger payments_award_points
  after insert on public.payments
  for each row execute function public.award_points_on_payment();
