import Link from "next/link";
import { Plus, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { MaintenanceTable } from "@/components/maintenance/maintenance-table";
import { UpcomingServiceList } from "@/components/maintenance/upcoming-service-list";
import { IssuesTable } from "@/components/issues/issues-table";
import { requireRole } from "@/lib/auth/dal";
import { getUpcomingService, listMaintenanceRecords } from "@/lib/maintenance/queries";
import { listOpenIssues } from "@/lib/issues/queries";

export default async function MaintenancePage() {
  await requireRole(["super_admin", "manager"]);

  const [records, upcoming, issues] = await Promise.all([
    listMaintenanceRecords(),
    getUpcomingService(),
    listOpenIssues(),
  ]);

  return (
    <div>
      <PageHeader title="Maintenance & Issues" description="Service records and vehicle damage/issue tracking." />

      <Tabs defaultValue="service">
        <TabsList>
          <TabsTrigger value="service">Service Records</TabsTrigger>
          <TabsTrigger value="issues">Damage &amp; Issues ({issues.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="service" className="space-y-6">
          <div className="flex justify-end">
            <Button size="sm" render={<Link href="/maintenance/new" />}>
              <Plus className="size-3.5" />
              Record Maintenance
            </Button>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Upcoming Service</h3>
            <UpcomingServiceList records={upcoming} />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">All Service Records</h3>
            <MaintenanceTable records={records} />
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" variant="destructive" render={<Link href="/maintenance/report-damage" />}>
              <ShieldAlert className="size-3.5" />
              Report Damage
            </Button>
          </div>

          <IssuesTable issues={issues} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
