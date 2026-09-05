import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RentalStatusBadge } from "@/components/rentals/rental-status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { MyBookingRow } from "@/lib/account/queries";

export function MyBookingsTable({ bookings }: { bookings: MyBookingRow[] }) {
  if (bookings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">You don&apos;t have any bookings yet.</p>
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
            <TableHead className="text-right">Balance Due</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">{booking.rental_number}</TableCell>
              <TableCell>
                {booking.vehicle
                  ? [booking.vehicle.make, booking.vehicle.model].filter(Boolean).join(" ") || "—"
                  : "—"}
              </TableCell>
              <TableCell>{formatDate(booking.rental_start_datetime)}</TableCell>
              <TableCell>{formatDate(booking.expected_return_datetime)}</TableCell>
              <TableCell>
                <RentalStatusBadge status={booking.rental_status} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(booking.balance_due)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
