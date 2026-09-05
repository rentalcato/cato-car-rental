import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth/dal";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";
import { getAppSettings, getBusinessLogoUrl } from "@/lib/settings/queries";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // requireUser() alone would let a 'customer'-role account (public
  // sign-up, 0012 migration) sit in an empty dashboard shell with no nav
  // items instead of being cleanly bounced to /unauthorized.
  //
  // This must run BEFORE getAppSettings(), not alongside it in a
  // Promise.all — app_settings is RLS-restricted to staff+ (0010), so a
  // customer hitting /dashboard directly would have that query rejected
  // by RLS and throw. Run concurrently, that rejection can win the
  // Promise.all race against requireRole()'s redirect (which itself
  // needs two round trips — auth.getUser() then a profiles select — so
  // it's often the slower of the two), crashing the whole layout with a
  // generic error instead of the intended clean bounce to /unauthorized.
  const { email, profile } = await requireRole(["super_admin", "manager", "staff"]);
  const settings = await getAppSettings();
  const displayName = profile.full_name || email || "User";
  const logoUrl = await getBusinessLogoUrl(settings.logo_storage_path);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — persistent, hidden below lg */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground lg:block">
        <SidebarNav role={profile.role} businessName={settings.business_name} logoUrl={logoUrl} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          displayName={displayName}
          email={email}
          role={profile.role}
          businessName={settings.business_name}
          logoUrl={logoUrl}
        />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
