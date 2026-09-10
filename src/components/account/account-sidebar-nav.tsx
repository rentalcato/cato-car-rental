"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car } from "lucide-react";
import { ACCOUNT_NAV_ITEMS, ACCOUNT_SECONDARY_NAV_ITEMS } from "@/components/account/account-nav-config";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Mirrors src/components/layout/sidebar-nav.tsx's structure/theming so the customer area reads as the same product, not a bolted-on section. */
export function AccountSidebarNav({
  onNavigate,
  businessName,
  logoUrl,
  unreadCount,
}: {
  onNavigate?: () => void;
  businessName?: string | null;
  logoUrl?: string | null;
  unreadCount: number;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/account" ? pathname === href : pathname.startsWith(href);
  }

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex items-center gap-2 px-4 py-5 text-lg font-semibold"
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={businessName || "Fleet Manager"}
            className="h-10 max-w-full shrink-0 object-contain"
          />
        ) : (
          <>
            <Car className="size-6 shrink-0" />
            <span className="truncate">{businessName || "Fleet Manager"}</span>
          </>
        )}
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2">
        {ACCOUNT_NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const badgeCount = item.showUnreadBadge ? unreadCount : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              <span className="flex-1 truncate">{item.label}</span>
              {badgeCount > 0 ? (
                <Badge variant="default" className="h-4.5 min-w-4.5 px-1 text-[10px]">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </Badge>
              ) : null}
            </Link>
          );
        })}

        <div className="my-2 border-t border-sidebar-border" />

        {ACCOUNT_SECONDARY_NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4" />
              <span className="flex-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
