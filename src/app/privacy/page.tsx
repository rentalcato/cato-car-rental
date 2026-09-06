import Link from "next/link";
import { getPublicBusinessInfo } from "@/lib/marketing/queries";

const LAST_UPDATED = "September 2026";

// Public — no auth required. See src/lib/supabase/proxy.ts's PUBLIC_PATHS.
export default async function PrivacyPage() {
  const business = await getPublicBusinessInfo();
  const businessName = business?.business_name || "Cato Car Rental";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        ← Back to home
      </Link>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last Updated: {LAST_UPDATED}</p>

      <p className="mt-6 text-sm text-muted-foreground">
        {businessName} (&ldquo;{businessName},&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
        &ldquo;our&rdquo;) respects your privacy and is committed to protecting the personal
        information you provide when using our website or rental services.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        This Privacy Policy explains what information we collect, how we use it, how we protect
        it, and the choices you may have regarding your information.
      </p>

      <div className="mt-8 space-y-8 text-sm text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">1. Information We Collect</h2>
          <p>Depending on how you interact with {businessName}, we may collect information including:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your name;</li>
            <li>Phone number;</li>
            <li>Email address;</li>
            <li>Residential or mailing address;</li>
            <li>Driver&apos;s licence information;</li>
            <li>Identification information required to process a rental;</li>
            <li>Rental dates and vehicle preferences;</li>
            <li>Payment and transaction information;</li>
            <li>Information provided through our contact or booking forms;</li>
            <li>Communications you have with us; and</li>
            <li>Information necessary to process, manage, or support your vehicle rental.</li>
          </ul>
          <p className="mt-3">
            We only request information that is reasonably necessary for providing our services,
            processing reservations, communicating with customers, or meeting legal and business
            requirements.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            2. Information Collected Automatically
          </h2>
          <p>When you visit our website, certain technical information may be collected automatically.</p>
          <p className="mt-3">This may include:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>IP address;</li>
            <li>Browser type and version;</li>
            <li>Device type;</li>
            <li>Operating system;</li>
            <li>Pages visited;</li>
            <li>Approximate location derived from IP address;</li>
            <li>Date and time of visits; and</li>
            <li>Other technical information about how you interact with our website.</li>
          </ul>
          <p className="mt-3">
            This information may be used to maintain website security, understand website usage,
            troubleshoot technical issues, and improve our website and services.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">3. How We Use Your Information</h2>
          <p>We may use your personal information to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Process and manage vehicle reservations;</li>
            <li>Provide rental services;</li>
            <li>Verify your identity and eligibility to rent a vehicle;</li>
            <li>Communicate with you regarding your reservation;</li>
            <li>Respond to questions and customer-service requests;</li>
            <li>Process payments;</li>
            <li>Manage deposits and rental charges;</li>
            <li>Maintain rental records;</li>
            <li>Prevent fraud, misuse, or unauthorized use of our vehicles;</li>
            <li>Comply with applicable legal and regulatory requirements;</li>
            <li>Improve our website and services; and</li>
            <li>Send promotional communications where permitted and where you have agreed to receive them.</li>
          </ul>
          <p className="mt-3">
            We will not use your personal information for purposes that are incompatible with the
            purpose for which it was collected unless permitted or required by law.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">4. Payment Information</h2>
          <p>Payments may be processed through third-party payment providers.</p>
          <p className="mt-3">
            {businessName} does not necessarily store complete credit or debit card information
            on its own systems. Where third-party payment processors are used, payment information
            may be handled according to their respective privacy policies and security practices.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">5. Sharing Your Information</h2>
          <p>We may share personal information when reasonably necessary to operate our business or provide our services.</p>
          <p className="mt-3">This may include sharing information with:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Payment processors;</li>
            <li>Insurance providers;</li>
            <li>Vehicle maintenance or service providers;</li>
            <li>Technology and website service providers;</li>
            <li>Professional advisers;</li>
            <li>Government authorities or law-enforcement agencies where legally required; and</li>
            <li>Other parties where necessary to protect our legal rights, customers, vehicles, or business.</li>
          </ul>
          <p className="mt-3">We do not sell your personal information to third parties.</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">6. Cookies and Similar Technologies</h2>
          <p>
            Our website may use cookies or similar technologies to improve functionality,
            understand website traffic, remember preferences, and improve the user experience.
          </p>
          <p className="mt-3">Some cookies may be provided by third-party services used on our website.</p>
          <p className="mt-3">
            You may be able to control or disable cookies through your browser settings. Disabling
            certain cookies may affect the functionality of portions of the website.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">7. Data Security</h2>
          <p>
            We take reasonable administrative, technical, and organizational measures to protect
            personal information against unauthorized access, loss, misuse, alteration, or
            disclosure.
          </p>
          <p className="mt-3">
            However, no method of transmitting or storing information electronically can be
            guaranteed to be completely secure. Therefore, while we take reasonable precautions, we
            cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">8. Data Retention</h2>
          <p>
            We retain personal information only for as long as reasonably necessary for the
            purposes described in this Privacy Policy, including providing services, maintaining
            business and rental records, resolving disputes, preventing fraud, and complying with
            legal or regulatory obligations.
          </p>
          <p className="mt-3">
            The length of time information is retained may vary depending on the type of
            information and the purpose for which it was collected.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">9. Your Privacy Rights</h2>
          <p>Depending on applicable law, you may have rights concerning your personal information, including the ability to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Request access to personal information we hold about you;</li>
            <li>Request correction of inaccurate or incomplete information;</li>
            <li>Request deletion of information where legally permitted;</li>
            <li>Ask about how your information is being used;</li>
            <li>Withdraw consent where processing is based on consent; and</li>
            <li>Raise a privacy-related complaint or concern.</li>
          </ul>
          <p className="mt-3">
            Requests relating to personal information may be subject to applicable legal
            requirements and reasonable verification procedures.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">10. Third-Party Websites</h2>
          <p>
            Our website may contain links to third-party websites, services, social-media
            platforms, mapping services, payment providers, or other external resources.
          </p>
          <p className="mt-3">
            {businessName} is not responsible for the privacy practices or content of third-party
            websites.
          </p>
          <p className="mt-3">
            We recommend reviewing the privacy policies of any third-party service before providing
            them with personal information.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">11. Children&apos;s Privacy</h2>
          <p>Our services are intended for adults who are legally eligible to rent vehicles.</p>
          <p className="mt-3">
            We do not knowingly collect personal information from children for the purpose of
            providing vehicle-rental services.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">12. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes to our
            services, technology, legal requirements, or business practices.
          </p>
          <p className="mt-3">
            When changes are made, the updated policy will be posted on this page with a revised
            &ldquo;Last Updated&rdquo; date.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">13. Contact Us</h2>
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or how{" "}
            {businessName} handles personal information, please contact us:
          </p>
          <p className="mt-3 font-medium text-foreground">{businessName}</p>
          <ul className="mt-1 space-y-1">
            {business?.phone ? (
              <li>
                Phone:{" "}
                <a href={`tel:${business.phone}`} className="underline underline-offset-2">
                  {business.phone}
                </a>
              </li>
            ) : null}
            {business?.email ? (
              <li>
                Email:{" "}
                <a href={`mailto:${business.email}`} className="underline underline-offset-2">
                  {business.email}
                </a>
              </li>
            ) : null}
          </ul>
          {!business?.phone && !business?.email ? (
            <p className="mt-1">
              See our{" "}
              <Link href="/#contact" className="underline underline-offset-2">
                contact information
              </Link>
              .
            </p>
          ) : null}
          <p className="mt-3">
            We will make reasonable efforts to respond to privacy-related inquiries in a timely
            manner.
          </p>
        </section>
      </div>
    </div>
  );
}
