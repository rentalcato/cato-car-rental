import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" || value === null ? undefined : value);

/** action_key is only ever set at creation — editing an existing rule can't rename the key a trigger (0024) might depend on. */
export const createEarningRuleFormSchema = z.object({
  action_key: z
    .string()
    .trim()
    .min(1, { error: "Enter a unique action key." })
    .max(60)
    .regex(/^[a-z][a-z0-9_]*$/, { error: "Lowercase letters, numbers and underscores only, starting with a letter." }),
  name: z.string().trim().min(1, { error: "Enter a name." }).max(120),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
  points: z.coerce.number().int({ error: "Enter a whole number of points." }),
  is_active: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

export const updateEarningRuleFormSchema = createEarningRuleFormSchema.omit({ action_key: true });

export type CreateEarningRuleFormValues = z.infer<typeof createEarningRuleFormSchema>;
export type UpdateEarningRuleFormValues = z.infer<typeof updateEarningRuleFormSchema>;

export const REWARD_TYPES = [
  "fixed_discount",
  "percentage_discount",
  "free_rental_day",
  "free_upgrade",
  "special_offer",
  "custom",
] as const;

export const rewardFormSchema = z.object({
  name: z.string().trim().min(1, { error: "Enter a reward name." }).max(120),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(500).optional()),
  points_required: z.coerce.number().int().min(1, { error: "Must be at least 1 point." }),
  reward_type: z.enum(REWARD_TYPES),
  reward_value: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
  is_active: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
});

export type RewardFormValues = z.infer<typeof rewardFormSchema>;

export const grantPointsFormSchema = z.object({
  customer_id: z.uuid({ error: "Select a customer." }),
  rule_id: z.uuid({ error: "Select an earning rule." }),
  note: z.preprocess(emptyToUndefined, z.string().trim().max(200).optional()),
});

export type GrantPointsFormValues = z.infer<typeof grantPointsFormSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
