import Link from "next/link";
import Image from "next/image";
import { Calendar, ClipboardCheck, FileText, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RentalStatusBadge, getCustomerFacingRentalLabel } from "@/components/rentals/rental-status-badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { MyBookingRow } from "@/lib/account/queries";

/**
 * The dashboard's single most important card — everything the spec asks
 * a customer to see about their current/upcoming trip without clicking
 * anywhere: vehicle, pickup/return date+time, pickup/return location,
 * booking number and status. "View Booking"/"Digital Check-in"/"View
 * Agreement" hand off to the booking detail page for everything else
 * (payments breakdown, condition report, etc.) rather than crowding this
 * card further.
 */
export function CurrentRentalCard({
  booking,
  imageUrl,
  isUpcoming,
  businessAddress,
  checkinCompleted,
}: {
  booking: MyBookingRow;
  imageUrl: string;
  isUpcoming: boolean;
  businessAddress: string | null;
  /** null = check-in not applicable to this status (e.g. still pending approval). */
  checkinCompleted: boolean | null;
}) {
  const vehicleName = booking.vehicle
    ? [booking.vehicle.make, booking.vehicle.model].filter(Boolean).join(" ")
    : "Vehicle";

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="grid grid-cols-1 gap-0 p-0 md:grid-cols-5">
        <div className="relative aspect-4/3 md:col-span-2">
          <Image src={imageUrl} alt={vehicleName} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
        </div>

        <div className="flex flex-col gap-4 p-5 md:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium tracking-wide text-primary uppercase">
                {isUpcoming ? "Upcoming Trip" : "Current Trip"}
              </p>
              <h2 className="text-xl font-semibold">{vehicleName}</h2>
              <p className="text-xs text-muted-foreground">Booking #{booking.rental_number}</p>
            </div>
            <RentalStatusBadge
              status={booking.rental_status}
              label={getCustomerFacingRentalLabel(booking.rental_status, booking.approval_status)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 border-t pt-4 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                <p className="font-medium">{formatDateTime(booking.rental_start_datetime)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Return</p>
                <p className="font-medium">{formatDateTime(booking.expected_return_datetime)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 sm:col-span-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Pickup &amp; return location</p>
                <p className="font-medium">{businessAddress || "Contact us for pickup details"}</p>
              </div>
            </div>
          </div>

          {booking.balance_due && booking.balance_due > 0 ? (
            <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-500">
              Balance due: {formatCurrency(booking.balance_due)}
            </p>
          ) : null}

          <div className="mt-auto flex flex-wrap gap-2 border-t pt-4">
            <Button size="sm" render={<Link href={`/account/rentals/${booking.id}`} />}>
              View Booking
            </Button>
            {checkinCompleted === false ? (
              <Button size="sm" variant="outline" render={<Link href={`/account/rentals/${booking.id}#checkin`} />}>
                <ClipboardCheck className="size-3.5" />
                Complete Check-in
              </Button>
            ) : null}
            <Button size="sm" variant="outline" render={<Link href={`/account/rentals/${booking.id}#agreement`} />}>
              <FileText className="size-3.5" />
              View Agreement
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
