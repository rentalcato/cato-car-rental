"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import { searchCustomersAction } from "@/lib/customers/search-action";
import type { Customer } from "@/types/database.types";

/**
 * Name / phone / email / license / ID / customer-number search used to
 * pick an existing customer before creating a rental. Debounced client-
 * side call into `searchCustomersAction` — no dedicated API route exists
 * in this app, server actions fill that role everywhere else too.
 */
export function CustomerSearchCombobox({ onSelect }: { onSelect: (customer: Customer) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!query.trim()) return;
    const timeout = setTimeout(() => {
      startTransition(async () => {
        const found = await searchCustomersAction(query);
        setResults(found);
        setOpen(true);
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  function handleChange(value: string) {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search by name, customer ID, phone, email or license…"
          className="pl-8"
          aria-label="Search customers"
        />
      </div>

      {open ? (
        <Card className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto p-1">
          {isPending ? (
            <p className="p-3 text-sm text-muted-foreground">Searching…</p>
          ) : results.length === 0 ? (
            <div className="space-y-2 p-3">
              <p className="text-sm text-muted-foreground">No matching customers.</p>
              <Link
                href="/customers/new"
                target="_blank"
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <UserPlus className="size-3.5" />
                Create a new customer profile
              </Link>
            </div>
          ) : (
            <ul>
              {results.map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(customer);
                      setQuery(`${customer.first_name} ${customer.last_name}`);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {customer.first_name} {customer.last_name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {customer.customer_number} · {customer.primary_phone || customer.email || "—"}
                      </span>
                    </span>
                    <CustomerStatusBadge status={customer.status} className="shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}
    </div>
  );
}
