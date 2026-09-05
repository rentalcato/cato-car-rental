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
import { CUSTOMER_STATUSES } from "@/lib/constants";
import { CUSTOMER_STATUS_CONFIG } from "@/components/customers/customer-status-badge";

export function CustomerFilters({
  defaultSearch,
  defaultStatus,
  defaultShowInactive,
}: {
  defaultSearch: string;
  defaultStatus: string;
  defaultShowInactive: boolean;
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
          placeholder="Search by name, ID, phone, email or license…"
          className="pl-8"
          aria-label="Search customers"
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
          {CUSTOMER_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {CUSTOMER_STATUS_CONFIG[status].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <label className="flex items-center gap-2 text-sm whitespace-nowrap text-muted-foreground">
        <input
          type="checkbox"
          className="size-4 rounded border-input"
          checked={defaultShowInactive}
          onChange={(event) => updateParams({ inactive: event.target.checked ? "1" : null })}
        />
        Show inactive
      </label>
    </div>
  );
}
