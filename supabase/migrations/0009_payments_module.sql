-- =========================================================================
-- Car Rental Management System
-- Migration 0009: standalone Payments module.
-- Run after 0001-0008.
--
-- No new tables/columns/RLS — `payments` (0001) and its manager+-only
-- write policy (0003) already fit. A refund is just a negative
-- `payment_amount` row in the same append-only ledger (payments have no
-- `updated_at`; they're never edited, per the 0001 schema comment).
-- =========================================================================

-- ---------------------------------------------------------------------
-- record_payment() — the only path that records a payment/refund outside
-- checkout/check-in/completion (0006-0008). SECURITY DEFINER so the
-- payments insert and the rental's amount_paid/balance_due update stay
-- atomic, mirroring complete_rental()'s balance math — even though a
-- manager already has direct RLS rights to both tables, keeping this as
-- one controlled function matches the same invariant its three siblings
-- already established: a rental's financial state only changes through
-- a function, never a bare multi-step client update.
-- ---------------------------------------------------------------------

create or replace function public.record_payment(
  p_rental_id uuid,
  p_amount numeric,
  p_payment_method public.payment_method default null,
  p_payment_reference text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_rental public.rentals;
  v_payment_id uuid;
  v_new_amount_paid numeric(10, 2);
  v_new_balance numeric(10, 2);
begin
  v_role := public.auth_role();
  if v_role is null or v_role not in ('super_admin', 'manager') then
    raise exception 'Only a manager or super admin can record a payment.';
  end if;

  if p_amount is null or p_amount = 0 then
    raise exception 'Payment amount cannot be zero.';
  end if;

  select * into v_rental from public.rentals where id = p_rental_id;
  if not found then
    raise exception 'Rental % does not exist', p_rental_id;
  end if;

  v_new_amount_paid := coalesce(v_rental.amount_paid, 0) + p_amount;
  v_new_balance := coalesce(v_rental.total_amount, 0) - v_new_amount_paid;

  insert into public.payments (
    rental_id, customer_id, payment_amount, payment_method, payment_reference, received_by, notes
  ) values (
    p_rental_id, v_rental.customer_id, p_amount, p_payment_method, p_payment_reference, auth.uid(), p_notes
  ) returning id into v_payment_id;

  update public.rentals
  set amount_paid = v_new_amount_paid,
      balance_due = v_new_balance
  where id = p_rental_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    case when p_amount < 0 then 'payment_refunded' else 'payment_recorded' end,
    'payment',
    v_payment_id,
    jsonb_build_object('rental_id', p_rental_id, 'amount', p_amount)
  );

  return v_payment_id;
end;
$$;

grant execute on function public.record_payment(
  uuid, numeric, public.payment_method, text, text
) to authenticated;
