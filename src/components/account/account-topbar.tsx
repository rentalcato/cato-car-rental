"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, LogOut, Menu, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountSidebarNav } from "@/components/account/account-sidebar-nav";
import { signOut } from "@/lib/auth/actions";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

export function AccountTopbar({
  displayName,
  email,
  businessName,
  logoUrl,
  unreadCount,
}: {
  displayName: string;
  email: string | undefined;
  businessName?: string | null;
  logoUrl?: string | null;
  unreadCount: number;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
            <Menu className="size-5" />
            <span className="sr-only">Open navigation</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <AccountSidebarNav
              onNavigate={() => setMobileNavOpen(false)}
              businessName={businessName}
              logoUrl={logoUrl}
              unreadCount={unreadCount}
            />
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="relative" render={<Link href="/account/notifications" />}>
          <Bell className="size-5" />
          {unreadCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute top-0.5 right-0.5 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          ) : null}
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<button className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted" />}
          >
            <Avatar className="size-7">
              <AvatarFallback>{initials(displayName)}</AvatarFallback>
            </Avatar>
            <span className="hidden text-left sm:block">
              <span className="block leading-tight font-medium">{displayName}</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{displayName}</span>
                  {email ? <span className="truncate text-xs text-muted-foreground">{email}</span> : null}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/account/profile" />}>
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem render={<Link href="/account/profile#security" />}>
              <Settings className="size-4" />
              Security settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
