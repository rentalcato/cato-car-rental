import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { VEHICLE_STATUSES } from "@/lib/constants";
import type { VehicleStatus } from "@/types/database.types";
import { VEHICLE_STATUS_CONFIG } from "@/components/vehicles/status-badge";

/**
 * Six stat tiles (dataviz skill: a bare count needs no chart). Each is a
 * link that sets the list's status filter — doubling as the "filter by
 * status" requirement.
 */
export function StatusSummaryCards({
  counts,
  activeStatus,
}: {
  counts: Record<VehicleStatus, number>;
  activeStatus?: VehicleStatus;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {VEHICLE_STATUSES.map((status) => {
        const config = VEHICLE_STATUS_CONFIG[status];
        const isActive = activeStatus === status;
        return (
          <Link
            key={status}
            href={isActive ? "/dashboard/vehicles" : `/dashboard/vehicles?status=${status}`}
            aria-current={isActive ? "true" : undefined}
          >
            <Card
              className={cn(
                "transition-colors hover:bg-muted/50",
                isActive && "border-primary ring-1 ring-primary"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: config.color }}
                    aria-hidden
                  />
                  {config.label}
                </div>
                <div className="mt-1 text-2xl font-bold tabular-nums">
                  {counts[status]}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
