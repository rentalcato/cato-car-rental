import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Notification } from "@/types/database.types";

/** Cheap head-count query for the sidebar/topbar badge — no row data fetched. */
export async function getMyUnreadNotificationCount(profileId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .is("read_at", null);

  if (error) throw error;
  return count ?? 0;
}

export async function getMyNotifications(profileId: string, limit?: number): Promise<Notification[]> {
  const supabase = await createClient();
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Notification[];
}
