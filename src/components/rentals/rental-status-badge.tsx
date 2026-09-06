import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReservationApprovalStatus, RentalStatus } from "@/types/database.types";

export const RENTAL_STATUS_CONFIG: Record<RentalStatus, { label: string; color: string }> = {
  reserved: { label: "Reserved", color: "#2a78d6" },
  active: { label: "Active", color: "#0ca30c" },
  completed: { label: "Completed", color: "#6b7280" },
  overdue: { label: "Overdue", color: "#d03b3b" },
  cancelled: { label: "Cancelled", color: "#8a8a8a" },
};

export function RentalStatusBadge({
  status,
  className,
  label,
}: {
  status: RentalStatus;
  className?: string;
  /** Overrides the default label text for this one badge — e.g. the customer account area shows "reserved" as "Pending Reservation". */
  label?: string;
}) {
  const config = RENTAL_STATUS_CONFIG[status];
  return (
    <Badge variant="secondary" className={cn("gap-1.5 font-medium", className)}>
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: config.color }}
        aria-hidden
      />
      {label ?? config.label}
    </Badge>
  );
}

/**
 * What a customer sees for their own booking — distinct from the plain
 * `status`, since "reserved" alone doesn't say whether staff have
 * actually reviewed a self-service reservation yet (0020's
 * approval_status). A staff-created reservation is implicitly
 * pre-approved (approval_status stays null), so it reads as
 * "Confirmed" immediately, same as an approved self-service one.
 */
export function getCustomerFacingRentalLabel(
  rentalStatus: RentalStatus,
  approvalStatus: ReservationApprovalStatus | null
): string | undefined {
  if (rentalStatus !== "reserved") return undefined;
  return approvalStatus === "pending" ? "Pending Reservation" : "Confirmed";
}
