"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  createEarningRuleFormSchema,
  fieldErrors,
  grantPointsFormSchema,
  rewardFormSchema,
  updateEarningRuleFormSchema,
} from "@/lib/loyalty/schema";

const LOYALTY_ADMINS = ["super_admin"] as const;
const LOYALTY_GRANTERS = ["super_admin", "manager", "staff"] as const;

export interface LoyaltyActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

// ---------------------------------------------------------------------
// Earning rules (Settings -> Loyalty Program)
// ---------------------------------------------------------------------

export async function createEarningRule(
  _prevState: LoyaltyActionState,
  formData: FormData
): Promise<LoyaltyActionState> {
  await requireRole(LOYALTY_ADMINS);

  const parsed = createEarningRuleFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("loyalty_earning_rules").insert({
    action_key: parsed.data.action_key,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    points: parsed.data.points,
    is_active: parsed.data.is_active,
    is_system: false,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "An earning rule with that action key already exists." : error.message,
    };
  }

  revalidatePath("/settings");
  revalidatePath("/account/loyalty");
  return { success: true };
}

export async function updateEarningRule(
  ruleId: string,
  _prevState: LoyaltyActionState,
  formData: FormData
): Promise<LoyaltyActionState> {
  await requireRole(LOYALTY_ADMINS);

  const parsed = updateEarningRuleFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("loyalty_earning_rules")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      points: parsed.data.points,
      is_active: parsed.data.is_active,
    })
    .eq("id", ruleId);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/account/loyalty");
  return { success: true };
}

export async function setEarningRuleActive(ruleId: string, isActive: boolean): Promise<LoyaltyActionState> {
  await requireRole(LOYALTY_ADMINS);

  const supabase = await createClient();
  const { error } = await supabase.from("loyalty_earning_rules").update({ is_active: isActive }).eq("id", ruleId);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/account/loyalty");
  return { success: true };
}

export async function deleteEarningRule(ruleId: string): Promise<LoyaltyActionState> {
  await requireRole(LOYALTY_ADMINS);

  const supabase = await createClient();
  const { error } = await supabase.from("loyalty_earning_rules").delete().eq("id", ruleId);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/account/loyalty");
  return { success: true };
}

// ---------------------------------------------------------------------
// Rewards (Settings -> Loyalty Program)
// ---------------------------------------------------------------------

export async function createReward(
  _prevState: LoyaltyActionState,
  formData: FormData
): Promise<LoyaltyActionState> {
  await requireRole(LOYALTY_ADMINS);

  const parsed = rewardFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("loyalty_rewards").insert({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    points_required: parsed.data.points_required,
    reward_type: parsed.data.reward_type,
    reward_value: parsed.data.reward_value ?? null,
    is_active: parsed.data.is_active,
  });

  if (error) {
    return { error: error.code === "23505" ? "A reward with that name already exists." : error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/account/loyalty");
  return { success: true };
}

export async function updateReward(
  rewardId: string,
  _prevState: LoyaltyActionState,
  formData: FormData
): Promise<LoyaltyActionState> {
  await requireRole(LOYALTY_ADMINS);

  const parsed = rewardFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("loyalty_rewards")
    .update({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      points_required: parsed.data.points_required,
      reward_type: parsed.data.reward_type,
      reward_value: parsed.data.reward_value ?? null,
      is_active: parsed.data.is_active,
    })
    .eq("id", rewardId);

  if (error) {
    return { error: error.code === "23505" ? "A reward with that name already exists." : error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/account/loyalty");
  return { success: true };
}

export async function setRewardActive(rewardId: string, isActive: boolean): Promise<LoyaltyActionState> {
  await requireRole(LOYALTY_ADMINS);

  const supabase = await createClient();
  const { error } = await supabase.from("loyalty_rewards").update({ is_active: isActive }).eq("id", rewardId);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/account/loyalty");
  return { success: true };
}

export async function deleteReward(rewardId: string): Promise<LoyaltyActionState> {
  await requireRole(LOYALTY_ADMINS);

  const supabase = await createClient();
  const { error } = await supabase.from("loyalty_rewards").delete().eq("id", rewardId);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/account/loyalty");
  return { success: true };
}

// ---------------------------------------------------------------------
// Manual grant (staff+, e.g. Customers -> [customer] -> Award Points —
// the only way review/referral rules actually award anything today,
// see 0024's comment on those two rules)
// ---------------------------------------------------------------------

export async function grantPointsManually(
  _prevState: LoyaltyActionState,
  formData: FormData
): Promise<LoyaltyActionState> {
  await requireRole(LOYALTY_GRANTERS);

  const parsed = grantPointsFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.rpc("grant_loyalty_points", {
    p_customer_id: parsed.data.customer_id,
    p_rule_id: parsed.data.rule_id,
    p_note: parsed.data.note ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/customers/${parsed.data.customer_id}`);
  return { success: true };
}

// ---------------------------------------------------------------------
// Redemption (customer-facing, Loyalty & Rewards page)
// ---------------------------------------------------------------------

export interface RedeemRewardState {
  error?: string;
  success?: boolean;
}

export async function redeemReward(rewardId: string): Promise<RedeemRewardState> {
  await requireUser();

  const supabase = await createClient();
  const { error } = await supabase.rpc("redeem_loyalty_reward", { p_reward_id: rewardId });
  if (error) return { error: error.message };

  revalidatePath("/account/loyalty");
  return { success: true };
}
