"use client";

import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FLEET_SORT_LABELS, type FleetSort } from "@/components/marketing/use-fleet-filters";

/** Search + category filter + sort — shared by the homepage fleet showcase and the signed-in Browse Fleet screen. */
export function FleetFilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  sort,
  onSortChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  sort: FleetSort;
  onSortChange: (value: FleetSort) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative sm:w-64">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by make or model…"
          aria-label="Search vehicles"
          className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <Select value={category} onValueChange={(value) => onCategoryChange(value as string)}>
        <SelectTrigger className="sm:w-44" aria-label="Filter by category">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(value) => onSortChange(value as FleetSort)}>
        <SelectTrigger className="sm:w-48" aria-label="Sort vehicles">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(FLEET_SORT_LABELS) as [FleetSort, string][]).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
