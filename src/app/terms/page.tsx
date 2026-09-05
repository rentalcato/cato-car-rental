import Link from "next/link";
import { getPublicBusinessInfo } from "@/lib/marketing/queries";

const LAST_UPDATED = "September 2026";

function Fill({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded bg-amber-500/20 px-1 py-0.5 font-medium text-amber-900 dark:text-amber-200">
      {children}
    </mark>
  );
}

// Public — no auth required. See src/lib/supabase/proxy.ts's PUBLIC_PATHS.
export default async function TermsPage() {
  const business = await getPublicBusinessInfo();
  const businessName = business?.business_name || "Cato Car Rental";

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        ← Back to home
      </Link>

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last Updated: {LAST_UPDATED}</p>

      <p className="mt-6 text-sm text-muted-foreground">
        These Terms of Service (&ldquo;Terms&rdquo;) govern the rental of vehicles from{" "}
        <strong className="text-foreground">{businessName}</strong> (&ldquo;{businessName}
        ,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By making a
        reservation or renting a vehicle from us, you (&ldquo;Renter,&rdquo; &ldquo;you,&rdquo;
        or &ldquo;your&rdquo;) agree to these Terms.
      </p>

      <div className="mt-8 space-y-8 text-sm text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">1. Rental Eligibility</h2>
          <p>To rent a vehicle from {businessName}, the primary renter must:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Be at least <strong className="text-foreground">18 years of age</strong>, unless otherwise specified for a particular vehicle.</li>
            <li>Hold a valid driver&apos;s licence that remains valid for the entire rental period.</li>
            <li>
              Present a valid government-issued photo identification, such as a passport, national
              identification card, or driver&apos;s licence.
            </li>
            <li>
              Provide any additional documentation reasonably required to verify identity,
              eligibility, or insurance coverage.
            </li>
            <li>Be the person named on the rental agreement.</li>
          </ul>
          <p className="mt-3">
            For international visitors, a valid foreign driver&apos;s licence may be accepted where
            permitted. An International Driving Permit may be required where the licence is not
            written in English or Roman characters.
          </p>
          <p className="mt-3">
            {businessName} reserves the right to refuse a rental where required identification or
            licensing documentation is invalid, expired, unverifiable, or does not meet our rental
            requirements.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">2. Bookings &amp; Cancellations</h2>
          <p>
            A reservation is considered confirmed only after {businessName} has provided written
            confirmation of the booking.
          </p>
          <p className="mt-3">
            Reservations are subject to vehicle availability and the information provided by the
            renter at the time of booking.
          </p>
          <p className="mt-3">
            If you need to cancel or modify a reservation, please contact us as soon as possible.
          </p>
          <p className="mt-4 font-medium text-foreground">Cancellation Policy:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Cancellations made <Fill>[X hours/days]</Fill> or more before pickup may receive a
              full refund of eligible prepaid amounts.
            </li>
            <li>
              Cancellations made less than <Fill>[X hours/days]</Fill> before pickup may be subject
              to a cancellation fee of <Fill>[X% / fixed amount]</Fill>.
            </li>
            <li>
              Failure to collect the vehicle at the agreed pickup time without prior notice may be
              treated as a <strong className="text-foreground">no-show</strong> and may result in
              the loss of any applicable booking payment or deposit.
            </li>
            <li>
              If {businessName} is unable to provide the reserved vehicle due to circumstances
              within our control, we will make reasonable efforts to provide a suitable
              replacement or refund any applicable amount paid for the unavailable rental.
            </li>
          </ul>
          <p className="mt-3">
            Specific cancellation terms communicated at the time of booking may take precedence
            over this general policy.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">3. Payment &amp; Security Deposits</h2>
          <p>
            The total rental price, applicable taxes, fees, and any required security deposit will
            be communicated to the renter before or at the time of booking.
          </p>
          <p className="mt-3">
            Accepted payment methods may include cash, bank transfer, debit card, credit card, or
            other payment methods approved by {businessName}.
          </p>
          <p className="mt-3">
            A refundable security deposit may be required before the vehicle is released to the
            renter.
          </p>
          <p className="mt-3">
            The security deposit is intended to cover amounts for which the renter may become
            responsible, including:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Vehicle damage;</li>
            <li>Loss of or damage to vehicle accessories or equipment;</li>
            <li>Excessive cleaning;</li>
            <li>Missing items;</li>
            <li>Fuel shortages;</li>
            <li>Late-return charges;</li>
            <li>Unauthorized use;</li>
            <li>Traffic fines or penalties attributable to the renter; and</li>
            <li>Other charges permitted under the rental agreement.</li>
          </ul>
          <p className="mt-3">
            The remaining balance of the security deposit will be returned after the vehicle has
            been inspected and any applicable charges have been determined.
          </p>
          <p className="mt-3">
            The security deposit does not limit the renter&apos;s liability for losses or damages
            that exceed the amount of the deposit.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">4. Vehicle Use &amp; Liability</h2>
          <p>
            The renter agrees to operate the vehicle responsibly and in accordance with all
            applicable laws and regulations of Jamaica.
          </p>
          <p className="mt-3">
            Only the renter and any additional drivers specifically approved and listed on the
            rental agreement may operate the vehicle.
          </p>
          <p className="mt-3">The vehicle must not be:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Used for illegal activities;</li>
            <li>Used for racing, speed testing, or other competitive activities;</li>
            <li>Driven while the driver is under the influence of alcohol or drugs;</li>
            <li>Used for off-road driving unless expressly authorized;</li>
            <li>Used to tow another vehicle or trailer unless expressly authorized;</li>
            <li>Subleased or rented to another person;</li>
            <li>Used by an unauthorized driver; or</li>
            <li>Used in any manner that could reasonably cause unnecessary damage to the vehicle.</li>
          </ul>

          <h3 className="mt-4 font-medium text-foreground">Vehicle Condition</h3>
          <p className="mt-2">
            The renter is responsible for returning the vehicle in substantially the same
            condition in which it was provided, excluding reasonable wear and tear.
          </p>
          <p className="mt-2">
            The renter should notify {businessName} as soon as reasonably possible of any
            accident, mechanical issue, damage, theft, or other incident involving the vehicle.
          </p>

          <h3 className="mt-4 font-medium text-foreground">Fuel</h3>
          <p className="mt-2">
            Vehicles will be provided with an agreed level of fuel and should be returned with the
            same level unless otherwise agreed.
          </p>
          <p className="mt-2">
            If the vehicle is returned with less fuel than provided, the renter may be charged for
            the missing fuel and any applicable refueling service fee.
          </p>

          <h3 className="mt-4 font-medium text-foreground">Mileage</h3>
          <p className="mt-2">
            Where a mileage limit applies, the applicable mileage allowance and excess-mileage
            charges will be disclosed at the time of booking.
          </p>

          <h3 className="mt-4 font-medium text-foreground">Insurance</h3>
          <p className="mt-2">
            Insurance coverage is subject to the specific insurance policy applicable to the
            vehicle and rental.
          </p>
          <p className="mt-2">
            The renter remains responsible for any applicable deductible/excess and for losses or
            damage arising from circumstances excluded from the applicable insurance coverage.
          </p>
          <p className="mt-2">
            Insurance protection may not apply where the vehicle is used in breach of these Terms,
            including unauthorized driving, driving under the influence, illegal use, or other
            prohibited use.
          </p>
          <p className="mt-2">
            The renter should review the applicable insurance terms before accepting the vehicle.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">5. Accidents, Damage &amp; Theft</h2>
          <p>
            In the event of an accident, theft, vandalism, or other incident involving the rental
            vehicle, the renter must notify {businessName} as soon as reasonably possible and,
            where required, notify the appropriate authorities.
          </p>
          <p className="mt-3">
            The renter must cooperate fully with any investigation, insurance claim, or legal
            process arising from the incident.
          </p>
          <p className="mt-3">
            The renter must not admit liability, settle a third-party claim, or authorize repairs
            without prior approval from {businessName}, except where immediate action is
            reasonably necessary to protect people or prevent further damage.
          </p>
          <p className="mt-3">
            The renter may be responsible for losses, expenses, deductibles, or other charges
            arising from damage or loss to the vehicle to the extent permitted by the applicable
            rental agreement and insurance coverage.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">6. Vehicle Return</h2>
          <p>The vehicle must be returned on the agreed date, at the agreed time, and at the agreed location.</p>
          <p className="mt-3">Late returns may result in additional rental charges.</p>
          <p className="mt-3">
            Any extension of the rental period must be approved by {businessName} before the
            original return time. Continued use of the vehicle without authorization may result in
            additional charges and may affect applicable insurance coverage.
          </p>
          <p className="mt-3">
            The renter is responsible for returning the vehicle with all keys, documents,
            equipment, and accessories provided at the beginning of the rental.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">7. Governing Law</h2>
          <p>
            These Terms and any rental agreement entered into with {businessName} shall be
            governed by and interpreted in accordance with the laws of Jamaica.
          </p>
          <p className="mt-3">
            Any dispute arising from or relating to a vehicle rental shall be subject to the
            applicable courts and laws of Jamaica.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">8. Changes to These Terms</h2>
          <p>{businessName} may update these Terms from time to time.</p>
          <p className="mt-3">
            The Terms applicable to a particular rental are those in effect and communicated to
            the renter at the time the rental agreement is entered into, unless otherwise required
            by law.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">9. Contact</h2>
          <p>
            If you have questions regarding these Terms of Service, your reservation, or your
            rental agreement, please contact {businessName}:
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
        </section>

        <p className="border-t pt-6 text-xs">
          By making a reservation or accepting a vehicle from {businessName}, you acknowledge that
          you have read, understood, and agreed to these Terms of Service.
        </p>
      </div>
    </div>
  );
}
