import type { ReactNode } from "react";
import { AccountSidebarNav } from "@/components/account/account-sidebar-nav";
import { AccountTopbar } from "@/components/account/account-topbar";
import { requireUser } from "@/lib/auth/dal";
import { getMyUnreadNotificationCount } from "@/lib/notifications/queries";
import { getPublicBusinessInfo, getPublicBusinessLogoUrl } from "@/lib/marketing/queries";

// Any signed-in user can land here — RLS scopes a customer to their own
// data, and a staff account with nothing linked just sees the "not
// linked yet" state, which is harmless.
export default async function AccountLayout({ children }: { children: ReactNode }) {
  const { id: userId, email, profile } = await requireUser();

  const [business, unreadCount] = await Promise.all([
    getPublicBusinessInfo(),
    getMyUnreadNotificationCount(userId),
  ]);
  const businessName = business?.business_name || "Fleet Manager";
  const logoUrl = await getPublicBusinessLogoUrl(business?.logo_storage_path ?? null);
  const displayName = profile.full_name || email || "there";

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — persistent, hidden below lg. Same shell shape as
          the staff dashboard (src/app/(dashboard)/layout.tsx) so the two
          areas read as one product. */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground lg:block">
        <AccountSidebarNav businessName={businessName} logoUrl={logoUrl} unreadCount={unreadCount} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-muted/20">
        <AccountTopbar
          displayName={displayName}
          email={email}
          businessName={businessName}
          logoUrl={logoUrl}
          unreadCount={unreadCount}
        />
        <main className="flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
