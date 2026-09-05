"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { canAccess } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { checkInFormSchema, reservationFormSchema, fieldErrors } from "@/lib/reservations/schema";

const RESERVATION_CREATORS = ["super_admin", "manager", "staff"] as const;

export interface ReservationActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/** Books a vehicle for a future pickup — see create_reservation() (0007 migration). */
export async function createReservation(
  _prevState: ReservationActionState,
  formData: FormData
): Promise<ReservationActionState> {
  const { profile } = await requireRole(RESERVATION_CREATORS);

  const parsed = reservationFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error) };
  }

  const values = parsed.data;
  if (values.override_blacklist && !canAccess(profile.role, ["super_admin", "manager"])) {
    return { error: "Only a manager or super admin can override a blacklisted customer." };
  }

  const supabase = await createClient();
  const { data: rentalId, error } = await supabase.rpc("create_reservation", {
    p_customer_id: values.customer_id,
    p_vehicle_id: values.vehicle_id,
    p_rental_start: values.rental_start.toISOString(),
    p_duration_days: values.duration_days,
    p_deposit_amount: values.deposit_amount ?? 0,
    p_notes: values.notes ?? null,
    p_override_blacklist: values.override_blacklist,
  });

  if (error || !rentalId) {
    return { error: error?.message ?? "Could not create the reservation." };
  }

  revalidatePath("/reservations");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${values.vehicle_id}`);
  revalidatePath(`/customers/${values.customer_id}`);
  redirect(`/customers/${values.customer_id}`);
}

export interface ReservationRpcResult {
  error?: string;
}

/** "Check in": converts a reservation into an active rental in place. */
export async function checkInReservation(
  rentalId: string,
  vehicleId: string,
  customerId: string,
  formData: FormData
): Promise<ReservationRpcResult> {
  const { profile } = await requireRole(RESERVATION_CREATORS);

  const parsed = checkInFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: Object.values(fieldErrors(parsed.error))[0]?.[0] ?? "Invalid input." };
  }

  const values = parsed.data;
  if (values.override_blacklist && !canAccess(profile.role, ["super_admin", "manager"])) {
    return { error: "Only a manager or super admin can override a blacklisted customer." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("activate_reservation", {
    p_rental_id: rentalId,
    p_payment_amount: values.payment_amount ?? 0,
    p_payment_method: values.payment_method ?? null,
    p_payment_reference: values.payment_reference ?? null,
    p_override_blacklist: values.override_blacklist,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/reservations");
  revalidatePath("/rentals");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath(`/customers/${customerId}`);
  return {};
}

export async function cancelReservation(
  rentalId: string,
  vehicleId: string,
  customerId: string,
  reason: string
): Promise<ReservationRpcResult> {
  await requireRole(RESERVATION_CREATORS);

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_reservation", {
    p_rental_id: rentalId,
    p_reason: reason || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/reservations");
  revalidatePath("/vehicles");
  revalidatePath(`/vehicles/${vehicleId}`);
  revalidatePath(`/customers/${customerId}`);
  return {};
}
