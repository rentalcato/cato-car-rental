"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RentalStatusBadge } from "@/components/rentals/rental-status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { cancelMyReservation } from "@/lib/account/actions";
import type { MyBookingRow } from "@/lib/account/queries";

function CancelBookingButton({ rentalId }: { rentalId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    if (!window.confirm("Cancel this reservation?")) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelMyReservation(rentalId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" disabled={isPending} onClick={handleCancel}>
        {isPending ? "Cancelling…" : "Cancel"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

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
            <TableHead className="w-1" />
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
                <RentalStatusBadge
                  status={booking.rental_status}
                  label={booking.rental_status === "reserved" ? "Pending Reservation" : undefined}
                />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(booking.balance_due)}
              </TableCell>
              <TableCell>
                {booking.rental_status === "reserved" ? (
                  <CancelBookingButton rentalId={booking.id} />
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
