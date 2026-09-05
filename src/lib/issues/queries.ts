import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Vehicle, VehicleIssue } from "@/types/database.types";

export const ISSUE_PHOTO_BUCKET = "maintenance-attachments";

export interface IssueRow extends VehicleIssue {
  vehicle: Pick<Vehicle, "license_plate" | "make" | "model"> | null;
}

/** Fleet-wide open + in-progress issues, most severe/recent first. */
export async function listOpenIssues(): Promise<IssueRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_issues")
    .select("*, vehicle:vehicles(license_plate, make, model)")
    .in("status", ["open", "in_progress"])
    .order("reported_date", { ascending: false });

  if (error) throw error;
  return data as unknown as IssueRow[];
}
