"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export interface NotificationActionState {
  error?: string;
}

export async function markNotificationRead(notificationId: string): Promise<NotificationActionState> {
  await requireUser();

  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_notification_read", { p_notification_id: notificationId });
  if (error) return { error: error.message };

  revalidatePath("/account");
  revalidatePath("/account/notifications");
  return {};
}

export async function markAllNotificationsRead(): Promise<NotificationActionState> {
  await requireUser();

  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_all_notifications_read");
  if (error) return { error: error.message };

  revalidatePath("/account");
  revalidatePath("/account/notifications");
  return {};
}
