"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { bookingFormSchema, fieldErrors } from "@/lib/account/schema";

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
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (customerError) return { error: customerError.message };
  if (!customer) {
    return {
      error: "Your account isn't connected to a customer record yet — contact us to get set up first.",
    };
  }

  const { error } = await supabase.rpc("create_reservation", {
    p_customer_id: customer.id,
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
  redirect("/account");
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
