import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { UpcomingServiceRow } from "@/lib/maintenance/queries";

export function UpcomingServiceList({ records }: { records: UpcomingServiceRow[] }) {
  if (records.length === 0) {
    return <p className="text-sm text-muted-foreground">No upcoming service due in the next 30 days.</p>;
  }

  return (
    <div className="space-y-2">
      {records.map((record) => {
        const { overdue } = record;
        return (
          <Card key={record.id}>
            <CardContent className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <Link
                  href={`/vehicles/${record.vehicle_id}`}
                  className="font-medium hover:underline"
                >
                  {record.vehicle?.license_plate ?? "—"}
                </Link>
                <span className="ml-2 text-sm text-muted-foreground capitalize">
                  {record.maintenance_type?.replace(/_/g, " ") ?? "Service"}
                </span>
                <p className="text-xs text-muted-foreground">
                  Due {formatDate(record.next_service_date)}
                </p>
              </div>
              {overdue ? (
                <Badge variant="destructive" className="shrink-0 gap-1">
                  <AlertTriangle className="size-3" />
                  Overdue
                </Badge>
              ) : (
                <Badge variant="secondary" className="shrink-0">
                  Upcoming
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
