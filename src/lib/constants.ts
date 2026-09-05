/**
 * App-wide constants. Keep enum value lists here in sync with the SQL
 * enums defined in supabase/migrations/0001_schema.sql — TypeScript can't
 * read the database schema for us in Phase 1 (no generated types yet).
 */

export const TIMEZONE = "America/Jamaica";

export const VEHICLE_STATUSES = [
  "available",
  "reserved",
  "rented",
  "overdue",
  "maintenance",
  "out_of_service",
] as const;

export const RENTAL_STATUSES = [
  "reserved",
  "active",
  "completed",
  "overdue",
  "cancelled",
] as const;

export const ISSUE_STATUSES = ["open", "in_progress", "resolved"] as const;

export const ISSUE_SEVERITIES = ["low", "medium", "high", "critical"] as const;

export const FUEL_TYPES = [
  "gasoline",
  "diesel",
  "hybrid",
  "electric",
  "other",
] as const;

export const PAYMENT_METHODS = [
  "cash",
  "credit_card",
  "debit_card",
  "bank_transfer",
  "cheque",
  "online",
  "other",
] as const;

export const USER_ROLES = ["super_admin", "manager", "staff"] as const;

export const CUSTOMER_STATUSES = ["active", "restricted", "blacklisted", "inactive"] as const;

export const DOCUMENT_TYPES = [
  "drivers_license_front",
  "drivers_license_back",
  "national_id",
  "passport",
  "proof_of_address",
  "rental_agreement",
  "signed_document",
  "other",
] as const;

/** MIME types accepted for a customer document upload. */
export const ALLOWED_DOCUMENT_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
