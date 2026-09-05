import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { IssueForm } from "@/components/issues/issue-form";
import { requireRole } from "@/lib/auth/dal";
import { listVehicles } from "@/lib/vehicles/queries";

export default async function ReportDamagePage(props: PageProps<"/maintenance/report-damage">) {
  await requireRole(["super_admin", "manager"]);

  const searchParams = await props.searchParams;
  const defaultVehicleId =
    typeof searchParams.vehicleId === "string" ? searchParams.vehicleId : undefined;

  const vehicles = await listVehicles({ showArchived: false });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Report Damage" description="Log a damage or issue report for a vehicle." />
      <Card>
        <CardContent className="pt-6">
          <IssueForm vehicles={vehicles} defaultVehicleId={defaultVehicleId} />
        </CardContent>
      </Card>
    </div>
  );
}
