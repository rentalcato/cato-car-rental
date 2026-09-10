"use client";

import { useMemo, useState } from "react";
import type { FleetCard } from "@/lib/marketing/queries";

export type FleetSort = "featured" | "price-asc" | "price-desc";

export const FLEET_SORT_LABELS: Record<FleetSort, string> = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
};

/**
 * Shared search + category filter + sort behind both the homepage fleet
 * showcase and the signed-in Browse Fleet screen — same logic, applied
 * client-side against the already-fetched vehicle list (a handful of
 * vehicles today; revisit with server-side filtering if the catalog
 * grows enough for that to matter).
 */
export function useFleetFilters(vehicles: FleetCard[]) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<FleetSort>("featured");

  const categories = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.category))).sort(),
    [vehicles]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let result = vehicles.filter((vehicle) => {
      const matchesSearch = !term || `${vehicle.make} ${vehicle.model} ${vehicle.category}`.toLowerCase().includes(term);
      const matchesCategory = category === "all" || vehicle.category === category;
      return matchesSearch && matchesCategory;
    });

    if (sort === "price-asc") {
      result = [...result].sort((a, b) => (a.dailyRate ?? Infinity) - (b.dailyRate ?? Infinity));
    } else if (sort === "price-desc") {
      result = [...result].sort((a, b) => (b.dailyRate ?? -Infinity) - (a.dailyRate ?? -Infinity));
    }

    return result;
  }, [vehicles, search, category, sort]);

  return { search, setSearch, category, setCategory, sort, setSort, categories, filtered };
}
