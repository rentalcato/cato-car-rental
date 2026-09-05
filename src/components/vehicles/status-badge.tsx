import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VehicleStatus } from "@/types/database.types";

/**
 * Colors from the dataviz skill's fixed status palette (good/warning/
 * serious/critical) for the three genuine severity states, plus two
 * categorical hues for the non-alarming "in progress" states. The text
 * label always accompanies the dot — color is never the only signal.
 */
export const VEHICLE_STATUS_CONFIG: Record<VehicleStatus, { label: string; color: string }> = {
  available: { label: "Available", color: "#0ca30c" },
  reserved: { label: "Reserved", color: "#2a78d6" },
  rented: { label: "Rented", color: "#4a3aa7" },
  overdue: { label: "Overdue", color: "#d03b3b" },
  maintenance: { label: "Maintenance", color: "#fab219" },
  damaged: { label: "Damaged", color: "#b91c1c" },
  out_of_service: { label: "Out of Service", color: "#ec835a" },
};

export function VehicleStatusBadge({
  status,
  className,
}: {
  status: VehicleStatus;
  className?: string;
}) {
  const config = VEHICLE_STATUS_CONFIG[status];
  return (
    <Badge variant="secondary" className={cn("gap-1.5 font-medium", className)}>
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: config.color }}
        aria-hidden
      />
      {config.label}
    </Badge>
  );
}
