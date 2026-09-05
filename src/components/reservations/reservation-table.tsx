import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { CheckInDialog } from "@/components/reservations/check-in-dialog";
import { CancelReservationDialog } from "@/components/reservations/cancel-reservation-dialog";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { ReservationRow } from "@/lib/reservations/queries";

export function ReservationTable({
  reservations,
  canOverrideBlacklist,
}: {
  reservations: ReservationRow[];
  canOverrideBlacklist: boolean;
}) {
  if (reservations.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          No upcoming reservations.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rental #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Pickup</TableHead>
            <TableHead>Days</TableHead>
            <TableHead className="text-right">Deposit</TableHead>
            <TableHead className="w-1" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((reservation) => (
            <TableRow key={reservation.id}>
              <TableCell className="font-medium">{reservation.rental_number}</TableCell>
              <TableCell>
                {reservation.customer ? (
                  <Link
                    href={`/dashboard/customers/${reservation.customer.id}`}
                    className="hover:underline"
                  >
                    {reservation.customer.first_name} {reservation.customer.last_name}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {reservation.vehicle ? (
                  <Link
                    href={`/dashboard/vehicles/${reservation.vehicle_id}`}
                    className="hover:underline"
                  >
                    {reservation.vehicle.license_plate}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{formatDateTime(reservation.rental_start_datetime)}</TableCell>
              <TableCell>{reservation.rental_duration_days}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(reservation.deposit_amount)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1.5">
                  {reservation.customer ? (
                    <CheckInDialog
                      rentalId={reservation.id}
                      vehicleId={reservation.vehicle_id}
                      customerId={reservation.customer.id}
                      rentalNumber={reservation.rental_number}
                      customerStatus={reservation.customer.status}
                      canOverrideBlacklist={canOverrideBlacklist}
                    />
                  ) : null}
                  <CancelReservationDialog
                    rentalId={reservation.id}
                    vehicleId={reservation.vehicle_id}
                    customerId={reservation.customer_id}
                    rentalNumber={reservation.rental_number}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
