import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import { PhotoGallery } from "@/components/vehicles/photo-gallery";
import { requireRole } from "@/lib/auth/dal";
import { getVehicle, getVehiclePhotos } from "@/lib/vehicles/queries";
import { updateVehicle } from "@/lib/vehicles/actions";

export default async function EditVehiclePage(props: PageProps<"/vehicles/[id]/edit">) {
  await requireRole(["super_admin", "manager"]);

  const { id } = await props.params;
  const vehicle = await getVehicle(id);
  if (!vehicle) notFound();

  const photos = await getVehiclePhotos(vehicle.id);
  const action = updateVehicle.bind(null, vehicle.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <PageHeader
          title={`Edit ${vehicle.license_plate}`}
          description="Update this vehicle's details."
        />
        <Card>
          <CardContent className="pt-6">
            <VehicleForm action={action} defaultValues={vehicle} submitLabel="Save Changes" />
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold">Photos</h2>
        <Card>
          <CardContent className="pt-6">
            <PhotoGallery vehicleId={vehicle.id} photos={photos} canManage />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
