import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

export const supportMessageFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Enter your name." }).max(120),
  email: z.preprocess(emptyToUndefined, z.email({ error: "Enter a valid email address." }).max(255).optional()),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(30).optional()),
  subject: z.string().trim().min(1, { error: "Enter a subject." }).max(150),
  message: z.string().trim().min(1, { error: "Enter a message." }).max(2000),
});

export type SupportMessageFormValues = z.infer<typeof supportMessageFormSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
