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
import { RentalStatusBadge } from "@/components/rentals/rental-status-badge";
import { CompleteRentalDialog } from "@/components/rentals/complete-rental-dialog";
import { RecordPaymentDialog } from "@/components/payments/record-payment-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import type { RentalListRow } from "@/lib/rentals/queries";

export function RentalTable({
  rentals,
  canRecordPayment,
}: {
  rentals: RentalListRow[];
  canRecordPayment: boolean;
}) {
  if (rentals.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          No rentals match your filters.
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
            <TableHead>Start</TableHead>
            <TableHead>Expected Return</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Balance Due</TableHead>
            <TableHead className="w-1" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rentals.map((rental) => (
            <TableRow key={rental.id}>
              <TableCell className="font-medium">{rental.rental_number}</TableCell>
              <TableCell>
                {rental.customer ? (
                  <Link
                    href={`/customers/${rental.customer.id}`}
                    className="hover:underline"
                  >
                    {rental.customer.first_name} {rental.customer.last_name}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {rental.vehicle ? (
                  <Link
                    href={`/vehicles/${rental.vehicle_id}`}
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
                <RentalStatusBadge status={rental.rental_status} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(rental.balance_due)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1.5">
                  {rental.rental_status === "active" || rental.rental_status === "overdue" ? (
                    <CompleteRentalDialog
                      rentalId={rental.id}
                      vehicleId={rental.vehicle_id}
                      customerId={rental.customer_id}
                      rentalNumber={rental.rental_number}
                      checkoutMileage={rental.checkout_mileage}
                      balanceDue={rental.balance_due}
                    />
                  ) : null}
                  {canRecordPayment ? (
                    <RecordPaymentDialog
                      rentalId={rental.id}
                      vehicleId={rental.vehicle_id}
                      customerId={rental.customer_id}
                      rentalNumber={rental.rental_number}
                    />
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
