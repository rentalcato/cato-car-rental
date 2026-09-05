import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { CurrentRentalInfo } from "@/lib/vehicles/queries";

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

/** Shown on the vehicle profile whenever the vehicle is Reserved (booked, not yet handed over). */
export function UpcomingReservationCard({ reservation }: { reservation: CurrentRentalInfo }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="mb-2 text-xs text-muted-foreground">Upcoming Reservation</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <DetailItem
            label="Customer"
            value={
              reservation.customer ? (
                <Link
                  href={`/dashboard/customers/${reservation.customer.id}`}
                  className="hover:underline"
                >
                  {reservation.customer.first_name} {reservation.customer.last_name}
                </Link>
              ) : (
                "Unknown customer"
              )
            }
          />
          <DetailItem label="Rental #" value={reservation.rental_number} />
          <DetailItem label="Pickup" value={formatDateTime(reservation.rental_start_datetime)} />
          <DetailItem label="Deposit" value={formatCurrency(reservation.deposit_amount)} />
        </div>
      </CardContent>
    </Card>
  );
}
