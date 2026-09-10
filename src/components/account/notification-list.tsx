"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getNotificationVisual } from "@/lib/notifications/catalog";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notifications/actions";
import { formatDateTime } from "@/lib/format";
import type { Notification } from "@/types/database.types";

function relatedHref(notification: Notification): string | null {
  if (notification.related_entity_type === "rental" && notification.related_entity_id) {
    return `/account/rentals/${notification.related_entity_id}`;
  }
  return null;
}

export function NotificationList({
  notifications,
  unreadCount,
}: {
  notifications: Notification[];
  unreadCount: number;
}) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      setReadIds(new Set(notifications.map((n) => n.id)));
    });
  }

  function handleOpen(notification: Notification) {
    if (!notification.read_at && !readIds.has(notification.id)) {
      setReadIds((prev) => new Set(prev).add(notification.id));
      startTransition(async () => {
        await markNotificationRead(notification.id);
      });
    }
  }

  return (
    <div className="space-y-3">
      {unreadCount > readIds.size ? (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" disabled={isPending} onClick={handleMarkAll}>
            <CheckCheck className="size-3.5" />
            Mark all as read
          </Button>
        </div>
      ) : null}

      {notifications.map((notification) => {
        const isUnread = !notification.read_at && !readIds.has(notification.id);
        const visual = getNotificationVisual(notification.type);
        const Icon = visual.icon;
        const href = relatedHref(notification);

        const content = (
          <CardContent className="flex items-start gap-3 p-4">
            <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${visual.accent}`}>
              <Icon className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{notification.title}</p>
                {isUnread ? <span className="size-2 shrink-0 rounded-full bg-primary" /> : null}
              </div>
              {notification.body ? <p className="mt-0.5 text-sm text-muted-foreground">{notification.body}</p> : null}
              <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(notification.created_at)}</p>
            </div>
          </CardContent>
        );

        return (
          <Card
            key={notification.id}
            className={`transition-colors ${isUnread ? "bg-primary/5" : ""} ${href ? "cursor-pointer hover:bg-muted/50" : ""}`}
            onClick={() => handleOpen(notification)}
          >
            {href ? (
              <Link href={href} className="block">
                {content}
              </Link>
            ) : (
              content
            )}
          </Card>
        );
      })}
    </div>
  );
}
