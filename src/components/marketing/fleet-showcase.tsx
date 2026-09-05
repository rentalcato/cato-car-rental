"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FleetVehicleCard } from "@/components/marketing/fleet-vehicle-card";
import type { FleetCard } from "@/lib/marketing/queries";

export function FleetShowcase({ vehicles }: { vehicles: FleetCard[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return vehicles;
    return vehicles.filter((vehicle) =>
      `${vehicle.make} ${vehicle.model} ${vehicle.category}`.toLowerCase().includes(term)
    );
  }, [vehicles, search]);

  return (
    <section id="fleet" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Explore Our Fleet</h2>
        <p className="mt-3 text-muted-foreground">
          From executive sedans to spacious SUVs — a well-maintained lineup
          for business, travel and everyday driving.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-sm">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by make or model…"
            aria-label="Search vehicles"
            className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No vehicles match &ldquo;{search}&rdquo;.
        </p>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((vehicle) => (
            <FleetVehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </section>
  );
}
