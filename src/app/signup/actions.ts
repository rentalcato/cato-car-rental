"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface SignupState {
  error?: string;
  success?: boolean;
  /**
   * Echoes back the non-sensitive fields so the form can redisplay them
   * after a failed attempt — Next.js re-rendering this form via the
   * server action's returned state doesn't guarantee the browser keeps
   * whatever was already typed, so relying on that would silently lose
   * it. Passwords are deliberately never echoed back.
   */
  values?: { full_name: string; email: string };
}

/**
 * Real self-service sign-up against the same Supabase Auth used
 * everywhere else in the app — not a second auth system. New accounts
 * default to the 'customer' role (0012 migration's handle_new_user()),
 * which has no dashboard access at all, so there's nowhere useful to
 * redirect into afterward; a success message replaces the form instead.
 *
 * Uses the service-role admin API (createUser with email_confirm: true)
 * instead of the regular anon signUp() call, so every new account is
 * created already confirmed — independent of the Supabase project's
 * "Confirm email" setting and its rate-limited default email sender,
 * neither of which a customer signing up should ever be blocked on.
 */
export async function signUp(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");
  const values = { full_name: fullName, email };

  if (!fullName || !email || !password) {
    return { error: "Fill in your name, email and password.", values };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", values };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match.", values };
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error) {
    if (error.code === "email_exists" || error.code === "user_already_exists") {
      return { error: "An account with that email already exists — try signing in instead.", values };
    }
    return { error: error.message, values };
  }

  return { success: true };
}
