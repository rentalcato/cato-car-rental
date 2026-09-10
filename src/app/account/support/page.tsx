import { Mail, MessageCircle, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SupportContactForm } from "@/components/account/support-contact-form";
import { getMyAccount } from "@/lib/account/queries";
import { getPublicBusinessInfo } from "@/lib/marketing/queries";
import { getCallLink, getEmailLink, getWhatsAppLink } from "@/lib/marketing/contact-links";

const FAQS = [
  {
    q: "What do I need to bring to pick up my vehicle?",
    a: "A valid driver's license, a government-issued photo ID, and the card used for the security deposit if one applies to your booking.",
  },
  {
    q: "Can I extend my rental?",
    a: "Yes — reach out to us as early as possible before your return date and we'll do our best to extend, subject to the vehicle's availability.",
  },
  {
    q: "What happens to my security deposit?",
    a: "It's collected at pickup and released after your vehicle is returned and inspected, minus any charges for damage, fuel, or late return.",
  },
  {
    q: "How do I cancel a reservation?",
    a: "Open the booking under My Rentals and select Cancel — this is available any time before your reservation is confirmed for pickup.",
  },
];

function ContactAction({
  href,
  icon: Icon,
  label,
  sublabel,
}: {
  href: string;
  icon: typeof Phone;
  label: string;
  sublabel: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{sublabel}</p>
      </div>
    </a>
  );
}

export default async function SupportPage(props: { searchParams: Promise<{ subject?: string }> }) {
  const { subject } = await props.searchParams;
  const [account, business] = await Promise.all([getMyAccount(), getPublicBusinessInfo()]);

  const whatsappHref = getWhatsAppLink(business?.phone);
  const callHref = getCallLink(business?.phone);
  const emailHref = getEmailLink(business?.email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
        <p className="text-sm text-muted-foreground">We&apos;re here to help — reach us however&apos;s easiest.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {whatsappHref ? (
          <ContactAction href={whatsappHref} icon={MessageCircle} label="WhatsApp" sublabel={business?.phone || "Chat with us"} />
        ) : null}
        {callHref ? (
          <ContactAction href={callHref} icon={Phone} label="Call Us" sublabel={business?.phone ?? ""} />
        ) : null}
        {emailHref ? (
          <ContactAction href={emailHref} icon={Mail} label="Email Us" sublabel={business?.email ?? ""} />
        ) : null}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Frequently Asked Questions</h2>
        <div className="divide-y rounded-md border bg-card">
          {FAQS.map((faq) => (
            <details key={faq.q} className="group p-4">
              <summary className="cursor-pointer list-none text-sm font-medium marker:content-none">
                <span className="flex items-center justify-between gap-2">
                  {faq.q}
                  <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Send Us a Message</h2>
        <Card>
          <CardContent className="pt-6">
            <SupportContactForm
              defaultName={account?.profile.full_name ?? ""}
              defaultEmail={account?.profile.email ?? ""}
              defaultSubject={subject}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
