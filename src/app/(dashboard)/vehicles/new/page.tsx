import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { requireRole } from "@/lib/auth/dal";
import { createVehicle } from "@/lib/vehicles/actions";
import { getAppSettings } from "@/lib/settings/queries";

export default async function NewVehiclePage() {
  await requireRole(["super_admin", "manager"]);
  const settings = await getAppSettings();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add Vehicle" description="Add a new vehicle to the fleet." />
      <Card>
        <CardContent className="pt-6">
          <VehicleForm
            action={createVehicle}
            defaultValues={{ daily_rental_rate: settings.default_daily_rate ?? undefined }}
            submitLabel="Add Vehicle"
          />
        </CardContent>
      </Card>
    </div>
  );
}
