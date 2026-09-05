import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import type { OverdueRentalRow } from "@/lib/reports/queries";

export function OverdueRentalsTable({ rentals }: { rentals: OverdueRentalRow[] }) {
  if (rentals.length === 0) {
    return <p className="text-sm text-muted-foreground">No overdue rentals right now.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rental #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Expected Return</TableHead>
            <TableHead className="text-right">Balance Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rentals.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.rentalNumber}</TableCell>
              <TableCell>
                <Link href={`/customers/${r.customerId}`} className="hover:underline">
                  {r.customerName}
                </Link>
              </TableCell>
              <TableCell>
                <Link href={`/vehicles/${r.vehicleId}`} className="hover:underline">
                  {r.licensePlate}
                </Link>
              </TableCell>
              <TableCell className="text-destructive">{formatDate(r.expectedReturn)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(r.balanceDue)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
