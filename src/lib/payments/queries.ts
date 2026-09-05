import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Customer, Payment, PaymentMethod, Rental } from "@/types/database.types";

export interface PaymentListFilters {
  search?: string;
  method?: PaymentMethod | "all";
  refundsOnly?: boolean;
}

export interface PaymentListRow extends Payment {
  customer: Pick<Customer, "id" | "customer_number" | "first_name" | "last_name"> | null;
  rental: Pick<Rental, "rental_number"> | null;
}

export async function listPayments(filters: PaymentListFilters): Promise<PaymentListRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("payments")
    .select(
      "*, customer:customers(id, customer_number, first_name, last_name), rental:rentals(rental_number)"
    );

  if (filters.method && filters.method !== "all") {
    query = query.eq("payment_method", filters.method);
  }

  if (filters.refundsOnly) {
    query = query.lt("payment_amount", 0);
  }

  if (filters.search?.trim()) {
    const term = filters.search.trim().replace(/[%,]/g, "");
    query = query.ilike("payment_reference", `%${term}%`);
  }

  const { data, error } = await query.order("payment_date", { ascending: false }).limit(200);
  if (error) throw error;
  return data as unknown as PaymentListRow[];
}
