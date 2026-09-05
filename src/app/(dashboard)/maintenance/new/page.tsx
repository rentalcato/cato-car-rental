import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { MaintenanceForm } from "@/components/maintenance/maintenance-form";
import { requireRole } from "@/lib/auth/dal";
import { listVehicles } from "@/lib/vehicles/queries";

export default async function NewMaintenancePage(props: PageProps<"/maintenance/new">) {
  await requireRole(["super_admin", "manager"]);

  const searchParams = await props.searchParams;
  const defaultVehicleId =
    typeof searchParams.vehicleId === "string" ? searchParams.vehicleId : undefined;

  const vehicles = await listVehicles({ showArchived: false });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Record Maintenance" description="Log a service record for a vehicle." />
      <Card>
        <CardContent className="pt-6">
          <MaintenanceForm vehicles={vehicles} defaultVehicleId={defaultVehicleId} />
        </CardContent>
      </Card>
    </div>
  );
}
