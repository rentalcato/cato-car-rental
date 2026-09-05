import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { CustomerIncidentRow } from "@/lib/customers/queries";

export function CustomerIncidentHistoryTable({ incidents }: { incidents: CustomerIncidentRow[] }) {
  if (incidents.length === 0) {
    return <p className="text-sm text-muted-foreground">No damage or incident history.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reported</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Rental #</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Repair Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidents.map((incident) => (
            <TableRow key={incident.id}>
              <TableCell>{formatDate(incident.reported_date)}</TableCell>
              <TableCell>
                {incident.vehicle
                  ? [incident.vehicle.license_plate].filter(Boolean).join(" ")
                  : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {incident.rental?.rental_number ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{incident.issue_type || "—"}</TableCell>
              <TableCell>
                {incident.severity ? (
                  <Badge variant="secondary" className="capitalize">
                    {incident.severity}
                  </Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {incident.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(incident.repair_cost)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
