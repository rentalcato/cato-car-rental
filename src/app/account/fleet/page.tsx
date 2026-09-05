import Link from "next/link";
import Image from "next/image";
import { Users, Cog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getBookableVehicles } from "@/lib/marketing/queries";
import { formatCurrency } from "@/lib/format";

// AccountLayout already calls requireUser(). Same catalog as the public
// homepage's fleet showcase (public_vehicle_listings, 0012/0013), just
// unlimited and demo-free — a real booking screen, not a marketing one.
export default async function AccountFleetPage() {
  const vehicles = await getBookableVehicles();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Browse Fleet</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a vehicle to see details and request a reservation.
      </p>

      {vehicles.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Nothing available for booking right now — check back soon.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Link
              key={vehicle.id}
              href={`/account/fleet/${vehicle.id}`}
              className="group block overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-4/3 overflow-hidden bg-muted">
                <Image
                  src={vehicle.imageUrl}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
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

                <div className="flex items-center justify-between border-t pt-3">
                  {vehicle.dailyRate !== null ? (
                    <span>
                      <span className="text-lg font-semibold">{formatCurrency(vehicle.dailyRate)}</span>
                      <span className="text-xs text-muted-foreground"> / day</span>
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Price on request</span>
                  )}
                  <span className="text-sm font-medium text-primary group-hover:underline">
                    View Details
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
