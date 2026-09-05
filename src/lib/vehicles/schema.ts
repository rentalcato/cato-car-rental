import { z } from "zod";
import { FUEL_TYPES, VEHICLE_STATUSES } from "@/lib/constants";

const CURRENT_YEAR = new Date().getFullYear();

/** FormData gives every empty field as `""` — treat that as "not provided". */
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

export const vehicleFormSchema = z.object({
  license_plate: z
    .string()
    .trim()
    .min(1, { error: "License plate is required." })
    .max(20, { error: "License plate must be 20 characters or fewer." }),
  make: z.preprocess(emptyToUndefined, z.string().trim().max(60).optional()),
  model: z.preprocess(emptyToUndefined, z.string().trim().max(60).optional()),
  year: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number()
      .int()
      .min(1950, { error: "Enter a valid year." })
      .max(CURRENT_YEAR + 1, { error: "Enter a valid year." })
      .optional()
  ),
  colour: z.preprocess(emptyToUndefined, z.string().trim().max(40).optional()),
  vin: z.preprocess(emptyToUndefined, z.string().trim().max(32).optional()),
  daily_rental_rate: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: "Daily rate is required." })
      .min(0, { error: "Daily rate can't be negative." })
  ),
  current_mileage: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0, { error: "Mileage can't be negative." }).optional()
  ),
  fuel_type: z.preprocess(emptyToUndefined, z.enum(FUEL_TYPES).optional()),
  vehicle_status: z.enum(VEHICLE_STATUSES, { error: "Select a status." }),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export const dailyRateSchema = z.object({
  daily_rental_rate: z.coerce
    .number({ error: "Enter a rate." })
    .min(0, { error: "Daily rate can't be negative." }),
});

/** Flattens a ZodError into the { fieldName: [messages] } shape the forms render. */
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
