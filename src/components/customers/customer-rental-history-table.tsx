import Link from "next/link";
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
import type { CustomerRentalRow } from "@/lib/customers/queries";

export function CustomerRentalHistoryTable({ rentals }: { rentals: CustomerRentalRow[] }) {
  if (rentals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No rentals for this customer yet — rental creation arrives in Phase 3.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rental #</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>Expected Return</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount Paid</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rentals.map((rental) => (
            <TableRow key={rental.id}>
              <TableCell className="font-medium">{rental.rental_number}</TableCell>
              <TableCell>
                {rental.vehicle ? (
                  <Link
                    href={`/dashboard/vehicles/${rental.vehicle_id}`}
                    className="hover:underline"
                  >
                    {rental.vehicle.license_plate}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{formatDate(rental.rental_start_datetime)}</TableCell>
              <TableCell>{formatDate(rental.expected_return_datetime)}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize">
                  {rental.rental_status}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(rental.amount_paid)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
