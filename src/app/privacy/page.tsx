import Link from "next/link";
import { getPublicBusinessInfo } from "@/lib/marketing/queries";

// Public — no auth required. See src/lib/supabase/proxy.ts's PUBLIC_PATHS.
// Placeholder structure only — see the notice below. Do not treat this
// as reviewed legal content.
export default async function PrivacyPage() {
  const business = await getPublicBusinessInfo();
  const businessName = business?.business_name || "this business";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        ← Back to home
      </Link>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Privacy Policy</h1>

      <div className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
        <p className="font-medium">This page is a placeholder.</p>
        <p className="mt-1 text-muted-foreground">
          The section headings below are a starting structure only — not reviewed legal text.
          Before relying on this page, have a lawyer review and replace this content so it
          accurately describes what {businessName} actually collects and how it&apos;s used,
          consistent with the privacy laws that apply to your customers.
        </p>
      </div>

      <div className="mt-8 space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">1. Information We Collect</h2>
          <p>
            Account details (name, email), and — for a booking — contact info, driver&apos;s
            license/ID, and rental history go here.
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">2. How It&apos;s Used</h2>
          <p>Verifying identity, processing a rental, and contacting you about a booking go here.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">3. Storage &amp; Security</h2>
          <p>How long records are kept, and what protects them, go here.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">4. Your Rights</h2>
          <p>How to request, correct, or delete your information goes here.</p>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">5. Contact</h2>
          <p>
            Questions about this policy — see{" "}
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
