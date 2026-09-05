import { z } from "zod";

/** FormData gives every empty field as `""` — treat that as "not provided". */
const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

const optionalText = (max: number) => z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
const optionalDate = z.preprocess(
  emptyToUndefined,
  z.iso.date({ error: "Enter a valid date." }).optional()
);

/**
 * Only name + a primary phone number are actually required. The spec lists
 * most personal/identification fields without an explicit "optional" tag,
 * but requiring all of them (DOB, address, both ID numbers, etc.) up front
 * would block the exact walk-in-customer workflow this module exists for —
 * same pragmatic call the vehicle form already makes (only license plate +
 * daily rate are required there). Everything else can be filled in later.
 */
export const customerFormSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, { error: "First name is required." })
    .max(60, { error: "First name must be 60 characters or fewer." }),
  middle_name: optionalText(60),
  last_name: z
    .string()
    .trim()
    .min(1, { error: "Last name is required." })
    .max(60, { error: "Last name must be 60 characters or fewer." }),
  date_of_birth: optionalDate,
  gender: optionalText(30),
  email: z.preprocess(
    emptyToUndefined,
    z.email({ error: "Enter a valid email address." }).max(255).optional()
  ),
  primary_phone: z
    .string()
    .trim()
    .min(1, { error: "Primary phone number is required." })
    .max(30, { error: "Phone number must be 30 characters or fewer." }),
  secondary_phone: optionalText(30),
  address: optionalText(300),
  city_parish: optionalText(100),
  country: optionalText(100),
  emergency_contact_name: optionalText(120),
  emergency_contact_phone: optionalText(30),
  drivers_license_number: optionalText(50),
  drivers_license_issuing_country: optionalText(100),
  drivers_license_issue_date: optionalDate,
  drivers_license_expiry: optionalDate,
  identification_type: optionalText(50),
  identification_number: optionalText(50),
  passport_number: optionalText(50),
  notes: optionalText(2000),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

/** Flattens a ZodError into the { fieldName: [messages] } shape the forms render. */
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
