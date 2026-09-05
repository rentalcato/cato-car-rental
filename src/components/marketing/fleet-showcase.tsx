import { FleetVehicleCard } from "@/components/marketing/fleet-vehicle-card";
import type { FleetCard } from "@/lib/marketing/queries";

export function FleetShowcase({ vehicles }: { vehicles: FleetCard[] }) {
  return (
    <section id="fleet" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Explore Our Fleet</h2>
        <p className="mt-3 text-muted-foreground">
          From executive sedans to spacious SUVs — a well-maintained lineup
          for business, travel and everyday driving.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {vehicles.map((vehicle) => (
          <FleetVehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </section>
  );
}
