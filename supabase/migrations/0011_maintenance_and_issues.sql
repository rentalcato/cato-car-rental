-- =========================================================================
-- Car Rental Management System
-- Migration 0011: Maintenance & Issues (the last placeholder sidebar page).
-- Run after 0001-0010.
--
-- No new tables and no RLS changes — `maintenance`/`vehicle_issues` and
-- their manager+-only write policies (0003) already fit exactly (this
-- page has no staff access at all, per nav-config). Just two attachment
-- columns, one new vehicle status, and a private bucket for receipts/
-- damage photos.
-- =========================================================================

alter table public.maintenance add column if not exists receipt_storage_path text;
alter table public.vehicle_issues add column if not exists photo_storage_path text;

-- Additive, non-destructive — existing rows/values are untouched. Not one
-- of the transitions protect_vehicle_status_transition (0008) guards, so
-- a vehicle can freely move into it, same as 'maintenance' already can;
-- moving back out to 'available' still goes through that same trigger.
alter type public.vehicle_status add value if not exists 'damaged';

-- ---------------------------------------------------------------------
-- maintenance-attachments — private bucket for receipts + damage photos.
-- This whole page is manager+-only already, so unlike customer-documents
-- (where staff do intake), every operation here is manager+-only too.
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('maintenance-attachments', 'maintenance-attachments', false)
on conflict (id) do nothing;

create policy maintenance_attachments_storage_select on storage.objects
  for select
  using (bucket_id = 'maintenance-attachments' and public.auth_role() in ('super_admin', 'manager'));

create policy maintenance_attachments_storage_insert on storage.objects
  for insert
  with check (bucket_id = 'maintenance-attachments' and public.auth_role() in ('super_admin', 'manager'));

create policy maintenance_attachments_storage_update on storage.objects
  for update
  using (bucket_id = 'maintenance-attachments' and public.auth_role() in ('super_admin', 'manager'));

create policy maintenance_attachments_storage_delete on storage.objects
  for delete
  using (bucket_id = 'maintenance-attachments' and public.auth_role() in ('super_admin', 'manager'));
