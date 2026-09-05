import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/dal";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Topbar } from "@/components/layout/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { email, profile } = await requireUser();
  const displayName = profile.full_name || email || "User";

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — persistent, hidden below lg */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground lg:block">
        <SidebarNav role={profile.role} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar displayName={displayName} email={email} role={profile.role} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
