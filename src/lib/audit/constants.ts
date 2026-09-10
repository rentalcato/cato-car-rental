/**
 * Client-safe audit label catalog — deliberately split out from log.ts,
 * which pulls in "server-only" + next/headers for the actual DB write.
 * The Activity page's filter dropdown (activity-filters.tsx) is a Client
 * Component and needs these labels in the browser bundle; importing them
 * from log.ts instead would drag the server-only write path along and
 * fail the build ("'server-only' cannot be imported from a Client
 * Component module").
 *
 * Every `action` string any call site (app code or a SQL function in
 * supabase/migrations) has ever written to audit_logs. Not a DB enum —
 * the column is plain `text` — so this list exists only to drive the
 * Activity page's labels/filter dropdown. Add new actions here as they're
 * introduced; the Activity page falls back to humanizing an unlisted
 * action string, so forgetting to update this list degrades gracefully.
 */
export const AUDIT_ACTIONS = [
  "customer_created",
  "customer_updated",
  "customer_account_linked",
  "customer_account_unlinked",
  "customer_photo_updated",
  "document_uploaded",
  "document_deleted",
  "document_accessed",
  "profile_role_changed",
  "profile_reactivated",
  "profile_deactivated",
  "vehicle_deleted",
  "reservation_created",
  "reservation_activated",
  "reservation_cancelled",
  "reservation_approved",
  "reservation_denied",
  "rental_completed",
  "payment_recorded",
  "payment_refunded",
  "rental_checkin_completed",
] as const;

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  customer_created: "Customer created",
  customer_updated: "Customer updated",
  customer_account_linked: "Website account linked",
  customer_account_unlinked: "Website account unlinked",
  customer_photo_updated: "Customer photo updated",
  document_uploaded: "Document uploaded",
  document_deleted: "Document deleted",
  document_accessed: "Document viewed",
  profile_role_changed: "Staff role changed",
  profile_reactivated: "Staff account reactivated",
  profile_deactivated: "Staff account deactivated",
  vehicle_deleted: "Vehicle deleted",
  reservation_created: "Reservation created",
  reservation_activated: "Reservation activated",
  reservation_cancelled: "Reservation cancelled",
  reservation_approved: "Reservation approved",
  reservation_denied: "Reservation denied",
  rental_completed: "Rental completed",
  payment_recorded: "Payment recorded",
  payment_refunded: "Payment refunded",
  rental_checkin_completed: "Digital check-in completed",
};

export const AUDIT_ENTITY_TYPES = ["customer", "profile", "vehicle", "rental", "payment"] as const;

export const AUDIT_ENTITY_TYPE_LABELS: Record<string, string> = {
  customer: "Customer",
  profile: "Staff account",
  vehicle: "Vehicle",
  rental: "Reservation/Rental",
  payment: "Payment",
};

/** Humanizes an action/entity_type string this catalog doesn't know about yet. */
export function humanize(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
