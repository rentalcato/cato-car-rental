"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { recordPaymentFormSchema, fieldErrors } from "@/lib/payments/schema";

const PAYMENT_RECORDERS = ["super_admin", "manager"] as const;

export interface RecordPaymentActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

/**
 * The only path that records a payment/refund outside checkout/check-in/
 * completion — calls `record_payment` (0009 migration), which keeps the
 * `payments` insert and the rental's amount_paid/balance_due update
 * atomic. Manager+ only, matching nav-config's existing gate on Payments.
 */
export async function recordPayment(
  rentalId: string,
  vehicleId: string,
  customerId: string,
  _prevState: RecordPaymentActionState,
  formData: FormData
): Promise<RecordPaymentActionState> {
  await requireRole(PAYMENT_RECORDERS);

  const parsed = recordPaymentFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const values = parsed.data;
  const signedAmount = values.is_refund ? -values.amount : values.amount;

  const supabase = await createClient();
  const { data: paymentId, error } = await supabase.rpc("record_payment", {
    p_rental_id: rentalId,
    p_amount: signedAmount,
    p_payment_method: values.payment_method ?? null,
    p_payment_reference: values.payment_reference ?? null,
    p_notes: values.notes ?? null,
  });

  if (error || !paymentId) {
    return { error: error?.message ?? "Could not record the payment." };
  }

  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/rentals");
  revalidatePath(`/dashboard/vehicles/${vehicleId}`);
  revalidatePath(`/dashboard/customers/${customerId}`);
  return { success: true };
}
