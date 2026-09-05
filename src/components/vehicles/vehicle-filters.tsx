"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VEHICLE_STATUSES } from "@/lib/constants";
import { VEHICLE_STATUS_CONFIG } from "@/components/vehicles/status-badge";

export function VehicleFilters({
  defaultSearch,
  defaultStatus,
  defaultShowArchived,
}: {
  defaultSearch: string;
  defaultStatus: string;
  defaultShowArchived: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(defaultSearch);
  const [, startTransition] = useTransition();

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    startTransition(() => {
      router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname);
    });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        className="relative flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          updateParams({ search: search || null });
        }}
      >
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by plate, make or model…"
          className="pl-8"
          aria-label="Search vehicles"
        />
      </form>

      <Select
        value={defaultStatus}
        onValueChange={(value) => updateParams({ status: value === "all" ? null : value })}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {VEHICLE_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {VEHICLE_STATUS_CONFIG[status].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="flex items-center gap-2 text-sm whitespace-nowrap text-muted-foreground">
        <input
          type="checkbox"
          className="size-4 rounded border-input"
          checked={defaultShowArchived}
          onChange={(event) => updateParams({ archived: event.target.checked ? "1" : null })}
        />
        Show archived
      </label>
    </div>
  );
}
