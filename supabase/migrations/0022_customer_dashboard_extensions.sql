-- =========================================================================
-- Car Rental Management System
-- Migration 0022: backend support for the expanded customer dashboard
-- (/account) — notifications, saved/favorite vehicles, digital check-in,
-- a couple of RLS gaps that only showed up once a customer's own booking
-- needed to display its vehicle's photo/condition, communication
-- preferences, and a business-hours field for the pickup/return screen.
-- Run after 0001-0021.
-- =========================================================================

-- ---------------------------------------------------------------------
-- 1. Notifications — one row per event a customer should see in their
-- Notification Center. Written only by the trigger functions below
-- (SECURITY DEFINER, owned by this migration's role, so they bypass RLS
-- as the table owner same as audit_logs writes elsewhere) — there is no
-- insert policy for `authenticated`, a customer can only ever read and
-- mark their own rows as read.
-- ---------------------------------------------------------------------

create table public.notifications (
  id                    uuid primary key default gen_random_uuid(),
  profile_id            uuid not null references public.profiles(id) on delete cascade,
  type                  text not null,
  title                 text not null,
  body                  text,
  related_entity_type   text,
  related_entity_id     uuid,
  read_at               timestamptz,
  created_at            timestamptz not null default now()
);

create index notifications_profile_id_idx on public.notifications (profile_id, created_at desc);
create index notifications_unread_idx on public.notifications (profile_id) where read_at is null;

alter table public.notifications enable row level security;

create policy notifications_select_own on public.notifications
  for select
  using (profile_id = auth.uid());

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authorized.';
  end if;

  update public.notifications
  set read_at = now()
  where id = p_notification_id and profile_id = auth.uid() and read_at is null;
end;
$$;

grant execute on function public.mark_notification_read(uuid) to authenticated;

create or replace function public.mark_all_notifications_read()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authorized.';
  end if;

  update public.notifications
  set read_at = now()
  where profile_id = auth.uid() and read_at is null;
end;
$$;

grant execute on function public.mark_all_notifications_read() to authenticated;

-- ---------------------------------------------------------------------
-- 1a. Notification-generating triggers. Best-effort by design (same
-- spirit as logAudit()): a linked customer gets a plain-language event
-- feed for exactly the state changes staff/self-service actions already
-- make today. A rental/payment with no linked customer profile
-- (v_profile_id null) simply writes nothing — not every customer has a
-- portal login.
-- ---------------------------------------------------------------------

create or replace function public.notify_rental_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_vehicle text;
begin
  select profile_id into v_profile_id
  from public.customers where id = coalesce(new.customer_id, old.customer_id);

  if v_profile_id is null then
    return coalesce(new, old);
  end if;

  select trim(coalesce(make, '') || ' ' || coalesce(model, '')) into v_vehicle
  from public.vehicles where id = coalesce(new.vehicle_id, old.vehicle_id);
  v_vehicle := nullif(v_vehicle, '');

  if tg_op = 'INSERT' then
    if new.approval_status = 'pending' then
      insert into public.notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
      values (
        v_profile_id, 'booking_pending', 'Booking request received',
        'Your request for the ' || coalesce(v_vehicle, 'vehicle') || ' is awaiting approval.',
        'rental', new.id
      );
    else
      insert into public.notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
      values (
        v_profile_id, 'booking_confirmed', 'Booking confirmed',
        'Your booking for the ' || coalesce(v_vehicle, 'vehicle') || ' is confirmed.',
        'rental', new.id
      );
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.approval_status = 'approved' and old.approval_status = 'pending' then
      insert into public.notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
      values (
        v_profile_id, 'booking_confirmed', 'Booking confirmed',
        'Your booking for the ' || coalesce(v_vehicle, 'vehicle') || ' has been approved.',
        'rental', new.id
      );
    elsif new.approval_status = 'denied' and old.approval_status = 'pending' then
      insert into public.notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
      values (
        v_profile_id, 'booking_declined', 'Booking declined',
        'Your request for the ' || coalesce(v_vehicle, 'vehicle') || ' could not be approved. Contact us for details.',
        'rental', new.id
      );
    end if;

    if new.rental_status = 'active' and old.rental_status = 'reserved' then
      insert into public.notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
      values (
        v_profile_id, 'vehicle_ready', 'Vehicle ready for pickup',
        'Your ' || coalesce(v_vehicle, 'vehicle') || ' has been checked out and is ready.',
        'rental', new.id
      );
    -- deny_reservation (0020) sets rental_status='cancelled' in the same
    -- update as approval_status='denied' — the "booking_declined"
    -- notification above already covers that case, skip the redundant
    -- second notification for what is, to the customer, one event.
    elsif new.rental_status = 'cancelled' and old.rental_status <> 'cancelled'
      and not (new.approval_status = 'denied' and old.approval_status = 'pending') then
      insert into public.notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
      values (
        v_profile_id, 'booking_cancelled', 'Booking cancelled',
        'Your booking for the ' || coalesce(v_vehicle, 'vehicle') || ' was cancelled.',
        'rental', new.id
      );
    elsif new.rental_status = 'completed' and old.rental_status <> 'completed' then
      insert into public.notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
      values (
        v_profile_id, 'rental_completed', 'Rental completed',
        'Thanks for renting the ' || coalesce(v_vehicle, 'vehicle') || ' — we hope you enjoyed the trip.',
        'rental', new.id
      );
    end if;
    return new;
  end if;

  return coalesce(new, old);
end;
$$;

create trigger rentals_notify_status_change
  after insert or update on public.rentals
  for each row execute function public.notify_rental_status_change();

create or replace function public.notify_payment_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
begin
  if new.payment_amount <= 0 then
    return new;
  end if;

  select profile_id into v_profile_id from public.customers where id = new.customer_id;
  if v_profile_id is not null then
    insert into public.notifications (profile_id, type, title, body, related_entity_type, related_entity_id)
    values (
      v_profile_id, 'payment_received', 'Payment received',
      'We received your payment of ' || to_char(new.payment_amount, 'FM999,999,999.00') || '.',
      'payment', new.id
    );
  end if;
  return new;
end;
$$;

create trigger payments_notify_received
  after insert on public.payments
  for each row execute function public.notify_payment_received();

-- ---------------------------------------------------------------------
-- 2. Saved/favorite vehicles — same shape as customer_documents
-- select/insert (0019), plus delete since removing a favorite is
-- expected to be entirely self-service.
-- ---------------------------------------------------------------------

create table public.customer_favorites (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid not null references public.customers(id) on delete cascade,
  vehicle_id    uuid not null references public.vehicles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (customer_id, vehicle_id)
);

create index customer_favorites_customer_id_idx on public.customer_favorites (customer_id);

alter table public.customer_favorites enable row level security;

create policy customer_favorites_select_own on public.customer_favorites
  for select
  using (customer_id in (select id from public.customers where profile_id = auth.uid()));

create policy customer_favorites_insert_own on public.customer_favorites
  for insert
  with check (customer_id in (select id from public.customers where profile_id = auth.uid()));

create policy customer_favorites_delete_own on public.customer_favorites
  for delete
  using (customer_id in (select id from public.customers where profile_id = auth.uid()));

-- A favorited vehicle can drift out of public_vehicle_listings (rented by
-- someone else, taken in for maintenance, etc.) — the Favorites screen
-- still needs to show it, so mirror vehicles_select_own_rental (0014) for
-- "a vehicle I've favorited", not just "a vehicle I've rented".
create policy vehicles_select_own_favorite on public.vehicles
  for select
  using (
    id in (
      select vehicle_id from public.customer_favorites
      where customer_id in (select id from public.customers where profile_id = auth.uid())
    )
  );

create policy vehicle_photos_select_own_favorite on public.vehicle_photos
  for select
  using (
    vehicle_id in (
      select vehicle_id from public.customer_favorites
      where customer_id in (select id from public.customers where profile_id = auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- 3. Digital check-in — one row per rental. Column-restricted writes go
-- through save_rental_checkin() (SECURITY DEFINER), same reasoning as
-- update_my_contact_info() (0018): an RLS write policy can't stop a
-- customer from touching a column it shouldn't, a function can.
-- ---------------------------------------------------------------------

create table public.rental_checkins (
  id                              uuid primary key default gen_random_uuid(),
  rental_id                       uuid not null unique references public.rentals(id) on delete cascade,
  customer_id                     uuid not null references public.customers(id) on delete cascade,
  license_confirmed               boolean not null default false,
  address_confirmed               boolean not null default false,
  emergency_contact_confirmed     boolean not null default false,
  agreement_accepted              boolean not null default false,
  agreement_accepted_at           timestamptz,
  additional_notes                text,
  completed_at                    timestamptz,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

alter table public.rental_checkins enable row level security;

create policy rental_checkins_select_own on public.rental_checkins
  for select
  using (customer_id in (select id from public.customers where profile_id = auth.uid()));

create or replace function public.save_rental_checkin(
  p_rental_id uuid,
  p_license_confirmed boolean,
  p_address_confirmed boolean,
  p_emergency_contact_confirmed boolean,
  p_agreement_accepted boolean,
  p_additional_notes text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_own_customer_id uuid;
  v_rental public.rentals;
  v_was_completed boolean;
  v_now_completed boolean;
begin
  v_role := public.auth_role();
  if v_role is null then
    raise exception 'Not authorized.';
  end if;

  select * into v_rental from public.rentals where id = p_rental_id;
  if not found then
    raise exception 'Booking % does not exist', p_rental_id;
  end if;

  if v_role not in ('super_admin', 'manager', 'staff') then
    select id into v_own_customer_id from public.customers where profile_id = auth.uid();
    if v_own_customer_id is null or v_rental.customer_id is distinct from v_own_customer_id then
      raise exception 'You can only check in for your own booking.';
    end if;
  end if;

  if v_rental.rental_status not in ('reserved', 'active') then
    raise exception 'Check-in is only available for an upcoming or active booking.';
  end if;

  select completed_at is not null into v_was_completed
  from public.rental_checkins where rental_id = p_rental_id;

  v_now_completed := p_license_confirmed and p_address_confirmed
    and p_emergency_contact_confirmed and p_agreement_accepted;

  insert into public.rental_checkins (
    rental_id, customer_id, license_confirmed, address_confirmed,
    emergency_contact_confirmed, agreement_accepted, agreement_accepted_at,
    additional_notes, completed_at, updated_at
  ) values (
    p_rental_id, v_rental.customer_id, p_license_confirmed, p_address_confirmed,
    p_emergency_contact_confirmed, p_agreement_accepted,
    case when p_agreement_accepted then now() else null end,
    p_additional_notes,
    case when v_now_completed then now() else null end,
    now()
  )
  on conflict (rental_id) do update set
    license_confirmed = excluded.license_confirmed,
    address_confirmed = excluded.address_confirmed,
    emergency_contact_confirmed = excluded.emergency_contact_confirmed,
    agreement_accepted = excluded.agreement_accepted,
    agreement_accepted_at = case
      when excluded.agreement_accepted and public.rental_checkins.agreement_accepted_at is not null
        then public.rental_checkins.agreement_accepted_at
      when excluded.agreement_accepted then now()
      else null
    end,
    additional_notes = excluded.additional_notes,
    completed_at = case when v_now_completed then coalesce(public.rental_checkins.completed_at, now()) else null end,
    updated_at = now();

  if v_now_completed and not coalesce(v_was_completed, false) then
    insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    values (auth.uid(), 'rental_checkin_completed', 'rental', p_rental_id, jsonb_build_object('self_service', v_role = 'customer'));
  end if;
end;
$$;

grant execute on function public.save_rental_checkin(uuid, boolean, boolean, boolean, boolean, text) to authenticated;

-- ---------------------------------------------------------------------
-- 4. Two RLS gaps a real booking detail screen runs straight into:
-- vehicles_select_own_rental (0014) covers the vehicles row itself, but
-- not its photos or any recorded condition issues — both needed so a
-- customer can see their own vehicle's picture and inspection history,
-- even while it's rented/reserved (i.e. excluded from the anonymous
-- public_vehicle_listings view by definition).
-- ---------------------------------------------------------------------

create policy vehicle_photos_select_own_rental on public.vehicle_photos
  for select
  using (
    vehicle_id in (
      select vehicle_id from public.rentals
      where customer_id in (select id from public.customers where profile_id = auth.uid())
    )
  );

create policy vehicle_issues_select_own_rental on public.vehicle_issues
  for select
  using (
    rental_id in (
      select id from public.rentals
      where customer_id in (select id from public.customers where profile_id = auth.uid())
    )
  );

-- maintenance-attachments is a private bucket (0011) — a signed URL for a
-- damage photo still needs a matching storage.objects select policy, not
-- just the table-row policy above.
create policy maintenance_attachments_storage_select_own on storage.objects
  for select
  using (
    bucket_id = 'maintenance-attachments'
    and exists (
      select 1
      from public.vehicle_issues vi
      join public.rentals r on r.id = vi.rental_id
      join public.customers c on c.id = r.customer_id
      where vi.photo_storage_path = storage.objects.name
        and c.profile_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 5. Communication preferences — two booleans a customer can flip
-- themselves, same narrow-function pattern as update_my_contact_info().
-- ---------------------------------------------------------------------

alter table public.customers add column if not exists email_notifications_enabled boolean not null default true;
alter table public.customers add column if not exists sms_notifications_enabled boolean not null default true;

create or replace function public.update_my_communication_prefs(
  p_email_notifications_enabled boolean,
  p_sms_notifications_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authorized.';
  end if;

  update public.customers
  set email_notifications_enabled = p_email_notifications_enabled,
      sms_notifications_enabled = p_sms_notifications_enabled
  where profile_id = auth.uid();

  if not found then
    raise exception 'Your account is not linked to a customer record yet.';
  end if;
end;
$$;

grant execute on function public.update_my_communication_prefs(boolean, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- 6. Business hours — free-text field alongside address/phone/email so
-- the customer-facing "Pickup & Return" screen can show real opening
-- hours instead of an invented default. Nullable: the dashboard falls
-- back to "Contact us" copy until a manager sets this in Settings.
-- ---------------------------------------------------------------------

alter table public.app_settings add column if not exists business_hours text;

create or replace view public.public_business_info as
select
  business_name,
  logo_storage_path,
  address,
  phone,
  email,
  business_hours
from public.app_settings
where id = 1;

-- ---------------------------------------------------------------------
-- 7. Support messages — the "Support/contact form" (customer dashboard,
-- Support section). Insert-only for a linked customer; no select policy
-- yet for `authenticated` beyond their own rows, since there's no staff
-- inbox UI built for this yet (a future phase's job — this just makes
-- sure a submission is durably captured for one to be built against,
-- same spirit as `notifications` above).
-- ---------------------------------------------------------------------

create table public.support_messages (
  id            uuid primary key default gen_random_uuid(),
  customer_id   uuid references public.customers(id) on delete set null,
  profile_id    uuid references public.profiles(id) on delete set null,
  name          text not null,
  email         text,
  phone         text,
  subject       text not null,
  message       text not null,
  status        text not null default 'open',
  created_at    timestamptz not null default now()
);

create index support_messages_profile_id_idx on public.support_messages (profile_id, created_at desc);

alter table public.support_messages enable row level security;

create policy support_messages_select_own on public.support_messages
  for select
  using (profile_id = auth.uid());

create policy support_messages_insert_own on public.support_messages
  for insert
  with check (profile_id = auth.uid());

-- Staff/manager+ visibility, matching the read access level of other
-- customer-facing tables (audit_logs_select in 0006 is manager+; this
-- mirrors that so a future Support inbox has somewhere to start from).
create policy support_messages_select_staff on public.support_messages
  for select
  using (public.auth_role() in ('super_admin', 'manager'));
