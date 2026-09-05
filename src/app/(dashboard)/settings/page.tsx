import { Settings } from "lucide-react";
import { requireRole } from "@/lib/auth/dal";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default async function SettingsPage() {
  await requireRole(["super_admin"]);

  return (
    <ModulePlaceholder
      title="Settings"
      description="Manage staff accounts and granular permissions."
      icon={Settings}
      phase="a later phase"
    />
  );
}
