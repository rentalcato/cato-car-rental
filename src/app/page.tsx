import { MarketingNav } from "@/components/marketing/marketing-nav";
import { HeroSection } from "@/components/marketing/hero-section";
import { FleetShowcase } from "@/components/marketing/fleet-showcase";
import { WhyChooseUs } from "@/components/marketing/why-choose-us";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { AboutSection } from "@/components/marketing/about-section";
import { SiteFooter } from "@/components/marketing/site-footer";
import { getFleetShowcase, getPublicBusinessInfo } from "@/lib/marketing/queries";

// Public — no auth required. See src/lib/supabase/proxy.ts's PUBLIC_PATHS.
export default async function HomePage() {
  const [vehicles, business] = await Promise.all([getFleetShowcase(), getPublicBusinessInfo()]);
  const businessName = business?.business_name || "Fleet Manager";

  return (
    <div>
      <MarketingNav businessName={businessName} />
      <main>
        <HeroSection />
        <FleetShowcase vehicles={vehicles} />
        <WhyChooseUs />
        <HowItWorks />
        <AboutSection businessName={businessName} />
      </main>
      <SiteFooter business={business} />
    </div>
  );
}
