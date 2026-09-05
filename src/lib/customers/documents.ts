import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CustomerDocument } from "@/types/database.types";

export const DOCUMENT_BUCKET = "customer-documents";

export async function getCustomerDocuments(customerId: string): Promise<CustomerDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_documents")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CustomerDocument[];
}
