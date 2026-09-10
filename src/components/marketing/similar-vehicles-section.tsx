import Link from "next/link";
import { FleetVehicleCard } from "@/components/marketing/fleet-vehicle-card";
import type { FleetCard } from "@/lib/marketing/queries";

/** Reuses the exact same card as the homepage fleet grid — clicking Details on any of these goes to that vehicle's own details page, same component and route as everywhere else. */
export function SimilarVehiclesSection({
  vehicles,
  fleetHref = "/#fleet",
  cardHrefBase = "/fleet",
}: {
  vehicles: FleetCard[];
  fleetHref?: string;
  cardHrefBase?: string;
}) {
  if (vehicles.length === 0) return null;

  return (
    <section className="border-t pt-10">
      <div className="mb-5 flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight">Similar Vehicles</h2>
        <Link href={fleetHref} className="text-sm font-medium text-primary hover:underline">
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {vehicles.map((vehicle) => (
          <FleetVehicleCard key={vehicle.id} vehicle={vehicle} hrefBase={cardHrefBase} />
        ))}
      </div>
    </section>
  );
}
