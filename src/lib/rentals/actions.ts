"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { canAccess } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { checkoutFormSchema, completeRentalFormSchema, fieldErrors } from "@/lib/rentals/schema";

const RENTAL_CREATORS = ["super_admin", "manager", "staff"] as const;

export interface CheckoutActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * The one path that creates a rental: calls the `checkout_rental` SECURITY
 * DEFINER function (0006 migration), which re-validates vehicle
 * availability, enforces the blacklist-override rule, computes totals,
 * records an initial payment if one was collected, flips the vehicle to
 * Rented, and writes its own audit log entry — all atomically. Direct
 * writes to `rentals`/`payments` stay manager+-only; this RPC is the only
 * way staff can check a customer out.
 */
export async function checkoutRental(
  _prevState: CheckoutActionState,
  formData: FormData
): Promise<CheckoutActionState> {
  const { profile } = await requireRole(RENTAL_CREATORS);

  const parsed = checkoutFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const values = parsed.data;

  if (values.override_blacklist && !canAccess(profile.role, ["super_admin", "manager"])) {
    return { error: "Only a manager or super admin can override a blacklisted customer." };
  }

  const supabase = await createClient();
  const { data: rentalId, error } = await supabase.rpc("checkout_rental", {
    p_customer_id: values.customer_id,
    p_vehicle_id: values.vehicle_id,
    p_rental_start: values.rental_start.toISOString(),
    p_duration_days: values.duration_days,
    p_deposit_amount: values.deposit_amount ?? 0,
    p_payment_amount: values.payment_amount ?? 0,
    p_payment_method: values.payment_method ?? null,
    p_payment_reference: values.payment_reference ?? null,
    p_notes: values.notes ?? null,
    p_override_blacklist: values.override_blacklist,
  });

  if (error || !rentalId) {
    return { error: error?.message ?? "Could not create the rental." };
  }

  revalidatePath("/rentals");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${values.vehicle_id}`);
  revalidatePath(`/customers/${values.customer_id}`);
  redirect(`/customers/${values.customer_id}`);
}

export interface CompleteRentalActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

/**
 * The other half of checkout: records an actual return, settles late
 * fees/additional charges/a final payment, and frees the vehicle back to
 * Available — via the `complete_rental` SECURITY DEFINER function (0008
 * migration). Same staff+ model as `checkoutRental`.
 */
export async function completeRental(
  rentalId: string,
  vehicleId: string,
  customerId: string,
  _prevState: CompleteRentalActionState,
  formData: FormData
): Promise<CompleteRentalActionState> {
  await requireRole(RENTAL_CREATORS);

  const parsed = completeRentalFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const values = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_rental", {
    p_rental_id: rentalId,
    p_actual_return: values.actual_return.toISOString(),
    p_return_mileage: values.return_mileage ?? null,
    p_return_fuel_level: values.return_fuel_level ?? null,
    p_late_fee: values.late_fee ?? null,
    p_additional_charges: values.additional_charges ?? null,
    p_payment_amount: values.payment_amount ?? 0,
    p_payment_method: values.payment_method ?? null,
    p_payment_reference: values.payment_reference ?? null,
    p_notes: values.notes ?? null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/rentals");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath(`/customers/${customerId}`);
  return { success: true };
}
