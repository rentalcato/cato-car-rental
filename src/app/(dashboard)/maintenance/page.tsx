import { Wrench } from "lucide-react";
import { requireRole } from "@/lib/auth/dal";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default async function MaintenancePage() {
  await requireRole(["super_admin", "manager"]);

  return (
    <ModulePlaceholder
      title="Maintenance & Issues"
      description="Service records and vehicle damage/issue tracking."
      icon={Wrench}
      phase="Phase 4"
    />
  );
}
