import "server-only";

import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit/log";
import { ALLOWED_DOCUMENT_MIME_TYPES, MAX_DOCUMENT_SIZE_BYTES } from "@/lib/constants";
import type { CustomerDocument, DocumentType } from "@/types/database.types";

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

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Shared upload core behind both the standalone Documents panel
 * (src/lib/customers/document-actions.ts) and the inline slots on the
 * Add/Edit Customer form (src/lib/customers/actions.ts) — same
 * validate -> storage upload -> row insert -> audit sequence either way,
 * so a document attached from either spot behaves and shows up
 * identically (it just lands in the same customer_documents table).
 */
export async function saveCustomerDocument(
  supabase: SupabaseServerClient,
  userId: string,
  params: {
    customerId: string;
    documentType: DocumentType;
    file: File;
    expiryDate?: string | null;
    notes?: string | null;
  }
): Promise<{ error?: string; id?: string }> {
  const { customerId, documentType, file, expiryDate = null, notes = null } = params;

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return { error: `${file.name}: file is too large — the limit is 10MB.` };
  }
  if (!(ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { error: `${file.name}: only JPG, PNG and PDF files are allowed.` };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${customerId}/${documentType}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, file, { contentType: file.type });
  if (uploadError) {
    return { error: `${file.name}: upload failed — ${uploadError.message}` };
  }

  const { data, error: insertError } = await supabase
    .from("customer_documents")
    .insert({
      customer_id: customerId,
      document_type: documentType,
      file_name: file.name,
      storage_path: path,
      uploaded_by: userId,
      expiry_date: expiryDate,
      notes,
    })
    .select("id")
    .single();

  if (insertError || !data) {
    await supabase.storage.from(DOCUMENT_BUCKET).remove([path]);
    return { error: `${file.name}: ${insertError?.message ?? "could not save the document record."}` };
  }

  await logAudit({
    actorId: userId,
    action: "document_uploaded",
    entityType: "customer",
    entityId: customerId,
    metadata: { document_id: data.id, document_type: documentType, file_name: file.name },
  });

  return { id: data.id };
}
