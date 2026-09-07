import "server-only";

import { createClient } from "@/lib/supabase/server";
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_TYPE_LABELS, humanize } from "@/lib/audit/log";
import { formatCurrency } from "@/lib/format";
import type { AuditLog } from "@/types/database.types";

export interface AuditLogFilters {
  search?: string;
  action?: string | "all";
  entityType?: string | "all";
}

export interface AuditLogRow extends AuditLog {
  actorName: string;
  /** Best-effort human label for the target row (falls back to entity_label, then a short id). */
  targetLabel: string;
  /** Link to the target's own page, when one exists. */
  targetHref: string | null;
  /** Short secondary line built from whatever's left in `metadata`. */
  detail: string | null;
}

const CAP = 200;

interface CustomerRow {
  id: string;
  first_name: string;
  last_name: string;
}
interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
}
interface VehicleRow {
  id: string;
  license_plate: string;
}
interface RentalRow {
  id: string;
  rental_number: string;
  customer: { first_name: string; last_name: string } | null;
  vehicle: { license_plate: string } | null;
}
interface PaymentRow {
  id: string;
  payment_amount: number;
  rental: { rental_number: string } | null;
}

interface TargetMaps {
  customers: Map<string, CustomerRow>;
  profiles: Map<string, ProfileRow>;
  vehicles: Map<string, VehicleRow>;
  rentals: Map<string, RentalRow>;
  payments: Map<string, PaymentRow>;
}

/**
 * Loads recent audit_logs rows and resolves each row's actor + target into
 * readable labels. entity_id isn't a real foreign key (it points at a
 * different table depending on entity_type), so this batches one `.in()`
 * lookup per referenced table rather than joining — the same shape
 * Postgres would need a view for.
 *
 * Filters `action`/`entityType` narrow at the database. `search` runs in
 * memory over the resolved rows (actor name, target label, action), same
 * as the rest of the app's un-paginated list pages — with the same
 * trade-off: a search term only matches within the most recent `CAP` rows,
 * not the full history.
 */
export async function listAuditLogs(filters: AuditLogFilters): Promise<AuditLogRow[]> {
  const supabase = await createClient();

  let query = supabase.from("audit_logs").select("*, actor:profiles(full_name, email)");

  if (filters.action && filters.action !== "all") {
    query = query.eq("action", filters.action);
  }
  if (filters.entityType && filters.entityType !== "all") {
    query = query.eq("entity_type", filters.entityType);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(CAP);
  if (error) throw error;

  const rows = data as unknown as (AuditLog & {
    actor: { full_name: string | null; email: string | null } | null;
  })[];

  const idsByType = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.entity_id) continue;
    if (!idsByType.has(row.entity_type)) idsByType.set(row.entity_type, new Set());
    idsByType.get(row.entity_type)!.add(row.entity_id);
  }

  const [customers, profiles, vehicles, rentals, payments] = await Promise.all([
    fetchByIds<CustomerRow>(supabase, idsByType.get("customer"), "customers", "id, first_name, last_name"),
    fetchByIds<ProfileRow>(supabase, idsByType.get("profile"), "profiles", "id, full_name, email"),
    fetchByIds<VehicleRow>(supabase, idsByType.get("vehicle"), "vehicles", "id, license_plate"),
    fetchByIds<RentalRow>(
      supabase,
      idsByType.get("rental"),
      "rentals",
      "id, rental_number, customer:customers(first_name, last_name), vehicle:vehicles(license_plate)"
    ),
    fetchByIds<PaymentRow>(
      supabase,
      idsByType.get("payment"),
      "payments",
      "id, payment_amount, rental:rentals(rental_number)"
    ),
  ]);

  const enriched = rows.map((row): AuditLogRow => {
    const actorName = row.actor?.full_name || row.actor?.email || "Unknown user";
    const { targetLabel, targetHref } = resolveTarget(row, { customers, profiles, vehicles, rentals, payments });
    return {
      ...row,
      actorName,
      targetLabel,
      targetHref,
      detail: describeMetadata(row.action, row.metadata),
    };
  });

  const term = filters.search?.trim().toLowerCase();
  if (!term) return enriched;

  return enriched.filter((row) => {
    const haystack = [
      row.actorName,
      row.targetLabel,
      AUDIT_ACTION_LABELS[row.action] ?? row.action,
      row.entity_label,
      row.detail,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
}

type AuditTargetTable = "customers" | "profiles" | "vehicles" | "rentals" | "payments";

async function fetchByIds<T extends { id: string }>(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: Set<string> | undefined,
  table: AuditTargetTable,
  select: string
): Promise<Map<string, T>> {
  const map = new Map<string, T>();
  if (!ids || ids.size === 0) return map;
  const { data, error } = await supabase.from(table).select(select).in("id", Array.from(ids));
  if (error) throw error;
  for (const record of (data as unknown as T[]) ?? []) {
    map.set(record.id, record);
  }
  return map;
}

function resolveTarget(
  row: AuditLog,
  maps: TargetMaps
): { targetLabel: string; targetHref: string | null } {
  const fallback = row.entity_label
    ? { targetLabel: row.entity_label, targetHref: null }
    : { targetLabel: `${AUDIT_ENTITY_TYPE_LABELS[row.entity_type] ?? humanize(row.entity_type)} ${shortId(row.entity_id)}`, targetHref: null };

  if (!row.entity_id) return fallback;

  switch (row.entity_type) {
    case "customer": {
      const customer = maps.customers.get(row.entity_id);
      if (!customer) return fallback;
      return {
        targetLabel: row.entity_label ?? `${customer.first_name} ${customer.last_name}`,
        targetHref: `/customers/${row.entity_id}`,
      };
    }
    case "vehicle": {
      const vehicle = maps.vehicles.get(row.entity_id);
      if (!vehicle) return fallback;
      return {
        targetLabel: row.entity_label ?? vehicle.license_plate,
        targetHref: `/vehicles/${row.entity_id}`,
      };
    }
    case "profile": {
      const profile = maps.profiles.get(row.entity_id);
      if (!profile) return fallback;
      return { targetLabel: profile.full_name || profile.email || shortId(row.entity_id), targetHref: null };
    }
    case "rental": {
      const rental = maps.rentals.get(row.entity_id);
      if (!rental) return fallback;
      const who = rental.customer ? `${rental.customer.first_name} ${rental.customer.last_name}` : null;
      const what = rental.vehicle ? rental.vehicle.license_plate : null;
      const suffix = [who, what].filter(Boolean).join(" · ");
      return {
        targetLabel: suffix ? `${rental.rental_number} (${suffix})` : rental.rental_number,
        targetHref: null, // no rental detail page exists yet
      };
    }
    case "payment": {
      const payment = maps.payments.get(row.entity_id);
      if (!payment) return fallback;
      const rentalPart = payment.rental ? ` for ${payment.rental.rental_number}` : "";
      return { targetLabel: `${formatCurrency(payment.payment_amount)}${rentalPart}`, targetHref: null };
    }
    default:
      return fallback;
  }
}

function shortId(id: string | null): string {
  return id ? `#${id.slice(0, 8)}` : "";
}

/** Renders the metadata keys not already surfaced via targetLabel into one short line. */
function describeMetadata(action: string, metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null;

  switch (action) {
    case "reservation_cancelled":
    case "reservation_denied":
      return metadata.reason ? `Reason: ${metadata.reason}` : null;
    case "reservation_activated":
      return metadata.blacklist_override ? "Blacklist override used" : null;
    case "rental_completed": {
      const lateFee = Number(metadata.late_fee ?? 0);
      const extra = Number(metadata.additional_charges ?? 0);
      const parts: string[] = [];
      if (lateFee > 0) parts.push(`late fee ${formatCurrency(lateFee)}`);
      if (extra > 0) parts.push(`additional charges ${formatCurrency(extra)}`);
      return parts.length > 0 ? parts.join(", ") : null;
    }
    case "customer_account_linked":
      return metadata.email ? `Linked to ${metadata.email}` : null;
    case "profile_role_changed":
      return metadata.role ? `New role: ${humanize(String(metadata.role))}` : null;
    case "document_uploaded":
    case "document_deleted":
    case "document_accessed": {
      const type = metadata.document_type ? humanize(String(metadata.document_type)) : null;
      const file = metadata.file_name ? String(metadata.file_name) : null;
      const selfService = metadata.self_service ? " (self-service)" : "";
      return [type, file].filter(Boolean).join(" — ") + selfService || null;
    }
    default:
      return null;
  }
}
