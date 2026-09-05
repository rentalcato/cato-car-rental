"use server";

import { requireRole } from "@/lib/auth/dal";
import { listCustomers } from "@/lib/customers/queries";
import type { Customer } from "@/types/database.types";

const SEARCHERS = ["super_admin", "manager", "staff"] as const;

/** Live-search action backing `CustomerSearchCombobox` (rental checkout). */
export async function searchCustomersAction(query: string): Promise<Customer[]> {
  await requireRole(SEARCHERS);
  if (!query.trim()) return [];
  const results = await listCustomers({ search: query, status: "all", showInactive: false });
  return results.slice(0, 8);
}
