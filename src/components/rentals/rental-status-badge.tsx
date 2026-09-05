import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RentalStatus } from "@/types/database.types";

export const RENTAL_STATUS_CONFIG: Record<RentalStatus, { label: string; color: string }> = {
  reserved: { label: "Reserved", color: "#2a78d6" },
  active: { label: "Active", color: "#0ca30c" },
  completed: { label: "Completed", color: "#6b7280" },
  overdue: { label: "Overdue", color: "#d03b3b" },
  cancelled: { label: "Cancelled", color: "#8a8a8a" },
};

export function RentalStatusBadge({ status, className }: { status: RentalStatus; className?: string }) {
  const config = RENTAL_STATUS_CONFIG[status];
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
