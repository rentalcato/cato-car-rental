import Link from "next/link";
import Image from "next/image";
import { Users, Cog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";
import type { FleetCard } from "@/lib/marketing/queries";

export function FleetVehicleCard({ vehicle }: { vehicle: FleetCard }) {
  const href = vehicle.isDemo ? "#contact" : `/fleet/${vehicle.id}`;

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

        <div className="flex items-center justify-between border-t pt-3">
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
          <span className="text-sm font-medium text-primary group-hover:underline">
            {vehicle.isDemo ? "Enquire" : "View Details"}
          </span>
        </div>
      </div>
    </Link>
  );
}
