import { Bell } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/dal";
import { getMyNotifications } from "@/lib/notifications/queries";
import { NotificationList } from "@/components/account/notification-list";

export default async function NotificationsPage() {
  const current = await getCurrentUser();
  const notifications = current ? await getMyNotifications(current.id) : [];
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
          </p>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
          <Bell className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nothing here yet — updates about your bookings and payments will show up in this list.
          </p>
        </div>
      ) : (
        <NotificationList notifications={notifications} unreadCount={unreadCount} />
      )}
    </div>
  );
}
