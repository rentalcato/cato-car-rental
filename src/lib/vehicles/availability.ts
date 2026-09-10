/**
 * Customer-facing availability status for a vehicle shown via
 * public_vehicle_listings (0024) — the view now includes reserved/
 * rented/overdue vehicles, not just 'available' ones, so a listing or
 * detail page needs an honest label instead of assuming "visible means
 * bookable". Colors are the same ones the staff-side VehicleStatusBadge
 * already uses (src/components/vehicles/status-badge.tsx) — same status
 * system, just customer-appropriate wording (no "maintenance"/"damaged"
 * language reaches this far since the view excludes those statuses).
 */

import type { ReservationApprovalStatus, VehicleStatus } from "@/types/database.types";

export interface VehicleAvailability {
  label: string;
  /** Matches VEHICLE_STATUS_CONFIG's dot colors (staff status-badge.tsx) — kept as literal hex here rather than importing a components/ file from lib/. */
  color: string;
  /** Whether a *new* reservation can be started for this vehicle right now — mirrors check_vehicle_available_for_rental() (0007): only 'available' vehicles accept a new rental. */
  isBookable: boolean;
}

export function getVehicleAvailability(
  vehicleStatus: VehicleStatus,
  currentRentalApprovalStatus: ReservationApprovalStatus | null
): VehicleAvailability {
  if (vehicleStatus === "reserved") {
    return currentRentalApprovalStatus === "pending"
      ? { label: "Reservation Pending", color: "#2a78d6", isBookable: false }
      : { label: "Reserved", color: "#2a78d6", isBookable: false };
  }
  if (vehicleStatus === "rented" || vehicleStatus === "overdue") {
    return { label: "Currently Rented", color: "#4a3aa7", isBookable: false };
  }
  // available (the only other status this view ever returns — see 0024)
  return { label: "Available Now", color: "#0ca30c", isBookable: true };
}
