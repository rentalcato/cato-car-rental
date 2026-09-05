# Fleet Manager — Car Rental Management System

Phase 1 built the foundation: database schema, authentication and a
role-aware dashboard shell. Phase 2 added fleet (vehicle) management.
Phase 3 turns Customers into a full renter-profile system (documents,
status/blacklist workflow, audit logging) and adds rental checkout, plus
reservations (book now, check in later), rental completion (check-in/
return), and a standalone Payments ledger. Maintenance and Reports are
still open.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Supabase (Postgres, Auth, Row Level Security)
- Deployed later to Vercel — for now, run locally.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), sign in, and create a new project.
2. Wait for it to finish provisioning, then open **Project Settings → API**.
3. Copy the **Project URL** and the **anon public** key (and, if you want it
   for later scripting, the **service_role** key — keep that one secret).

## 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with
the values from step 1.

## 3. Run the database migrations

In the Supabase dashboard, open **SQL Editor**, and run every file in
`supabase/migrations/` **in order** (paste the whole file, click Run, then
move to the next one):

1. `0001_schema.sql` — extensions, enums, tables, indexes
2. `0002_functions_triggers.sql` — `updated_at` triggers, rental number
   generator, new-user → profile trigger
3. `0003_rls_policies.sql` — Row Level Security policies
4. `0004_phase2_fleet.sql` — vehicle archiving + the `vehicle-photos` bucket
5. `0005_vehicle_availability_guard.sql` — blocks a rental against an
   unavailable vehicle
6. `0006_phase3_customer_rental_management.sql` — the richer customer
   profile, `customer_documents`/`audit_logs` tables, the private
   `customer-documents` + public `customer-photos` buckets, and the
   `checkout_rental`/`set_customer_status` functions
7. `0007_reservations.sql` — tightens the 0005 availability guard, adds
   `create_reservation`/`activate_reservation`/`cancel_reservation`
8. `0008_rental_completion_and_fixes.sql` — `complete_rental` (check-in/
   return) and a trigger blocking manual `vehicle_status` edits that
   would double-book an active rental
9. `0009_payments_module.sql` — `record_payment`, for recording a
   payment or refund independent of checkout/check-in/completion

Afterwards, check **Table Editor** — you should see `profiles`, `vehicles`,
`vehicle_photos`, `customers`, `customer_documents`, `audit_logs`,
`rentals`, `payments`, `vehicle_issues`, `maintenance`, all with the RLS
shield icon "on", and **Storage** should show `vehicle-photos`,
`customer-photos` (both public) and `customer-documents` (private).

## 4. Create your first user (Super Admin)

There's no public sign-up page on purpose — this is an internal tool.

1. Supabase dashboard → **Authentication → Users → Add user**. Create a
   user with an email + password you'll use to log in.
2. This automatically creates a matching row in `public.profiles` with
   `role = 'staff'` (via the `handle_new_user` trigger). Promote it to
   Super Admin by running this in the SQL Editor:

   ```sql
   update public.profiles set role = 'super_admin' where email = 'you@example.com';
   ```

Repeat step 1 (with a different role assigned via the same `update`
statement) to create test `manager` and `staff` accounts if you want to see
how navigation/permissions differ per role.

## 5. Run the app

```bash
npm install
npm run dev
```

Visit http://localhost:3000 — you'll be redirected to `/login`. Sign in
with the Super Admin account you created above.

## Roles

| Role        | Can do |
|-------------|--------|
| super_admin | Everything, including changing a customer's status and hard-deleting a customer record (rarely needed — see Data Retention below) |
| manager     | Everything staff can, plus: change a customer's status (Active/Restricted/Blacklisted/Inactive), override a blacklist restriction at checkout/reservation check-in, delete a customer document, manage vehicles, view/manage payments and maintenance |
| staff       | Create/edit vehicles and customers, upload customer documents, search customers, check a customer out (create a rental) and complete/return it, and book/check-in/cancel reservations — see `src/components/layout/nav-config.ts` and `supabase/migrations/0003_rls_policies.sql`/`0006_phase3_customer_rental_management.sql`/`0007_reservations.sql`/`0008_rental_completion_and_fixes.sql`. Cannot change a customer's status, delete a document, or record a standalone payment/refund (Payments stays manager+ only). |

## Data retention

Customer profiles are never hard-deleted from the app once they have any
history — set their status to **Inactive** instead (via "Change status" on
their profile); this is the archive mechanism. A raw `delete` is still
possible for `super_admin` directly against the database, but the
`rentals`/`payments` foreign keys are `on delete restrict`, so it's blocked
automatically for any customer with rental or payment history.

Timezone: the app displays and reasons about dates/times in
`America/Jamaica` (`src/lib/constants.ts`); the database still stores
everything as UTC `timestamptz`, which is the correct practice.

## What's built so far

**Phase 1** — project scaffold, full database schema for every module,
Supabase Auth with 3 roles + Row Level Security, a responsive protected
dashboard shell (desktop sidebar / mobile drawer), and a role-gated
placeholder route for every module.

**Phase 2** — Fleet management: list with search/status filters, add/edit,
archive (soft delete) + restore, photo uploads, and a vehicle profile page
with rental/maintenance/issue history.

**Phase 3** — Customer/renter profile management + rental checkout:

- **Customers**: a full renter profile (personal/contact/license/ID
  details, auto-generated Customer ID, optional photo), status workflow
  (Active/Restricted/Blacklisted/Inactive — this is also the archive
  mechanism, see Data Retention), duplicate-customer detection on create,
  and a tabbed profile (overview, documents, rentals, payments, incidents)
  showing outstanding balance, lifetime spend, deposits held, payment
  history and damage/incident history.
- **Documents**: secure uploads (JPG/PNG/PDF, 10MB cap) to a private
  Storage bucket — never a public URL; every view/download goes through a
  60-second signed link and is audit-logged.
- **Rentals**: checkout only (search/select a customer, pick an available
  vehicle, set start + duration, auto-computed return date/total, optional
  deposit/initial payment, confirm) — creates an Active rental, flips the
  vehicle to Rented, and shows up as the vehicle's "Current Renter" and in
  the customer's rental history. A Blacklisted customer is hard-blocked
  unless a manager/super_admin explicitly overrides.
- **Audit log**: `audit_logs` table (append-only — no update/delete policy
  exists for any role) records every customer create/edit/status-change/
  document-upload/document-access/rental-checkout/reservation action. No
  viewer UI yet; query it via the Supabase Table Editor.

**Reservations** — booking a vehicle for a future pickup, separate from
walk-in checkout:

- A reservation is a `rentals` row (`rental_status = 'reserved'`, vehicle →
  `reserved`) — not a second table. The same license-expiry warning,
  status banner and blacklist-override rule from checkout apply at booking
  time.
- **Check In** converts the same row in place (`reserved` → `active`,
  fills in checkout mileage, optionally records a payment, vehicle →
  `rented`) — it re-checks the blacklist rule too, since status can change
  between booking and pickup. **Cancel** frees the vehicle back to
  `available`.
- The vehicle profile shows an "Upcoming Reservation" panel whenever a
  vehicle is `reserved`, alongside the existing "Current Renter" panel for
  `rented` vehicles.
- No editing a booked reservation's vehicle/dates (cancel + rebook) and no
  auto-expiry/no-show handling yet — both are deliberate v1 cuts.

**Rental completion (check-in/return)** — the other half of checkout: a
"Complete" action (on the vehicle's Current Renter card, the customer's
Current Rental card, and the Rentals list) records the actual return
date/mileage/fuel level, applies a late fee and/or additional charges,
optionally takes a final payment, marks the rental Completed, and frees
the vehicle back to Available. A database trigger blocks manually editing
a vehicle's status back to Available/Reserved while it still has a
matching open rental/reservation — the double-booking hole that not
having a completion step had otherwise left open.

**Payments** — a standalone ledger at `/dashboard/payments` (manager+
only, matching nav-config), independent of the payments already captured
at checkout/check-in/completion: a "Payment" action on any Rentals-list
row records a payment or refund against that rental at any time (e.g.
the customer pays down their balance mid-rental, or a deposit gets
refunded). Refunds are just negative amounts in the same append-only
`payments` ledger — shown with a "Refund" badge and parenthesized amount
everywhere payment history is displayed.

**Not built yet**: reservation no-show/auto-expiry, editing a booked
reservation's vehicle/dates, maintenance, email notifications, reports,
an audit-log viewer, Vercel deployment.
