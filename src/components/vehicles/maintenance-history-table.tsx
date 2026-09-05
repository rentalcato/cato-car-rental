import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import type { Maintenance } from "@/types/database.types";

export function MaintenanceHistoryTable({ records }: { records: Maintenance[] }) {
  if (records.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No maintenance recorded yet — maintenance logging arrives in a later phase.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Service Date</TableHead>
            <TableHead>Next Service</TableHead>
            <TableHead className="text-right">Mileage</TableHead>
            <TableHead className="text-right">Cost</TableHead>
            <TableHead>Provider</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">{record.maintenance_type ?? "—"}</TableCell>
              <TableCell>{formatDate(record.service_date)}</TableCell>
              <TableCell>{formatDate(record.next_service_date)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(record.mileage_at_service)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(record.cost)}
              </TableCell>
              <TableCell>{record.service_provider ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
