import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { requireRole } from "@/lib/auth/dal";
import { createVehicle } from "@/lib/vehicles/actions";

export default async function NewVehiclePage() {
  await requireRole(["super_admin", "manager"]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add Vehicle" description="Add a new vehicle to the fleet." />
      <Card>
        <CardContent className="pt-6">
          <VehicleForm action={createVehicle} submitLabel="Add Vehicle" />
        </CardContent>
      </Card>
    </div>
  );
}
