"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit/log";
import { DOCUMENT_BUCKET } from "@/lib/customers/documents";
import { ALLOWED_DOCUMENT_MIME_TYPES, DOCUMENT_TYPES, MAX_DOCUMENT_SIZE_BYTES } from "@/lib/constants";
import type { DocumentType } from "@/types/database.types";

const DOCUMENT_MANAGERS = ["super_admin", "manager"] as const;
const DOCUMENT_UPLOADERS = ["super_admin", "manager", "staff"] as const;

export interface DocumentActionState {
  error?: string;
  success?: boolean;
}

function isDocumentType(value: unknown): value is DocumentType {
  return typeof value === "string" && (DOCUMENT_TYPES as readonly string[]).includes(value);
}

export async function uploadCustomerDocument(
  customerId: string,
  _prevState: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const { id: userId } = await requireRole(DOCUMENT_UPLOADERS);

  const documentType = formData.get("document_type");
  if (!isDocumentType(documentType)) {
    return { error: "Select a document type." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return { error: "File is too large — the limit is 10MB." };
  }
  if (!(ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { error: "Only JPG, PNG and PDF files are allowed." };
  }

  const expiryRaw = formData.get("expiry_date");
  const expiryDate = typeof expiryRaw === "string" && expiryRaw ? expiryRaw : null;
  const notesRaw = formData.get("notes");
  const notes = typeof notesRaw === "string" && notesRaw.trim() ? notesRaw.trim() : null;

  const supabase = await createClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${customerId}/${documentType}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
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
    return { error: insertError?.message ?? "Could not save the document record." };
  }

  await logAudit({
    actorId: userId,
    action: "document_uploaded",
    entityType: "customer",
    entityId: customerId,
    metadata: { document_id: data.id, document_type: documentType, file_name: file.name },
  });

  revalidatePath(`/dashboard/customers/${customerId}`);
  return { success: true };
}

export interface DocumentMutationResult {
  error?: string;
}

/**
 * Looks up the document scoped to (customerId, documentId) itself rather
 * than trusting a client-supplied storage path — a Server Action is just
 * a POST endpoint, not bound to the DOM it was rendered from, so a caller
 * could otherwise pass a documentId/path pair belonging to a different
 * customer and delete/access that instead.
 */
async function getOwnedDocument(customerId: string, documentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customer_documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("customer_id", customerId)
    .maybeSingle();
  return data;
}

export async function deleteCustomerDocument(
  customerId: string,
  documentId: string
): Promise<DocumentMutationResult> {
  const { id: userId } = await requireRole(DOCUMENT_MANAGERS);

  const doc = await getOwnedDocument(customerId, documentId);
  if (!doc) return { error: "Document not found." };

  const supabase = await createClient();
  const { error: storageError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .remove([doc.storage_path]);
  if (storageError) return { error: storageError.message };

  const { error } = await supabase
    .from("customer_documents")
    .delete()
    .eq("id", documentId)
    .eq("customer_id", customerId);
  if (error) return { error: error.message };

  await logAudit({
    actorId: userId,
    action: "document_deleted",
    entityType: "customer",
    entityId: customerId,
    metadata: { document_id: documentId },
  });

  revalidatePath(`/dashboard/customers/${customerId}`);
  return {};
}

export interface SignedUrlResult {
  url?: string;
  error?: string;
}

/**
 * Generates a short-lived signed URL for viewing/downloading a private
 * document, and audit-logs the access in the same call — a document is
 * never reachable through a stable/predictable public URL.
 */
export async function getDocumentAccessUrl(
  customerId: string,
  documentId: string
): Promise<SignedUrlResult> {
  const { id: userId } = await requireRole(DOCUMENT_UPLOADERS);

  const doc = await getOwnedDocument(customerId, documentId);
  if (!doc) return { error: "Document not found." };

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(doc.storage_path, 60);

  if (error || !data) {
    return { error: error?.message ?? "Could not generate a link to this document." };
  }

  await logAudit({
    actorId: userId,
    action: "document_accessed",
    entityType: "customer",
    entityId: customerId,
    metadata: { document_id: documentId },
  });

  return { url: data.signedUrl };
}
