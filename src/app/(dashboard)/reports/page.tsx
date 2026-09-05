import { BarChart3 } from "lucide-react";
import { requireRole } from "@/lib/auth/dal";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";

export default async function ReportsPage() {
  await requireRole(["super_admin", "manager"]);

  return (
    <ModulePlaceholder
      title="Reports"
      description="Revenue, fleet utilization and rental history reports."
      icon={BarChart3}
      phase="Phase 5"
    />
  );
}
