import Link from "next/link";
import { getPublicBusinessInfo } from "@/lib/marketing/queries";

// Public — no auth required. See src/lib/supabase/proxy.ts's PUBLIC_PATHS.
// Placeholder structure only — see the notice below. Do not treat this
// as reviewed legal content.
export default async function TermsPage() {
  const business = await getPublicBusinessInfo();
  const businessName = business?.business_name || "this business";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        ← Back to home
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Terms of Service</h1>

      <div className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
        <p className="font-medium">This page is a placeholder.</p>
        <p className="mt-1 text-muted-foreground">
          The section headings below are a starting structure only — not reviewed legal text.
          Before relying on this page, have a lawyer review and replace this content with terms
          appropriate for {businessName}&apos;s actual rental policies, jurisdiction, and
          insurance requirements.
        </p>
      </div>

      <div className="mt-8 space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">1. Rental Eligibility</h2>
          <p>Minimum age, valid driver&apos;s license and identification requirements go here.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            2. Bookings &amp; Cancellations
          </h2>
          <p>How a reservation is confirmed, and the cancellation/no-show policy, go here.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            3. Payment &amp; Deposits
          </h2>
          <p>Accepted payment methods, deposit handling, and refund terms go here.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            4. Vehicle Use &amp; Liability
          </h2>
          <p>
            Permitted use, fuel/mileage policy, damage responsibility, and insurance terms go
            here.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">5. Governing Law</h2>
          <p>Which jurisdiction&apos;s law applies goes here.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">6. Contact</h2>
          <p>
            Questions about these terms — see{" "}
            <Link href="/#contact" className="underline underline-offset-2">
              contact information
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
