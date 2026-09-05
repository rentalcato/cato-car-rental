import { z } from "zod";
import { MAINTENANCE_TYPES } from "@/lib/constants";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

export const maintenanceFormSchema = z.object({
  vehicle_id: z.uuid({ error: "Select a vehicle." }),
  maintenance_type: z.enum(MAINTENANCE_TYPES, { error: "Select a maintenance type." }),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  service_date: z.preprocess(emptyToUndefined, z.iso.date({ error: "Enter a valid date." }).optional()),
  next_service_date: z.preprocess(
    emptyToUndefined,
    z.iso.date({ error: "Enter a valid date." }).optional()
  ),
  mileage_at_service: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0, { error: "Can't be negative." }).optional()
  ),
  next_service_mileage: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0, { error: "Can't be negative." }).optional()
  ),
  cost: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0, { error: "Cost can't be negative." }).optional()
  ),
  service_provider: z.preprocess(emptyToUndefined, z.string().trim().max(150).optional()),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  send_to_maintenance: z.preprocess((value) => value === "on" || value === "true", z.boolean()),
});

export type MaintenanceFormValues = z.infer<typeof maintenanceFormSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
