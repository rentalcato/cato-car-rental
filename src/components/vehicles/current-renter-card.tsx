import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CompleteRentalDialog } from "@/components/rentals/complete-rental-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import type { CurrentRentalInfo } from "@/lib/vehicles/queries";

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

/** The spec's "CURRENT RENTER" panel, shown on the vehicle profile whenever the vehicle is Rented. */
export function CurrentRenterCard({ rental }: { rental: CurrentRentalInfo | null }) {
  if (!rental) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Current Renter</p>
          <p className="text-sm text-muted-foreground">Not currently rented</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Current Renter</p>
          <CompleteRentalDialog
            rentalId={rental.id}
            vehicleId={rental.vehicle_id}
            customerId={rental.customer_id}
            rentalNumber={rental.rental_number}
            checkoutMileage={rental.checkout_mileage}
            balanceDue={rental.balance_due}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <DetailItem
            label="Customer"
            value={
              rental.customer ? (
                <Link
                  href={`/dashboard/customers/${rental.customer.id}`}
                  className="hover:underline"
                >
                  {rental.customer.first_name} {rental.customer.last_name}
                </Link>
              ) : (
                "Unknown customer"
              )
            }
          />
          <DetailItem label="Customer ID" value={rental.customer?.customer_number ?? "—"} />
          <DetailItem label="Phone" value={rental.customer?.primary_phone || "—"} />
          <DetailItem label="Rental #" value={rental.rental_number} />
          <DetailItem label="Rental Start" value={formatDate(rental.rental_start_datetime)} />
          <DetailItem label="Expected Return" value={formatDate(rental.expected_return_datetime)} />
          <DetailItem label="Amount Paid" value={formatCurrency(rental.amount_paid)} />
          <DetailItem label="Balance Outstanding" value={formatCurrency(rental.balance_due)} />
        </div>
      </CardContent>
    </Card>
  );
}
