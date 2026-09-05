-- =========================================================================
-- Car Rental Management System
-- Migration 0018: lets a linked customer (0014) view their own payment
-- history, and lets any customer update their own name plus (once
-- linked) their own contact details — the two gaps flagged as "not
-- built yet" in the customer account area.
-- Run after 0001-0017.
-- =========================================================================

-- ---------------------------------------------------------------------
-- Payment history — additive select policy, same shape as
-- customers_select_own/rentals_select_own (0014).
-- ---------------------------------------------------------------------

create policy payments_select_own on public.payments
  for select
  using (
    customer_id in (select id from public.customers where profile_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- Self-service profile/contact editing. Deliberately two narrow
-- SECURITY DEFINER functions rather than an RLS write policy on
-- profiles/customers — a policy can restrict which *rows* are
-- writable but not which *columns*, and profiles/customers both carry
-- fields a customer must never touch themselves (role, is_active,
-- status, license/ID, notes...). These functions only ever write the
-- exact columns named below, regardless of what a caller sends.
-- ---------------------------------------------------------------------

create or replace function public.update_my_profile(p_full_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authorized.';
  end if;
  if p_full_name is null or btrim(p_full_name) = '' then
    raise exception 'Name cannot be empty.';
  end if;

  update public.profiles set full_name = btrim(p_full_name) where id = auth.uid();
end;
$$;

grant execute on function public.update_my_profile(text) to authenticated;

create or replace function public.update_my_contact_info(
  p_primary_phone text,
  p_secondary_phone text default null,
  p_address text default null,
  p_city_parish text default null,
  p_emergency_contact_name text default null,
  p_emergency_contact_phone text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authorized.';
  end if;

  select id into v_customer_id from public.customers where profile_id = auth.uid();
  if not found then
    raise exception 'Your account is not linked to a customer record yet.';
  end if;

  update public.customers
  set primary_phone = p_primary_phone,
      secondary_phone = p_secondary_phone,
      address = p_address,
      city_parish = p_city_parish,
      emergency_contact_name = p_emergency_contact_name,
      emergency_contact_phone = p_emergency_contact_phone
  where id = v_customer_id;
end;
$$;

grant execute on function public.update_my_contact_info(text, text, text, text, text, text) to authenticated;
