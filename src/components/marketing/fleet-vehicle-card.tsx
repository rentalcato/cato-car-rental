import Link from "next/link";
import Image from "next/image";
import { Users, Cog, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { FleetCard } from "@/lib/marketing/queries";

/**
 * The one vehicle card used everywhere a vehicle needs to be browsed —
 * the homepage fleet showcase and the Similar Vehicles section on a
 * Vehicle Details page both render this exact component, just pointed
 * at a different details-route base (`hrefBase`) for the audience
 * they're shown to (public `/fleet/[id]` vs the signed-in `/account/fleet/[id]`).
 * The whole card stays a click target (existing behaviour, unchanged);
 * the explicit Details button just makes that affordance unambiguous.
 */
export function FleetVehicleCard({
  vehicle,
  hrefBase = "/fleet",
}: {
  vehicle: FleetCard;
  hrefBase?: string;
}) {
  const href = vehicle.isDemo ? "#contact" : `${hrefBase}/${vehicle.id}`;

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        <Image
          src={vehicle.imageUrl}
          alt={`${vehicle.make} ${vehicle.model}`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          loading="lazy"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <Badge variant="secondary" className="absolute top-3 left-3 shadow-sm">
          {vehicle.category}
        </Badge>
      </div>

      <div className="space-y-3 p-4">
        <div>
          <h3 className="font-semibold">
            {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.year ? <p className="text-xs text-muted-foreground">{vehicle.year}</p> : null}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {vehicle.seats} seats
          </span>
          <span className="flex items-center gap-1">
            <Cog className="size-3.5" />
            {vehicle.transmission}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <div>
            {vehicle.dailyRate !== null ? (
              <>
                <span className="text-lg font-semibold">{formatCurrency(vehicle.dailyRate)}</span>
                <span className="text-xs text-muted-foreground"> / day</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Price on request</span>
            )}
          </div>
          {/* A styled span, not <Button> — the whole card is already the
              <Link>, so an actual nested <button> would be invalid HTML.
              This is the visible "Details" affordance the card's click
              target represents. */}
          <span
            aria-hidden
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
            )}
          >
            {vehicle.isDemo ? "Enquire" : "Details"}
            <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
