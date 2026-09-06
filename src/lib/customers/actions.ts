"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit/log";
import { customerFormSchema, fieldErrors } from "@/lib/customers/schema";
import { findPossibleDuplicates, isEmailTaken } from "@/lib/customers/queries";
import type { Customer, CustomerStatus } from "@/types/database.types";

const CUSTOMER_WRITERS = ["super_admin", "manager", "staff"] as const;
const STATUS_MANAGERS = ["super_admin", "manager"] as const;

export interface CustomerActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  duplicates?: Customer[];
  success?: boolean;
  /**
   * Echoes back whatever was submitted so the form can redisplay it after
   * a failed attempt — a Server Action round trip re-renders this form
   * from scratch, so relying on the browser to keep unsaved input would
   * silently lose it the moment one field fails validation.
   */
  values?: Record<string, string>;
}

/** FormData -> plain string map, for echoing values back on a failed submission. */
function formValues(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    Array.from(formData.entries())
      .filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

function dbErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return "A customer with this email already exists.";
  }
  return error.message;
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Shared by createCustomer/updateCustomer's "Website Account" field and
 * the standalone linkCustomerAccount() below — same lookup/link logic
 * either way. Deliberately non-fatal here: a bad or non-matching email
 * shouldn't block saving the customer's actual details, so this only
 * ever returns whether it succeeded, never an error the caller must
 * surface as a blocking failure. The standalone action still returns a
 * real error, since linking is the *only* thing that action does.
 */
async function applyAccountLink(
  supabase: SupabaseServerClient,
  customerId: string,
  rawEmail: string,
  actorId: string
): Promise<{ warning?: boolean }> {
  const email = rawEmail.trim();

  if (!email) {
    await supabase.from("customers").update({ profile_id: null }).eq("id", customerId);
    return {};
  }

  const { data: matchedProfile } = await supabase
    .from("profiles")
    .select("id, email")
    .ilike("email", email)
    .eq("role", "customer")
    .maybeSingle();

  if (!matchedProfile) return { warning: true };

  const { error } = await supabase
    .from("customers")
    .update({ profile_id: matchedProfile.id })
    .eq("id", customerId);
  if (error) return { warning: true };

  await logAudit({
    actorId,
    action: "customer_account_linked",
    entityType: "customer",
    entityId: customerId,
    metadata: { email: matchedProfile.email },
  });
  return {};
}

export async function createCustomer(
  _prevState: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const { id: userId } = await requireRole(CUSTOMER_WRITERS);

  const values = formValues(formData);
  const parsed = customerFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), values };
  }

  if (parsed.data.email && (await isEmailTaken(parsed.data.email))) {
    return {
      fieldErrors: { email: ["A customer with this email already exists."] },
      values,
    };
  }

  const confirmedDuplicate = formData.get("confirm_duplicate") === "1";
  if (!confirmedDuplicate) {
    const duplicates = await findPossibleDuplicates({
      email: parsed.data.email,
      primary_phone: parsed.data.primary_phone,
      drivers_license_number: parsed.data.drivers_license_number,
      identification_number: parsed.data.identification_number,
    });
    if (duplicates.length > 0) {
      return { duplicates, values };
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error || !data) {
    return { error: dbErrorMessage(error ?? { message: "Could not create customer." }), values };
  }

  await logAudit({
    actorId: userId,
    action: "customer_created",
    entityType: "customer",
    entityId: data.id,
    entityLabel: `${parsed.data.first_name} ${parsed.data.last_name}`,
  });

  const accountEmail = formData.get("website_account_email");
  let linkWarning = false;
  if (typeof accountEmail === "string" && accountEmail.trim()) {
    const result = await applyAccountLink(supabase, data.id, accountEmail, userId);
    linkWarning = Boolean(result.warning);
  }

  revalidatePath("/customers");
  redirect(`/customers/${data.id}${linkWarning ? "?linkWarning=1" : ""}`);
}

export async function updateCustomer(
  customerId: string,
  _prevState: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const { id: userId } = await requireRole(CUSTOMER_WRITERS);

  const values = formValues(formData);
  const parsed = customerFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), values };
  }

  if (parsed.data.email && (await isEmailTaken(parsed.data.email, customerId))) {
    return {
      fieldErrors: { email: ["Another customer already uses this email."] },
      values,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update(parsed.data)
    .eq("id", customerId);

  if (error) {
    return { error: dbErrorMessage(error), values };
  }

  await logAudit({
    actorId: userId,
    action: "customer_updated",
    entityType: "customer",
    entityId: customerId,
    entityLabel: `${parsed.data.first_name} ${parsed.data.last_name}`,
  });

  let linkWarning = false;
  const accountEmail = formData.get("website_account_email");
  if (typeof accountEmail === "string") {
    const result = await applyAccountLink(supabase, customerId, accountEmail, userId);
    linkWarning = Boolean(result.warning);
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}${linkWarning ? "?linkWarning=1" : ""}`);
}

export interface StatusActionState {
  error?: string;
}

/**
 * The only way a customer's status changes. Delegates the actual
 * manager+-only enforcement to the `set_customer_status` DB function
 * (SECURITY DEFINER) — the `requireRole` check here is a fast-fail UX
 * nicety, not the real authorization boundary.
 */
export async function setCustomerStatus(
  customerId: string,
  status: CustomerStatus,
  reason: string
): Promise<StatusActionState> {
  await requireRole(STATUS_MANAGERS);

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_customer_status", {
    p_customer_id: customerId,
    p_status: status,
    p_reason: reason || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  return {};
}

export interface LinkAccountState {
  error?: string;
  success?: boolean;
}

/**
 * Connects a customer's real rental record to the login they use for
 * public sign-up (0014 migration) — only then can that account see its
 * own booking history under RLS's customers_select_own/rentals_select_own.
 * Deliberately only matches role='customer' profiles: linking a staff
 * account to a renter record would make no sense and could look like a
 * privilege trick.
 */
export async function linkCustomerAccount(
  customerId: string,
  email: string
): Promise<LinkAccountState> {
  const { id: actorId } = await requireRole(STATUS_MANAGERS);

  const trimmedEmail = email.trim();
  if (!trimmedEmail) return { error: "Enter the account's email address." };

  const supabase = await createClient();
  const { data: matchedProfile, error: lookupError } = await supabase
    .from("profiles")
    .select("id, email")
    .ilike("email", trimmedEmail)
    .eq("role", "customer")
    .maybeSingle();

  if (lookupError) return { error: lookupError.message };
  if (!matchedProfile) {
    return { error: "No customer account found with that email." };
  }

  const { error } = await supabase
    .from("customers")
    .update({ profile_id: matchedProfile.id })
    .eq("id", customerId);

  if (error) {
    if (error.code === "23505") {
      return { error: "That account is already linked to a different customer record." };
    }
    return { error: error.message };
  }

  await logAudit({
    actorId,
    action: "customer_account_linked",
    entityType: "customer",
    entityId: customerId,
    metadata: { email: matchedProfile.email },
  });

  revalidatePath(`/customers/${customerId}`);
  return { success: true };
}

export async function unlinkCustomerAccount(customerId: string): Promise<LinkAccountState> {
  const { id: actorId } = await requireRole(STATUS_MANAGERS);

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update({ profile_id: null })
    .eq("id", customerId);

  if (error) return { error: error.message };

  await logAudit({
    actorId,
    action: "customer_account_unlinked",
    entityType: "customer",
    entityId: customerId,
  });

  revalidatePath(`/customers/${customerId}`);
  return { success: true };
}
