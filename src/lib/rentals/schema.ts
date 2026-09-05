import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/constants";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

export const checkoutFormSchema = z.object({
  customer_id: z.uuid({ error: "Select a customer." }),
  vehicle_id: z.uuid({ error: "Select a vehicle." }),
  // The <input type="datetime-local"> value has no timezone (e.g.
  // "2026-09-04T14:30") — treat it as America/Jamaica wall-clock time
  // (fixed UTC-5, no DST, per lib/constants.ts) rather than letting
  // `new Date()` interpret it in whatever timezone the server happens to
  // run in.
  rental_start: z
    .string()
    .min(1, { error: "Choose a rental start date and time." })
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
  payment_amount: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0, { error: "Payment amount can't be negative." }).optional()
  ),
  payment_method: z.preprocess(emptyToUndefined, z.enum(PAYMENT_METHODS).optional()),
  payment_reference: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  override_blacklist: z.preprocess((value) => value === "on" || value === "true", z.boolean()),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

export const completeRentalFormSchema = z.object({
  // Same Jamaica-offset handling as rental_start above.
  actual_return: z
    .string()
    .min(1, { error: "Choose the actual return date and time." })
    .transform((value) => new Date(`${value}:00-05:00`))
    .refine((date) => !Number.isNaN(date.getTime()), { error: "Enter a valid date and time." }),
  return_mileage: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0, { error: "Mileage can't be negative." }).optional()
  ),
  return_fuel_level: z.preprocess(emptyToUndefined, z.string().trim().max(20).optional()),
  late_fee: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0, { error: "Late fee can't be negative." }).optional()
  ),
  additional_charges: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0, { error: "Additional charges can't be negative." }).optional()
  ),
  payment_amount: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0, { error: "Payment amount can't be negative." }).optional()
  ),
  payment_method: z.preprocess(emptyToUndefined, z.enum(PAYMENT_METHODS).optional()),
  payment_reference: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
});

export type CompleteRentalFormValues = z.infer<typeof completeRentalFormSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
