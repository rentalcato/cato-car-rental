import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import type { VehiclePerformanceRow } from "@/lib/reports/queries";

export function FleetPerformanceTable({ vehicles }: { vehicles: VehiclePerformanceRow[] }) {
  if (vehicles.length === 0) {
    return <p className="text-sm text-muted-foreground">No vehicles in the fleet yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead className="text-right">Rentals</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Maintenance Cost</TableHead>
            <TableHead className="text-right">Profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.map((v) => (
            <TableRow key={v.vehicleId}>
              <TableCell className="font-medium">
                <Link href={`/vehicles/${v.vehicleId}`} className="hover:underline">
                  {v.licensePlate}
                </Link>
                <span className="ml-1.5 text-muted-foreground">
                  {[v.make, v.model].filter(Boolean).join(" ")}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">{v.rentalCount}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(v.revenue)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(v.maintenanceCost)}
              </TableCell>
              <TableCell
                className={
                  v.profit < 0
                    ? "text-right font-medium tabular-nums text-destructive"
                    : "text-right font-medium tabular-nums"
                }
              >
                {formatCurrency(v.profit)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
