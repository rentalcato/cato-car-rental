"use client";

import Link from "next/link";
import Image from "next/image";
import { Car, Users, Cog, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { FleetFilterBar } from "@/components/marketing/fleet-filter-bar";
import { useFleetFilters } from "@/components/marketing/use-fleet-filters";
import { FavoriteButton } from "@/components/account/favorite-button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FleetCard } from "@/lib/marketing/queries";

/** Search + category + sort (shared with the homepage, see useFleetFilters) applied client-side to the signed-in Browse Fleet catalog, plus the favorite-toggle overlay a public card doesn't need. */
export function AccountFleetBrowser({
  vehicles,
  favoriteIds,
}: {
  vehicles: FleetCard[];
  favoriteIds: Set<string>;
}) {
  const { search, setSearch, category, setCategory, sort, setSort, categories, filtered } =
    useFleetFilters(vehicles);

  return (
    <div>
      <FleetFilterBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
        sort={sort}
        onSortChange={setSort}
      />

      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 text-center">
          <Car className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {vehicles.length === 0
              ? "Nothing available for booking right now — check back soon."
              : `No vehicles match your search${search ? ` "${search}"` : ""}.`}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((vehicle) => (
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
                <div className="absolute top-2 right-2">
                  <FavoriteButton vehicleId={vehicle.id} initialFavorited={favoriteIds.has(vehicle.id)} />
                </div>
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
                  <span
                    aria-hidden
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
                    )}
                  >
                    Details
                    <ArrowRight className="size-3.5" />
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
