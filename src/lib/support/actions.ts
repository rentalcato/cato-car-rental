"use server";

import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, supportMessageFormSchema } from "@/lib/support/schema";

export interface SupportActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

/**
 * Durable capture only — support_messages_select_own (0022) lets the
 * customer see their own submissions, but there's no staff inbox UI yet
 * (see the migration's comment on that table). Contacting the business
 * directly (WhatsApp/call/email on the same page) still works regardless
 * of whether this submits successfully.
 */
export async function submitSupportMessage(
  _prevState: SupportActionState,
  formData: FormData
): Promise<SupportActionState> {
  const { id: userId } = await requireUser();

  const parsed = supportMessageFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  const { error } = await supabase.from("support_messages").insert({
    customer_id: customer?.id ?? null,
    profile_id: userId,
    name: parsed.data.name,
    email: parsed.data.email ?? null,
    phone: parsed.data.phone ?? null,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  if (error) return { error: error.message };
  return { success: true };
}
