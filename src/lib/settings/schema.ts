import { z } from "zod";
import { USER_ROLES } from "@/lib/constants";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

export const businessSettingsFormSchema = z.object({
  business_name: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  address: z.preprocess(emptyToUndefined, z.string().trim().max(300).optional()),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(30).optional()),
  email: z.preprocess(emptyToUndefined, z.email({ error: "Enter a valid email address." }).max(255).optional()),
  currency: z
    .string()
    .trim()
    .min(3, { error: "Enter a 3-letter currency code, e.g. JMD." })
    .max(3)
    .toUpperCase(),
  timezone: z.string().trim().min(1, { error: "Enter a timezone." }).max(60),
  tax_rate: z.coerce.number().min(0, { error: "Tax rate can't be negative." }).max(100),
  business_hours: z.preprocess(emptyToUndefined, z.string().trim().max(300).optional()),
});

export type BusinessSettingsFormValues = z.infer<typeof businessSettingsFormSchema>;

export const rentalSettingsFormSchema = z.object({
  default_daily_rate: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0, { error: "Can't be negative." }).optional()
  ),
  grace_period_hours: z.coerce.number().int().min(0, { error: "Can't be negative." }),
  late_fee_per_day: z.coerce.number().min(0, { error: "Can't be negative." }),
  default_security_deposit: z.coerce.number().min(0, { error: "Can't be negative." }),
  mileage_limit_per_day: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0, { error: "Can't be negative." }).optional()
  ),
  mileage_overage_fee: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0, { error: "Can't be negative." }).optional()
  ),
  fuel_policy: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
});

export type RentalSettingsFormValues = z.infer<typeof rentalSettingsFormSchema>;

export const profileRoleSchema = z.enum(USER_ROLES);

export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
