import Link from "next/link";
import Image from "next/image";
import { Calendar, FileText, MapPin, MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RentalStatusBadge, getCustomerFacingRentalLabel } from "@/components/rentals/rental-status-badge";
import { CancelBookingButton } from "@/components/account/cancel-booking-button";
import { formatCurrency, formatDate } from "@/lib/format";
import type { MyBookingRow } from "@/lib/account/queries";

/**
 * One booking as a card — used for both the Upcoming and History tabs on
 * My Rentals. Cards over a table: this is the customer-facing area
 * (spec calls for "modern cards, high-quality vehicle imagery"), while
 * the staff dashboard's dense tables stay as they are.
 */
export function BookingCard({
  booking,
  imageUrl,
  businessAddress,
}: {
  booking: MyBookingRow;
  imageUrl: string;
  businessAddress: string | null;
}) {
  const vehicleName = booking.vehicle
    ? [booking.vehicle.make, booking.vehicle.model].filter(Boolean).join(" ") || "Vehicle"
    : "Vehicle";
  const isUpcoming = booking.rental_status === "reserved" || booking.rental_status === "active" || booking.rental_status === "overdue";
  const canCancel = booking.rental_status === "reserved";

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="grid grid-cols-1 gap-0 p-0 sm:grid-cols-3">
        <div className="relative aspect-4/3">
          <Image src={imageUrl} alt={vehicleName} fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover" />
        </div>

        <div className="flex flex-col gap-3 p-4 sm:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold">{vehicleName}</h3>
              <p className="text-xs text-muted-foreground">Booking #{booking.rental_number}</p>
            </div>
            <RentalStatusBadge
              status={booking.rental_status}
              label={getCustomerFacingRentalLabel(booking.rental_status, booking.approval_status)}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="size-3.5 shrink-0" />
              {formatDate(booking.rental_start_datetime)} – {formatDate(booking.expected_return_datetime)}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{businessAddress || "Contact us for location"}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-md bg-muted/50 p-2.5 text-center text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">Total</p>
              <p className="font-medium tabular-nums">{formatCurrency(booking.total_amount)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Paid</p>
              <p className="font-medium tabular-nums">{formatCurrency(booking.amount_paid)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Balance</p>
              <p className={`font-medium tabular-nums ${(booking.balance_due ?? 0) > 0 ? "text-destructive" : ""}`}>
                {formatCurrency(booking.balance_due)}
              </p>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
            <Button size="sm" variant="outline" render={<Link href={`/account/rentals/${booking.id}`} />}>
              View Booking
            </Button>
            {isUpcoming ? (
              <Button
                size="sm"
                variant="outline"
                render={<Link href={`/account/support?subject=${encodeURIComponent(`Modify booking #${booking.rental_number}`)}`} />}
              >
                <MessageCircleQuestion className="size-3.5" />
                Modify
              </Button>
            ) : null}
            {canCancel ? <CancelBookingButton rentalId={booking.id} /> : null}
            {!isUpcoming ? (
              <Button size="sm" variant="outline" render={<Link href={`/account/rentals/${booking.id}#payments`} />}>
                <FileText className="size-3.5" />
                Receipt
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
