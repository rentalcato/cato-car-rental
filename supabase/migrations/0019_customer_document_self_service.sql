-- =========================================================================
-- Car Rental Management System
-- Migration 0019: lets a linked customer (0014) upload and view their own
-- identification/license documents, instead of only staff being able to.
-- Deleting a submitted document stays staff-only (manager+, unchanged
-- from 0006) — a customer can add a corrected upload, not remove one
-- that's already on file.
-- Run after 0001-0018.
-- =========================================================================

-- ---------------------------------------------------------------------
-- customer_documents table — additive select/insert policies, same
-- shape as customers_select_own (0014). The existing staff policies
-- from 0006 are untouched.
-- ---------------------------------------------------------------------

create policy customer_documents_select_own on public.customer_documents
  for select
  using (
    customer_id in (select id from public.customers where profile_id = auth.uid())
  );

create policy customer_documents_insert_own on public.customer_documents
  for insert
  with check (
    customer_id in (select id from public.customers where profile_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- customer-documents Storage bucket — additive select/insert policies
-- scoped to the caller's own customer-id path segment (uploads are
-- always written as "<customer_id>/<document_type>/<file>", see
-- uploadCustomerDocument()/uploadMyDocument()). If the subquery finds no
-- linked customer, it returns NULL and the comparison is never true —
-- RLS treats a NULL USING/WITH CHECK result as "deny", so an unlinked
-- caller is correctly blocked with no special-case needed here.
-- ---------------------------------------------------------------------

create policy customer_documents_storage_select_own on storage.objects
  for select
  using (
    bucket_id = 'customer-documents'
    and (storage.foldername(name))[1] = (
      select id::text from public.customers where profile_id = auth.uid()
    )
  );

create policy customer_documents_storage_insert_own on storage.objects
  for insert
  with check (
    bucket_id = 'customer-documents'
    and (storage.foldername(name))[1] = (
      select id::text from public.customers where profile_id = auth.uid()
    )
  );
