# Fleet Manager — Car Rental Management System

Phase 1 built the foundation: database schema, authentication and a
role-aware dashboard shell. Phase 2 added fleet (vehicle) management.
Phase 3 turns Customers into a full renter-profile system (documents,
status/blacklist workflow, audit logging) and adds rental checkout, plus
reservations (book now, check in later), rental completion (check-in/
return), a standalone Payments ledger, Settings + Reports, and
Maintenance & Issues. Every sidebar page now has real functionality —
nothing left is a placeholder. A public marketing homepage + real
self-service sign-up now sit in front of the internal dashboard.

Deployed at https://cato-car-rental.vercel.app (source:
https://github.com/rentalcato/cato-car-rental) — Vercel auto-deploys on
every push to `master`.

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
the values from step 1. Also fill in `SUPABASE_SERVICE_ROLE_KEY` (Project
Settings → API → **service_role secret**, not the anon key) — public sign-up
(`/signup`) needs it to create accounts as already-confirmed via the admin
API (see "Public site" below); nothing else in the app uses it. **Never**
prefix it with `NEXT_PUBLIC_` or import it into client code — it bypasses
RLS entirely. On Vercel, add it under Project Settings → Environment
Variables the same way as the other two.

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
10. `0010_settings_and_reports_support.sql` — the `app_settings` singleton
    table + the public `business-assets` bucket for the business logo
11. `0011_maintenance_and_issues.sql` — receipt/photo attachment columns,
    the new `damaged` vehicle status, and the private
    `maintenance-attachments` bucket
12. `0012_public_signup.sql` — the new `customer` role (see below), and
    two read-only views (`public_vehicle_listings`,
    `public_business_info`) that let the public homepage show real
    fleet/business data without loosening any existing RLS policy
13. `0013_featured_vehicles.sql` — adds `vehicles.is_featured` /
    `website_display_order` and updates `public_vehicle_listings` to
    respect them, so an admin can choose which vehicles the public
    homepage shows and in what order (Settings → Website)
14. `0014_customer_accounts.sql` — adds `customers.profile_id` (links a
    `customer`-role login to a real customer record) and three additive
    `select` policies so a signed-in customer can read only their own
    linked customer/rental/vehicle rows — see "Customer account area"
    below
15. `0015_customer_self_booking.sql` — lets a linked customer call
    `create_reservation`/`cancel_reservation` for their own record, and
    fixes a real gap those RPCs had: they were `SECURITY DEFINER`
    functions grantable to any `authenticated` user with no check that
    the caller had any right to the `customer_id`/`rental_id` passed
    in. Harmless while only staff had accounts; not harmless once
    public sign-up existed. **Apply this one even if you don't care
    about self-service booking.**
16. `0016_placeholder_vehicles.sql` — seeds the four vehicles that used
    to only exist as hardcoded stock photos (shown on the public site
    whenever the fleet was empty) as real, removable rows instead —
    plate `DEMO-001` through `DEMO-004`. See "Vehicles" below.
17. `0017_vehicle_specs.sql` — adds `vehicles.seats`/`transmission`/
    `body_type` (all optional) and two new enums
    (`transmission_type`, `body_type`), and updates
    `public_vehicle_listings` to expose all three.
18. `0018_customer_self_service.sql` — an additive select policy so a
    linked customer can read their own payment history, plus two
    narrow `SECURITY DEFINER` functions (`update_my_profile`,
    `update_my_contact_info`) letting any customer edit their own name
    and, once linked, their own contact details — deliberately not an
    RLS write policy, since a policy can't limit which *columns* get
    written and `profiles`/`customers` both carry fields (role,
    is_active, status, license/ID) a customer must never touch
    themselves.

Afterwards, check **Table Editor** — you should see `profiles`, `vehicles`,
`vehicle_photos`, `customers`, `customer_documents`, `audit_logs`,
`rentals`, `payments`, `vehicle_issues`, `maintenance`, all with the RLS
shield icon "on", and **Storage** should show `vehicle-photos`,
`customer-photos`, `business-assets` (all public), and
`customer-documents`, `maintenance-attachments` (both private).

## 4. Create your first user (Super Admin)

There's a public sign-up page now (`/signup`) — but it's for customers, not
staff. Every brand-new profile, whether self-signed-up or created via the
Supabase dashboard, defaults to the `customer` role, which has **no**
dashboard access at all (enforced by not appearing in any
`requireRole([...])` check anywhere in the app — see 0012's comments). You
promote a trusted account to actual staff access after it exists:

1. Supabase dashboard → **Authentication → Users → Add user** (or have them
   sign up at `/signup` themselves). This creates a matching
   `public.profiles` row with `role = 'customer'`.
2. Promote the very first account to Super Admin — this one step still needs
   SQL, since there's no admin yet to do it from the UI:

   ```sql
   update public.profiles set role = 'super_admin' where email = 'you@example.com';
   ```
3. From then on, promote everyone else from the app itself: sign in as that
   Super Admin → **Settings → Users & Roles** → change their role to
   `staff`/`manager`/`super_admin` as appropriate. No more manual SQL needed
   for day-to-day onboarding.

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
| customer    | **No staff dashboard access.** The default role for every brand-new profile (0012) — public sign-up or admin-created. Lands on `/account` (0014) instead: their own profile, and their own booking history once staff link their account to a `customers` record. An admin promotes a real account to one of the roles above from Settings → Users & Roles. |

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
with rental/maintenance/issue history. Add Vehicle also accepts photo(s)
directly on that same form (optional); Edit Vehicle has the same upload/
delete photo gallery the profile page has, so photos can be managed from
either place. If a photo upload on the Add form fails, the vehicle is
still saved (never lost over a photo hiccup) and its profile page shows
a banner pointing at the Photos tab to retry.

A vehicle also optionally records seats, transmission (Automatic/
Manual/Other) and body type (Sedan/SUV/Hatchback/Coupe/Convertible/Van/
Truck/Other) (0017) — shown on its profile, in the vehicle form, and on
the public/customer fleet pages in place of the old one-size-fits-all
"5 seats, Automatic, Sedan / SUV" text. A vehicle that predates these
fields just shows that same generic fallback until they're set.

Four placeholder vehicles ship seeded in (0016, plate `DEMO-001`–`DEMO-004`,
notes explain what they are) so the public site never launches looking
empty. They're ordinary vehicles — remove them the same way as any
other once you have real inventory: un-feature from **Settings →
Website** to hide them from the public site while keeping the record,
or **Archive**/delete them from the Vehicles list to remove them
entirely. `FALLBACK_VEHICLES` (hardcoded stock photos in
`src/lib/marketing/queries.ts`) still exists underneath as a last-resort
safety net for the rare case every vehicle, placeholders included, gets
removed — the public fleet section should never render truly empty.

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

**Payments** — a standalone ledger at `/payments` (manager+
only, matching nav-config), independent of the payments already captured
at checkout/check-in/completion: a "Payment" action on any Rentals-list
row records a payment or refund against that rental at any time (e.g.
the customer pays down their balance mid-rental, or a deposit gets
refunded). Refunds are just negative amounts in the same append-only
`payments` ledger — shown with a "Refund" badge and parenthesized amount
everywhere payment history is displayed.

**Settings** (`/settings`, super_admin only) — business info + logo
(public `business-assets` bucket), rental defaults (daily rate and
security deposit pre-fill the Add Vehicle / New Rental / New Reservation
forms; the rest — late fee, mileage, fuel policy — are stored for
reference but not yet auto-applied anywhere), and Users & Roles (change
an existing account's role, or deactivate/reactivate it — deactivating
now actually signs that account out, since `profiles.is_active` is
finally checked in `getCurrentUser()`). No new-account/invite flow —
accounts are still created via the Supabase dashboard by design.
Sidebar/topbar branding reads the business name + logo, falling back to
the "Fleet Manager" default when unset. Currency/timezone are stored and
editable but not yet threaded through the app's actual date/currency
formatting.

**Reports** (`/reports`, manager+) — revenue (today / this month /
all-time, plus a 12-month trend chart), fleet utilization, per-vehicle
revenue/maintenance-cost/profit, top customers by revenue, overdue
rentals, average rental duration, and reservation-to-active conversion
rate — all computed from live data (no fake numbers), no new tables
beyond Settings' one.

**Maintenance & Issues** (`/maintenance`, manager+) — the last
placeholder page, now two tabs:

- **Service Records**: log a maintenance record (type, dates, mileage,
  cost, provider, receipt upload) against any vehicle, with an
  optional "send to maintenance now" that flips the vehicle to the
  `maintenance` status. An "Upcoming Service" section flags anything
  due (or overdue) in the next 30 days.
- **Damage & Issues**: report damage/an issue (type, severity, repair
  cost, photo) against any vehicle, with an optional "take out of
  service" that sets a new `damaged` vehicle status. Open issues can
  be resolved from the same table.
- Either state clears via a shared "Return to Service" button on the
  vehicle profile — still blocked if that vehicle genuinely has an
  open rental (same 0008 trigger as everywhere else). No staff
  access to any of this, matching the existing nav-config gate.

**Public site** (`/`, no auth) — a real marketing homepage instead of the
old unconditional redirect to `/dashboard`: hero (Mercedes-AMG C63S,
`next/image`-optimized, the one place in the app that isn't a plain
`<img>` against Supabase Storage), fleet showcase (real available
vehicles with real prices when the fleet has any — including a real
uploaded photo if one exists — falling back to four curated demo cards
otherwise, one of which is a second Mercedes-Benz), why-choose-us,
how-it-works, an about section, and a footer sourced from Settings'
business info. Real fleet/business data is served through two new
read-only views rather than loosening any RLS policy on
`vehicles`/`vehicle_photos`/`app_settings` (see `Roles` above for the
`customer` role this also introduces). "Browse Vehicles"/"Reserve a
Vehicle" scroll to the fleet section — no fake public booking flow.
`/login` and `/signup` are real, unauthenticated pages; every dashboard
route is exactly as protected as before. `/signup` creates accounts via
the Supabase Auth **admin API** (`SUPABASE_SERVICE_ROLE_KEY`, see step 2)
with `email_confirm: true`, rather than the regular anon `signUp()` call —
so a new account is usable immediately, independent of the project's
"Confirm email" setting and its rate-limited default email sender. A
Super Admin controls which
vehicles show in the fleet section, and their order, from Settings →
Website (0013) — a vehicle also needs to be `available` for it to
actually appear; new vehicles default to shown so nothing changes until
someone opts one out.

The fleet section has a search box (client-side, filters by make/model/
category on the already-loaded list — no page reload) so a visitor can
find a specific vehicle rather than scan the whole grid; this section
is no longer capped at a fixed count, since a cap would fight the
search box (a vehicle the box can't find because it was cut off would
look broken, not intentional). Each fleet card is a real link to a public detail page (`/fleet/[id]`,
also unauthenticated) showing that vehicle's public-safe info from the
same view — no license plate/VIN/mileage, that's still internal-only.
Its "Reserve This Vehicle" button goes to `/login`, matching "no fake
public booking flow." Demo/fallback cards (shown when there's no real,
featured, available inventory yet) aren't real vehicles, so they link
to the contact section instead. `next.config.ts`'s `images.remotePatterns`
allow-lists both `images.unsplash.com` (stock fallback photos) and your
Supabase project's own storage hostname, derived from
`NEXT_PUBLIC_SUPABASE_URL` at build time — a real vehicle photo is a
Supabase Storage URL, and `next/image` hard-errors on any host that
isn't explicitly allowed.

**Customer account area** (`/account`, any signed-in user) — where a
`customer` login actually lands now instead of `/unauthorized`: their
profile (name/email, read-only — self profile editing isn't built yet),
and, once staff link their account to a real `customers` record, their
real booking history (0014). Linking happens from **Customers → a
customer's profile → Overview tab → "Website Account"** (manager+ only,
by the account's email) — unlinked customers see a "not linked yet"
message with the business's contact info instead of any booking data.
`/login` and the post-sign-in redirect both send a `customer` to
`/account` rather than `/dashboard` automatically; an explicit deep
link (e.g. bounced off a specific protected page) is still honored as
typed.

A **linked** customer can also self-book (0015): **Browse Fleet** in
the `/account` header shows the same bookable catalog as the public
homepage (`public_vehicle_listings`, no 8-car cap, no demo fallback),
opening a vehicle shows real details plus a booking form, and
submitting it calls the same `create_reservation()` RPC staff use —
it's a real reservation, not a "request" awaiting approval. A linked
customer can also cancel their own pending reservation from
`/account`. An **unlinked** customer can still browse, but the vehicle
page shows a "get connected first" message instead of a booking form.
Checking a reservation in (handing over the actual vehicle) stays
staff-only — that's an in-person, ID-verifying action, not something
exposed over the web. Browse Fleet has a search box (make/model only —
this catalog never carries the license plate) for finding a specific
vehicle in a larger fleet.

`/account` also has an **Edit** button (0018): any customer can change
their own name; once linked, the same dialog also edits their contact
details (phone, address, city/parish, emergency contact) — never the
sensitive fields (license/ID/status/notes), which stay staff-only from
the Customers screen. A linked customer's Payment History (amounts,
dates, methods) shows below their bookings, reusing the same table
component the staff-side customer profile uses.

**Not built yet**: reservation no-show/auto-expiry, editing a booked
reservation's vehicle/dates, email notifications, an audit-log viewer,
editing/deleting a maintenance or issue record once logged, and a
customer uploading their own ID/license documents (still staff-only,
from the Customers screen).
