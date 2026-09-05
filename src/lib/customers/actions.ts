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
}

function dbErrorMessage(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return "A customer with this email already exists.";
  }
  return error.message;
}

export async function createCustomer(
  _prevState: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const { id: userId } = await requireRole(CUSTOMER_WRITERS);

  const parsed = customerFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  if (parsed.data.email && (await isEmailTaken(parsed.data.email))) {
    return {
      fieldErrors: { email: ["A customer with this email already exists."] },
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
      return { duplicates };
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error || !data) {
    return { error: dbErrorMessage(error ?? { message: "Could not create customer." }) };
  }

  await logAudit({
    actorId: userId,
    action: "customer_created",
    entityType: "customer",
    entityId: data.id,
    entityLabel: `${parsed.data.first_name} ${parsed.data.last_name}`,
  });

  revalidatePath("/customers");
  redirect(`/customers/${data.id}`);
}

export async function updateCustomer(
  customerId: string,
  _prevState: CustomerActionState,
  formData: FormData
): Promise<CustomerActionState> {
  const { id: userId } = await requireRole(CUSTOMER_WRITERS);

  const parsed = customerFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  if (parsed.data.email && (await isEmailTaken(parsed.data.email, customerId))) {
    return {
      fieldErrors: { email: ["Another customer already uses this email."] },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("customers")
    .update(parsed.data)
    .eq("id", customerId);

  if (error) {
    return { error: dbErrorMessage(error) };
  }

  await logAudit({
    actorId: userId,
    action: "customer_updated",
    entityType: "customer",
    entityId: customerId,
    entityLabel: `${parsed.data.first_name} ${parsed.data.last_name}`,
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}`);
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
