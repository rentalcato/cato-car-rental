"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { bookingFormSchema, contactFormSchema, fieldErrors, profileFormSchema } from "@/lib/account/schema";

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
