import { TIMEZONE } from "@/lib/constants";

/** Jamaican Dollar currency formatting, used everywhere a rate/amount is shown. */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return new Intl.NumberFormat("en-JM", { style: "currency", currency: "JMD" }).format(amount);
}

/** Date-only, formatted in America/Jamaica regardless of the viewer's local timezone. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-JM", { dateStyle: "medium", timeZone: TIMEZONE }).format(
    new Date(value)
  );
}

/** Date + time, formatted in America/Jamaica. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-JM", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TIMEZONE,
  }).format(new Date(value));
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-JM").format(value);
}
