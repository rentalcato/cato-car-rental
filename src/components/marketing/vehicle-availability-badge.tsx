import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getVehicleAvailability } from "@/lib/vehicles/availability";
import type { ReservationApprovalStatus, VehicleStatus } from "@/types/database.types";

/** Same dot-plus-label shape as the staff-side VehicleStatusBadge, just for the customer-facing statuses (0024). */
export function VehicleAvailabilityBadge({
  vehicleStatus,
  currentRentalApprovalStatus,
  className,
}: {
  vehicleStatus: VehicleStatus;
  currentRentalApprovalStatus: ReservationApprovalStatus | null;
  className?: string;
}) {
  const availability = getVehicleAvailability(vehicleStatus, currentRentalApprovalStatus);
  return (
    <Badge variant="secondary" className={cn("gap-1.5 font-medium", className)}>
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: availability.color }} aria-hidden />
      {availability.label}
    </Badge>
  );
}
