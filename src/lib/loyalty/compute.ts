import type { MyBookingRow } from "@/lib/account/queries";

export interface LoyaltyTier {
  name: string;
  minPoints: number;
  perk: string;
}

/** Illustrative tiers — thresholds tuned to typical daily rates in this fleet (see lib/format.ts). Easy to move to a DB-backed program later; see migration 0022's comment on support_messages for the same "ready to expand" spirit. */
export const LOYALTY_TIERS: LoyaltyTier[] = [
  { name: "Bronze", minPoints: 0, perk: "Priority email support" },
  { name: "Silver", minPoints: 500, perk: "5% off your next booking" },
  { name: "Gold", minPoints: 1500, perk: "Free upgrade, subject to availability" },
];

export interface LoyaltySummary {
  points: number;
  lifetimeSpend: number;
  completedRentals: number;
  tier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  referralCode: string;
}

/** 1 point per $100 (JMD) actually paid on a completed rental — never on a reserved/active balance that could still fall through. */
export function computeLoyaltySummary(bookings: MyBookingRow[], customerNumber: string): LoyaltySummary {
  const completed = bookings.filter((b) => b.rental_status === "completed");
  const lifetimeSpend = completed.reduce((sum, b) => sum + (b.amount_paid ?? 0), 0);
  const points = Math.floor(lifetimeSpend / 100);

  let tier = LOYALTY_TIERS[0]!;
  for (const candidate of LOYALTY_TIERS) {
    if (points >= candidate.minPoints) tier = candidate;
  }
  const nextTier = LOYALTY_TIERS.find((t) => t.minPoints > tier.minPoints) ?? null;

  return {
    points,
    lifetimeSpend,
    completedRentals: completed.length,
    tier,
    nextTier,
    pointsToNextTier: nextTier ? Math.max(0, nextTier.minPoints - points) : 0,
    referralCode: `REF-${customerNumber}`,
  };
}
