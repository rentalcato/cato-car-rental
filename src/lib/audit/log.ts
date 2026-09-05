import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface AuditLogEntry {
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityLabel?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Best-effort audit trail write. Never throws — a logging failure should
 * never block the real operation it's describing. `audit_logs` is
 * append-only (see 0006 migration): no update/delete policy exists for
 * any role, so once written a row can't be altered via the API.
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("audit_logs").insert({
      actor_id: entry.actorId,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      entity_label: entry.entityLabel ?? null,
      metadata: entry.metadata ?? null,
    });
  } catch (error) {
    console.error("audit log write failed", entry.action, entry.entityType, error);
  }
}
