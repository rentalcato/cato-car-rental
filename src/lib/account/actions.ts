"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit/log";
import { DOCUMENT_BUCKET } from "@/lib/customers/documents";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  CUSTOMER_UPLOADABLE_DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/constants";
import {
  bookingFormSchema,
  communicationPrefsFormSchema,
  contactFormSchema,
  fieldErrors,
  passwordFormSchema,
  profileFormSchema,
} from "@/lib/account/schema";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/** Shared by every self-service action that needs the caller's own linked customer id. */
async function getOwnCustomerId(
  supabase: ServerSupabaseClient,
  userId: string
): Promise<{ customerId?: string; error?: string }> {
  const { data, error } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) {
    return { error: "Your account isn't connected to a customer record yet — contact us to get set up first." };
  }
  return { customerId: data.id };
}

export interface BookingActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Self-service booking — see create_reservation() (0007, tightened in
 * 0015 to only let a non-staff caller book their own linked customer
 * record). The UI never offers this to an unlinked account, but the
 * lookup below is the real check: it fails closed if someone reaches
 * this action without one.
 */
export async function requestReservation(
  vehicleId: string,
  _prevState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const { id: userId } = await requireUser();

  const parsed = bookingFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { customerId, error: lookupError } = await getOwnCustomerId(supabase, userId);
  if (lookupError || !customerId) return { error: lookupError };

  const { error } = await supabase.rpc("create_reservation", {
    p_customer_id: customerId,
    p_vehicle_id: vehicleId,
    p_rental_start: parsed.data.rental_start.toISOString(),
    p_duration_days: parsed.data.duration_days,
    p_deposit_amount: 0,
    p_notes: parsed.data.notes ?? null,
    p_override_blacklist: false,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/account");
  revalidatePath(`/account/fleet/${vehicleId}`);
  // ?booked=1 drives the one-time confirmation banner on the dashboard
  // (src/app/account/page.tsx) — the actual persistent record of this
  // booking is the notification the rentals_notify_status_change
  // trigger (0022) already wrote, and the new trip card itself.
  redirect("/account?booked=1");
}

export interface CancelActionState {
  error?: string;
}

export async function cancelMyReservation(rentalId: string): Promise<CancelActionState> {
  await requireUser();

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_reservation", {
    p_rental_id: rentalId,
    p_reason: "Cancelled by customer",
  });

  if (error) return { error: error.message };

  revalidatePath("/account");
  return {};
}

export interface ProfileActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

/** update_my_profile() (0018) only ever writes full_name — nothing else on the row is reachable this way. */
export async function updateMyProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  await requireUser();

  const parsed = profileFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_my_profile", {
    p_full_name: parsed.data.full_name,
  });

  if (error) return { error: error.message };

  revalidatePath("/account");
  return { success: true };
}

/**
 * update_my_contact_info() (0018) only ever writes the six contact
 * columns named there — never license/ID/status/notes. Fails closed
 * with a clear message if the account isn't linked yet, matching
 * requestReservation()'s pattern.
 */
export async function updateMyContactInfo(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  await requireUser();

  const parsed = contactFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_my_contact_info", {
    p_primary_phone: parsed.data.primary_phone ?? null,
    p_secondary_phone: parsed.data.secondary_phone ?? null,
    p_address: parsed.data.address ?? null,
    p_city_parish: parsed.data.city_parish ?? null,
    p_emergency_contact_name: parsed.data.emergency_contact_name ?? null,
    p_emergency_contact_phone: parsed.data.emergency_contact_phone ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/account");
  return { success: true };
}

/**
 * One Save button in the Edit Details dialog updates both the name
 * (always) and contact fields (only if the form actually included
 * them — it won't for an unlinked account, since that section isn't
 * rendered at all). Delegates to the two RPCs above rather than
 * duplicating their logic.
 */
export async function updateMyDetails(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const profileResult = await updateMyProfile({}, formData);
  if (profileResult.error || profileResult.fieldErrors) return profileResult;

  if (formData.has("primary_phone")) {
    const contactResult = await updateMyContactInfo({}, formData);
    if (contactResult.error || contactResult.fieldErrors) return contactResult;
  }

  return { success: true };
}

export interface DocumentActionState {
  error?: string;
  success?: boolean;
}

function isCustomerUploadableDocumentType(
  value: unknown
): value is (typeof CUSTOMER_UPLOADABLE_DOCUMENT_TYPES)[number] {
  return (
    typeof value === "string" &&
    (CUSTOMER_UPLOADABLE_DOCUMENT_TYPES as readonly string[]).includes(value)
  );
}

/**
 * Self-service document upload — same storage path convention
 * ("<customer_id>/<document_type>/<file>") and validation as the
 * staff-side uploadCustomerDocument(), scoped to the caller's own
 * linked customer record via customer_documents_insert_own and
 * customer_documents_storage_insert_own (0019). Deleting a submitted
 * document stays staff-only — this action has no delete counterpart.
 */
export async function uploadMyDocument(
  _prevState: DocumentActionState,
  formData: FormData
): Promise<DocumentActionState> {
  const { id: userId } = await requireUser();

  const documentType = formData.get("document_type");
  if (!isCustomerUploadableDocumentType(documentType)) {
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

  const supabase = await createClient();
  const { customerId, error: lookupError } = await getOwnCustomerId(supabase, userId);
  if (lookupError || !customerId) return { error: lookupError };

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
      notes: null,
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
    metadata: { document_id: data.id, document_type: documentType, file_name: file.name, self_service: true },
  });

  revalidatePath("/account");
  return { success: true };
}

/** Supabase updates the current session's password directly — no separate "current password" check, matching supabase-js's own updateUser() contract for an already-authenticated session. */
export async function updateMyPassword(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  await requireUser();

  const parsed = passwordFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  return { success: true };
}

/** update_my_communication_prefs() (0022) — the only two columns this can ever touch. */
export async function updateMyCommunicationPrefs(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  await requireUser();

  const parsed = communicationPrefsFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_my_communication_prefs", {
    p_email_notifications_enabled: parsed.data.email_notifications_enabled,
    p_sms_notifications_enabled: parsed.data.sms_notifications_enabled,
  });

  if (error) return { error: error.message };

  revalidatePath("/account/profile");
  return { success: true };
}

export interface SignedUrlResult {
  url?: string;
  error?: string;
}

/**
 * Short-lived signed URL for viewing a document the customer uploaded
 * themselves — looked up scoped to their own linked customer_id, not
 * trusted from the client, matching getDocumentAccessUrl()'s pattern.
 */
export async function getMyDocumentAccessUrl(documentId: string): Promise<SignedUrlResult> {
  const { id: userId } = await requireUser();

  const supabase = await createClient();
  const { customerId, error: lookupError } = await getOwnCustomerId(supabase, userId);
  if (lookupError || !customerId) return { error: lookupError };

  const { data: doc } = await supabase
    .from("customer_documents")
    .select("storage_path")
    .eq("id", documentId)
    .eq("customer_id", customerId)
    .maybeSingle();
  if (!doc) return { error: "Document not found." };

  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(doc.storage_path, 60);

  if (error || !data) {
    return { error: error?.message ?? "Could not generate a link to this document." };
  }

  return { url: data.signedUrl };
}
