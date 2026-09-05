import type { Metadata } from "next";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { HeroSection } from "@/components/marketing/hero-section";
import { FleetShowcase } from "@/components/marketing/fleet-showcase";
import { WhyChooseUs } from "@/components/marketing/why-choose-us";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { AboutSection } from "@/components/marketing/about-section";
import { SiteFooter } from "@/components/marketing/site-footer";
import {
  getFleetShowcase,
  getPublicBusinessInfo,
  getPublicBusinessLogoUrl,
} from "@/lib/marketing/queries";

// The tab title/meta description otherwise stayed the generic
// "Fleet Manager" default (from the root layout) regardless of the real
// business name set in Settings — this overrides it per-request with
// the real name once one's set, same fallback either way.
export async function generateMetadata(): Promise<Metadata> {
  const business = await getPublicBusinessInfo();
  const businessName = business?.business_name || "Fleet Manager";
  return {
    title: `${businessName} — Vehicle Rentals`,
    description: `Reliable, comfortable vehicle rentals from ${businessName}. Browse our fleet and book online.`,
  };
}

// Public — no auth required. See src/lib/supabase/proxy.ts's PUBLIC_PATHS.
export default async function HomePage() {
  const [vehicles, business] = await Promise.all([getFleetShowcase(), getPublicBusinessInfo()]);
  const businessName = business?.business_name || "Fleet Manager";
  const logoUrl = await getPublicBusinessLogoUrl(business?.logo_storage_path ?? null);

  return (
    <div>
      <MarketingNav businessName={businessName} logoUrl={logoUrl} />
      <main>
        <HeroSection />
        <FleetShowcase vehicles={vehicles} />
        <WhyChooseUs />
        <HowItWorks />
        <AboutSection businessName={businessName} />
      </main>
      <SiteFooter business={business} logoUrl={logoUrl} />
    </div>
  );
}
