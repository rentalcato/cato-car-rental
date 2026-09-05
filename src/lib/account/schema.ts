import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

/**
 * The customer self-booking form — same rental_start/duration_days
 * fields and Jamaica-offset handling as reservationFormSchema
 * (src/lib/reservations/schema.ts), minus customer_id/vehicle_id
 * (resolved server-side) and deposit/blacklist-override (staff-only
 * concerns collected in person at pickup).
 */
export const bookingFormSchema = z.object({
  rental_start: z
    .string()
    .min(1, { error: "Choose a pickup date and time." })
    .transform((value) => new Date(`${value}:00-05:00`))
    .refine((date) => !Number.isNaN(date.getTime()), { error: "Enter a valid date and time." }),
  duration_days: z.coerce
    .number({ error: "Enter the number of rental days." })
    .int()
    .min(1, { error: "Rental duration must be at least 1 day." })
    .max(365, { error: "Rental duration must be 365 days or fewer." }),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export const profileFormSchema = z.object({
  full_name: z.string().trim().min(1, { error: "Name can't be empty." }).max(120),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

/** Only fields update_my_contact_info() (0018) accepts — never license/ID/status/notes. */
export const contactFormSchema = z.object({
  primary_phone: z.preprocess(emptyToUndefined, z.string().trim().max(30).optional()),
  secondary_phone: z.preprocess(emptyToUndefined, z.string().trim().max(30).optional()),
  address: z.preprocess(emptyToUndefined, z.string().trim().max(300).optional()),
  city_parish: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  emergency_contact_name: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  emergency_contact_phone: z.preprocess(emptyToUndefined, z.string().trim().max(30).optional()),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
