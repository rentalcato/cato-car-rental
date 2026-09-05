import { z } from "zod";
import { ISSUE_SEVERITIES } from "@/lib/constants";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

export const issueFormSchema = z.object({
  vehicle_id: z.uuid({ error: "Select a vehicle." }),
  issue_type: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(100, { error: "Keep it under 100 characters." }).optional()
  ),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
  severity: z.enum(ISSUE_SEVERITIES, { error: "Select a severity." }),
  repair_cost: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0, { error: "Can't be negative." }).optional()
  ),
  take_out_of_service: z.preprocess((value) => value === "on" || value === "true", z.boolean()),
});

export type IssueFormValues = z.infer<typeof issueFormSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
