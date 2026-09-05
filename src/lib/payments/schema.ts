import { z } from "zod";
import { PAYMENT_METHODS } from "@/lib/constants";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

export const recordPaymentFormSchema = z.object({
  amount: z.coerce
    .number({ error: "Enter an amount." })
    .positive({ error: "Amount must be greater than zero." }),
  is_refund: z.preprocess((value) => value === "on" || value === "true", z.boolean()),
  payment_method: z.preprocess(emptyToUndefined, z.enum(PAYMENT_METHODS).optional()),
  payment_reference: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(2000).optional()),
});

export type RecordPaymentFormValues = z.infer<typeof recordPaymentFormSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
