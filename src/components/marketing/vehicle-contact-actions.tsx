import Link from "next/link";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCallLink, getEmailLink, getWhatsAppLink } from "@/lib/marketing/contact-links";
import type { PublicBusinessInfo } from "@/types/database.types";

/** Real business contact info everywhere (Settings -> Business) — never invented numbers/emails. */
export function VehicleContactActions({
  business,
  contactHref,
  vehicleLabel,
}: {
  business: PublicBusinessInfo | null;
  contactHref: string;
  vehicleLabel: string;
}) {
  const whatsappHref = getWhatsAppLink(business?.phone);
  const callHref = getCallLink(business?.phone);
  const emailHref = getEmailLink(business?.email, `Question about the ${vehicleLabel}`);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Button variant="outline" size="sm" render={<Link href={contactHref} />}>
        <Mail className="size-3.5" />
        Contact Us
      </Button>
      {whatsappHref ? (
        <Button variant="outline" size="sm" render={<a href={whatsappHref} target="_blank" rel="noopener noreferrer" />}>
          <MessageCircle className="size-3.5" />
          WhatsApp
        </Button>
      ) : null}
      {callHref ? (
        <Button variant="outline" size="sm" render={<a href={callHref} />}>
          <Phone className="size-3.5" />
          Call Us
        </Button>
      ) : null}
      {emailHref ? (
        <Button variant="outline" size="sm" render={<a href={emailHref} />}>
          <Mail className="size-3.5" />
          Email
        </Button>
      ) : null}
    </div>
  );
}
