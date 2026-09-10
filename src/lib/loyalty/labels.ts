import {
  CalendarPlus,
  Gift,
  Percent,
  Sparkles,
  Tag,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { LoyaltyRewardType } from "@/types/database.types";

export const REWARD_TYPE_LABELS: Record<LoyaltyRewardType, string> = {
  fixed_discount: "Fixed Discount",
  percentage_discount: "Percentage Discount",
  free_rental_day: "Free Rental Day",
  free_upgrade: "Free Upgrade",
  special_offer: "Special Offer",
  custom: "Custom",
};

export const REWARD_TYPE_ICONS: Record<LoyaltyRewardType, LucideIcon> = {
  fixed_discount: Tag,
  percentage_discount: Percent,
  free_rental_day: CalendarPlus,
  free_upgrade: TrendingUp,
  special_offer: Sparkles,
  custom: Gift,
};

/** Falls back gracefully for a reward_type an older client doesn't recognize — the column is plain text, not a DB enum, so admin-entered values always render even if this list hasn't been extended yet. */
export function getRewardTypeLabel(type: string): string {
  return REWARD_TYPE_LABELS[type as LoyaltyRewardType] ?? type;
}

export function getRewardTypeIcon(type: string): LucideIcon {
  return REWARD_TYPE_ICONS[type as LoyaltyRewardType] ?? Gift;
}
