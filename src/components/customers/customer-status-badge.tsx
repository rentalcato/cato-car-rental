import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CustomerStatus } from "@/types/database.types";

/** Same fixed status-palette convention as VEHICLE_STATUS_CONFIG. */
export const CUSTOMER_STATUS_CONFIG: Record<CustomerStatus, { label: string; color: string }> = {
  active: { label: "Active", color: "#0ca30c" },
  restricted: { label: "Restricted", color: "#e0a100" },
  blacklisted: { label: "Blacklisted", color: "#d03b3b" },
  inactive: { label: "Inactive", color: "#8a8a8a" },
};

export function CustomerStatusBadge({
  status,
  className,
}: {
  status: CustomerStatus;
  className?: string;
}) {
  const config = CUSTOMER_STATUS_CONFIG[status];
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
