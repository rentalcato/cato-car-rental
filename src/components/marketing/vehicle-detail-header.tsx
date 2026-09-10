import { Badge } from "@/components/ui/badge";
import { VehicleAvailabilityBadge } from "@/components/marketing/vehicle-availability-badge";
import { getVehicleTagline } from "@/lib/vehicles/details";
import type { FleetCard } from "@/lib/marketing/queries";

/**
 * "2024 Mercedes-Benz GLE 450" / "Luxury SUV • Automatic • 5 Seats" —
 * the header block shared by the public and account Vehicle Details
 * pages. Availability reflects the vehicle's real status (0024) — a
 * vehicle with an open reservation still has its own details page, it
 * just says so honestly instead of claiming "Available Now". No
 * rating/review section — this system doesn't have one yet.
 */
export function VehicleDetailHeader({ vehicle }: { vehicle: FleetCard }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{vehicle.category}</Badge>
        <VehicleAvailabilityBadge
          vehicleStatus={vehicle.vehicleStatus}
          currentRentalApprovalStatus={vehicle.currentRentalApprovalStatus}
        />
      </div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
        {vehicle.year ? `${vehicle.year} ` : ""}
        {vehicle.make} {vehicle.model}
      </h1>
      <p className="mt-1.5 text-sm font-medium text-muted-foreground">{getVehicleTagline(vehicle)}</p>
    </div>
  );
}
