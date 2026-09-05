import Link from "next/link";
import { Car, Mail, MapPin, Phone } from "lucide-react";
import type { PublicBusinessInfo } from "@/types/database.types";

export function SiteFooter({ business }: { business: PublicBusinessInfo | null }) {
  const businessName = business?.business_name || "Fleet Manager";
  const year = new Date().getFullYear();

  return (
    <footer id="contact" className="scroll-mt-16 border-t bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Car className="size-5" />
              {businessName}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Reliable, comfortable and premium vehicles for every journey.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Contact</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {business?.phone ? (
                <li className="flex items-center gap-2">
                  <Phone className="size-3.5 shrink-0" />
                  {business.phone}
                </li>
              ) : null}
              {business?.email ? (
                <li className="flex items-center gap-2">
                  <Mail className="size-3.5 shrink-0" />
                  {business.email}
                </li>
              ) : null}
              {business?.address ? (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  <span>{business.address}</span>
                </li>
              ) : null}
              {!business?.phone && !business?.email && !business?.address ? (
                <li>Contact details coming soon.</li>
              ) : null}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Company</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#about" className="hover:text-foreground">About</a>
              </li>
              <li>
                <a href="#fleet" className="hover:text-foreground">Vehicles</a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-foreground">How It Works</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">Account</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/login" className="hover:text-foreground">Sign In</Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-foreground">Sign Up</Link>
              </li>
              <li className="text-muted-foreground/70">Terms of Service</li>
              <li className="text-muted-foreground/70">Privacy Policy</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center text-xs text-muted-foreground">
          &copy; {year} {businessName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
