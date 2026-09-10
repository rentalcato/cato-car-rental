"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export interface CheckinActionState {
  error?: string;
  success?: boolean;
}

/**
 * One form covers the whole digital check-in step — each checkbox is
 * "yes, this is still accurate" rather than new data entry, so there's
 * nothing here beyond what save_rental_checkin() (0022) already has on
 * file for this customer. Re-submittable any time before pickup: ticking
 * a box back off before confirming just un-completes the check-in.
 */
export async function saveCheckin(
  rentalId: string,
  _prevState: CheckinActionState,
  formData: FormData
): Promise<CheckinActionState> {
  await requireUser();

  const supabase = await createClient();
  const notesRaw = formData.get("additional_notes");
  const { error } = await supabase.rpc("save_rental_checkin", {
    p_rental_id: rentalId,
    p_license_confirmed: formData.get("license_confirmed") === "on",
    p_address_confirmed: formData.get("address_confirmed") === "on",
    p_emergency_contact_confirmed: formData.get("emergency_contact_confirmed") === "on",
    p_agreement_accepted: formData.get("agreement_accepted") === "on",
    p_additional_notes: typeof notesRaw === "string" && notesRaw.trim() ? notesRaw.trim() : null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/account/rentals/${rentalId}`);
  return { success: true };
}
