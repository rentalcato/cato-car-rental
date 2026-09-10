/**
 * Shared contact-link builders — same business phone/email everywhere
 * (Settings -> Business, read via getPublicBusinessInfo()), just turned
 * into the right href for each channel. Pure/no I/O, safe for client or
 * server use.
 */

/** wa.me needs a full international number, no punctuation. Assumes a 10-digit number with no country code is a Jamaican (+1) number — this business's context (see lib/format.ts's TIMEZONE/currency). */
export function getWhatsAppLink(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const withCountryCode = digits.length === 10 ? `1${digits}` : digits;
  return `https://wa.me/${withCountryCode}`;
}

export function getCallLink(phone: string | null | undefined): string | null {
  return phone ? `tel:${phone}` : null;
}

export function getEmailLink(email: string | null | undefined, subject?: string): string | null {
  if (!email) return null;
  return subject ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : `mailto:${email}`;
}
