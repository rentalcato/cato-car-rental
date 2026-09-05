import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Maintenance, Vehicle } from "@/types/database.types";

export const MAINTENANCE_BUCKET = "maintenance-attachments";

export interface MaintenanceRow extends Maintenance {
  vehicle: Pick<Vehicle, "license_plate" | "make" | "model"> | null;
}

/** Fleet-wide, most recent first. */
export async function listMaintenanceRecords(): Promise<MaintenanceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance")
    .select("*, vehicle:vehicles(license_plate, make, model)")
    .order("service_date", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data as unknown as MaintenanceRow[];
}

export interface UpcomingServiceRow extends MaintenanceRow {
  overdue: boolean;
}

/**
 * Due within 30 days or already overdue, soonest first. `overdue` is
 * computed here (not at render time in the component) so the component
 * stays a pure function of its props.
 */
export async function getUpcomingService(): Promise<UpcomingServiceRow[]> {
  const supabase = await createClient();
  const now = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 30);

  const { data, error } = await supabase
    .from("maintenance")
    .select("*, vehicle:vehicles(license_plate, make, model)")
    .not("next_service_date", "is", null)
    .lte("next_service_date", cutoff.toISOString().slice(0, 10))
    .order("next_service_date", { ascending: true });

  if (error) throw error;
  return (data as unknown as MaintenanceRow[]).map((record) => ({
    ...record,
    overdue: record.next_service_date ? new Date(record.next_service_date) < now : false,
  }));
}
