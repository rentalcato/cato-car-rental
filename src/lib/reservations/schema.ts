import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/constants";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

export const reservationFormSchema = z.object({
  customer_id: z.uuid({ error: "Select a customer." }),
  vehicle_id: z.uuid({ error: "Select a vehicle." }),
  // Same Jamaica-offset handling as lib/rentals/schema.ts — the
  // <input type="datetime-local"> value has no timezone info.
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
  deposit_amount: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0, { error: "Deposit can't be negative." }).optional()
  ),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  override_blacklist: z.preprocess((value) => value === "on" || value === "true", z.boolean()),
});

export type ReservationFormValues = z.infer<typeof reservationFormSchema>;

export const checkInFormSchema = z.object({
  payment_amount: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0, { error: "Payment amount can't be negative." }).optional()
  ),
  payment_method: z.preprocess(emptyToUndefined, z.enum(PAYMENT_METHODS).optional()),
  payment_reference: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  override_blacklist: z.preprocess((value) => value === "on" || value === "true", z.boolean()),
});

export type CheckInFormValues = z.infer<typeof checkInFormSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
