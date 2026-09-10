import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { LoyaltyEarningRule, LoyaltyPointTransaction, LoyaltyReward } from "@/types/database.types";

/**
 * 42P01/PGRST205 both mean "relation doesn't exist" (raw Postgres vs.
 * PostgREST's schema-cache error) — every function below treats that
 * one specific error as "migration 0024 hasn't been applied to this
 * database yet" and degrades to an empty/zero result instead of
 * throwing. Without this, every page that touches the loyalty program
 * (the customer dashboard, a customer's staff profile, Settings) would
 * hard-500 for every visitor until that migration is run — see the
 * same reasoning on getPublicRentalPolicy() in lib/marketing/queries.ts.
 */
function isMissingRelation(error: { code?: string }): boolean {
  return error.code === "42P01" || error.code === "PGRST205";
}

/** Everything a customer needs to see "how to earn points" — inactive rules are excluded (loyalty_earning_rules_select_active, 0024 handles this at the RLS layer too; this is belt-and-suspenders). */
export async function getActiveEarningRules(): Promise<LoyaltyEarningRule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_earning_rules")
    .select("*")
    .eq("is_active", true)
    .order("points", { ascending: false });
  if (error) {
    if (isMissingRelation(error)) return [];
    throw error;
  }
  return (data ?? []) as LoyaltyEarningRule[];
}

/** Staff-only (Settings -> Loyalty Program) — every rule, active or not. */
export async function getAllEarningRules(): Promise<LoyaltyEarningRule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_earning_rules")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) {
    if (isMissingRelation(error)) return [];
    throw error;
  }
  return (data ?? []) as LoyaltyEarningRule[];
}

/** Everything a customer needs to see "what can I redeem". */
export async function getActiveRewards(): Promise<LoyaltyReward[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_rewards")
    .select("*")
    .eq("is_active", true)
    .order("points_required", { ascending: true });
  if (error) {
    if (isMissingRelation(error)) return [];
    throw error;
  }
  return (data ?? []) as LoyaltyReward[];
}

/** Staff-only (Settings -> Loyalty Program) — every reward, active or not. */
export async function getAllRewards(): Promise<LoyaltyReward[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_rewards")
    .select("*")
    .order("points_required", { ascending: true });
  if (error) {
    if (isMissingRelation(error)) return [];
    throw error;
  }
  return (data ?? []) as LoyaltyReward[];
}

/** Always SUM(points_delta) over the ledger — never a separately-stored counter (see 0024's comment on loyalty_point_transactions). */
export async function getCustomerPointsBalance(customerId: string | undefined): Promise<number> {
  if (!customerId) return 0;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_point_transactions")
    .select("points_delta")
    .eq("customer_id", customerId);
  if (error) {
    if (isMissingRelation(error)) return 0;
    throw error;
  }
  return (data ?? []).reduce((sum, row) => sum + row.points_delta, 0);
}

export async function getCustomerPointHistory(customerId: string | undefined): Promise<LoyaltyPointTransaction[]> {
  if (!customerId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_point_transactions")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingRelation(error)) return [];
    throw error;
  }
  return (data ?? []) as LoyaltyPointTransaction[];
}

/** Staff-only — a specific customer's history, for the "Award Points" panel on their profile (Customers -> [customer]). Same table/RLS as getCustomerPointHistory(); split out only so the staff call site doesn't read like a self-service one. */
export async function getCustomerPointHistoryForStaff(customerId: string): Promise<LoyaltyPointTransaction[]> {
  return getCustomerPointHistory(customerId);
}
