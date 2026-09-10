import {
  CalendarCheck,
  CalendarClock,
  CarFront,
  CheckCircle2,
  CircleAlert,
  Gift,
  type LucideIcon,
  Wallet,
  XCircle,
} from "lucide-react";

/**
 * Client-safe catalog for every `notifications.type` the triggers in
 * 0022_customer_dashboard_extensions.sql (and 0025's loyalty ledger
 * trigger) can write. Plain data, no "server-only" — the Notification
 * Center list and its bell icon are both Client Components. Falls back
 * to a generic icon/label for anything not listed here, same
 * graceful-degradation approach as lib/audit/constants.ts's humanize().
 */
export const NOTIFICATION_CATALOG: Record<string, { label: string; icon: LucideIcon; accent: string }> = {
  booking_pending: { label: "Booking Requested", icon: CalendarClock, accent: "text-amber-600 bg-amber-500/10" },
  booking_confirmed: { label: "Booking Confirmed", icon: CalendarCheck, accent: "text-primary bg-primary/10" },
  booking_declined: { label: "Booking Declined", icon: XCircle, accent: "text-destructive bg-destructive/10" },
  booking_cancelled: { label: "Booking Cancelled", icon: XCircle, accent: "text-muted-foreground bg-muted" },
  vehicle_ready: { label: "Vehicle Ready", icon: CarFront, accent: "text-primary bg-primary/10" },
  rental_completed: { label: "Rental Completed", icon: CheckCircle2, accent: "text-emerald-600 bg-emerald-500/10" },
  payment_received: { label: "Payment Received", icon: Wallet, accent: "text-emerald-600 bg-emerald-500/10" },
  loyalty_points_earned: { label: "Points Earned", icon: Gift, accent: "text-emerald-600 bg-emerald-500/10" },
  loyalty_points_redeemed: { label: "Reward Redeemed", icon: Gift, accent: "text-primary bg-primary/10" },
};

export function getNotificationVisual(type: string): { label: string; icon: LucideIcon; accent: string } {
  return NOTIFICATION_CATALOG[type] ?? { label: "Update", icon: CircleAlert, accent: "text-muted-foreground bg-muted" };
}
