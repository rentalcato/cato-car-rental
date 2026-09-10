import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getVehicleTagline } from "@/lib/vehicles/details";
import type { FleetCard } from "@/lib/marketing/queries";

/**
 * "2024 Mercedes-Benz GLE 450" / "Luxury SUV • Automatic • 5 Seats" —
 * the header block shared by the public and account Vehicle Details
 * pages. Availability is always "Available Now" here by construction:
 * both pages only ever reach a vehicle through public_vehicle_listings
 * (0012/0017), which already filters to `vehicle_status = 'available'`.
 * No rating/review section — this system doesn't have one yet.
 */
export function VehicleDetailHeader({ vehicle }: { vehicle: FleetCard }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{vehicle.category}</Badge>
        <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600 dark:bg-emerald-500">
          <CheckCircle2 className="size-3" />
          Available Now
        </Badge>
      </div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        {vehicle.year ? `${vehicle.year} ` : ""}
        {vehicle.make} {vehicle.model}
      </h1>
      <p className="mt-1.5 text-sm font-medium text-muted-foreground">{getVehicleTagline(vehicle)}</p>
    </div>
  );
}
