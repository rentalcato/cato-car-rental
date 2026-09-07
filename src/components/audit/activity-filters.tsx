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
import { AUDIT_ACTIONS, AUDIT_ACTION_LABELS, AUDIT_ENTITY_TYPES, AUDIT_ENTITY_TYPE_LABELS } from "@/lib/audit/log";

export function ActivityFilters({
  defaultSearch,
  defaultAction,
  defaultEntityType,
}: {
  defaultSearch: string;
  defaultAction: string;
  defaultEntityType: string;
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
          placeholder="Search by user, target or reason…"
          className="pl-8"
          aria-label="Search activity"
        />
      </form>

      <Select
        value={defaultEntityType}
        onValueChange={(value) => updateParams({ type: value === "all" ? null : value })}
      >
        <SelectTrigger className="w-full sm:w-52">
          <SelectValue placeholder="All areas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All areas</SelectItem>
          {AUDIT_ENTITY_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              {AUDIT_ENTITY_TYPE_LABELS[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={defaultAction}
        onValueChange={(value) => updateParams({ action: value === "all" ? null : value })}
      >
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue placeholder="All actions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All actions</SelectItem>
          {AUDIT_ACTIONS.map((action) => (
            <SelectItem key={action} value={action}>
              {AUDIT_ACTION_LABELS[action]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
