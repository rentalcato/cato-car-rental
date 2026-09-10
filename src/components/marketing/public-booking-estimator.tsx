"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Info, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { computePricingTiers } from "@/lib/vehicles/details";

function toLocalDateInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function daysBetween(pickup: string, ret: string): number {
  const start = new Date(`${pickup}T00:00:00`);
  const end = new Date(`${ret}T00:00:00`);
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
}

/**
 * Anonymous, estimate-only price calculator for the public Vehicle
 * Details page — real submission (requestReservation()) already exists
 * and requires a signed-in, linked customer account (see
 * lib/account/actions.ts), so "Book Now" here hands off to /login with
 * `next` pointed straight back at this vehicle's account-side details
 * page, where the real BookingForm takes over. No booking is created
 * from this component itself.
 */
export function PublicBookingEstimator({
  vehicleId,
  dailyRate,
  deposit,
  location,
  isBookable,
  availabilityLabel,
}: {
  vehicleId: string;
  dailyRate: number | null;
  deposit: number | null;
  location: string | null;
  /** false while the vehicle has an open reservation/rental (0024) — the estimate still shows, but "Book Now" is replaced with an explanation. */
  isBookable: boolean;
  availabilityLabel: string;
}) {
  const [pickupDate, setPickupDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toLocalDateInputValue(tomorrow);
  });
  const [returnDate, setReturnDate] = useState(() => {
    const inThreeDays = new Date();
    inThreeDays.setDate(inThreeDays.getDate() + 4);
    return toLocalDateInputValue(inThreeDays);
  });

  const days = useMemo(() => daysBetween(pickupDate, returnDate), [pickupDate, returnDate]);
  const tiers = useMemo(() => computePricingTiers(dailyRate), [dailyRate]);

  // Same weekly/monthly discount rates shown in the pricing summary card
  // above (computePricingTiers) — applied here across a continuous day
  // count rather than three fixed tiers.
  const subtotal = useMemo(() => {
    if (dailyRate === null) return null;
    if (days >= 30) return Math.round(dailyRate * days * (1 - tiers.monthlySavingsPct / 100));
    if (days >= 7) return Math.round(dailyRate * days * (1 - tiers.weeklySavingsPct / 100));
    return dailyRate * days;
  }, [dailyRate, days, tiers]);

  const total = subtotal !== null ? subtotal + (deposit ?? 0) : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="est_pickup">Pickup date</Label>
          <Input
            id="est_pickup"
            type="date"
            value={pickupDate}
            min={toLocalDateInputValue(new Date())}
            onChange={(e) => setPickupDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="est_return">Return date</Label>
          <Input
            id="est_return"
            type="date"
            value={returnDate}
            min={pickupDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0" />
        <span>{location || "Pickup and return location provided at booking"}</span>
      </div>

      <div className="space-y-2 rounded-md border p-3 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            {days} {days === 1 ? "day" : "days"}
          </span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        {deposit ? (
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Security deposit</span>
            <span>{formatCurrency(deposit)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
          <span>Estimated total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {isBookable ? (
        <>
          <Button size="lg" className="w-full" render={<Link href={`/login?next=/account/fleet/${vehicleId}`} />}>
            Book Now
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Sign in to confirm this reservation, or{" "}
            <Link href="/signup" className="font-medium underline underline-offset-2">
              create an account
            </Link>{" "}
            first.
          </p>
        </>
      ) : (
        <div className="flex items-start gap-2 rounded-md bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-500">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            This vehicle is currently <strong>{availabilityLabel.toLowerCase()}</strong> and can&apos;t be booked
            right now. Check the Similar Vehicles below, or check back once it&apos;s available again.
          </span>
        </div>
      )}
    </div>
  );
}
