"use server";

import { createClient } from "@/lib/supabase/server";

export interface SignupState {
  error?: string;
  success?: boolean;
}

/**
 * Real self-service sign-up against the same Supabase Auth used
 * everywhere else in the app — not a second auth system. New accounts
 * default to the 'customer' role (0012 migration's handle_new_user()),
 * which has no dashboard access at all, so there's nowhere useful to
 * redirect into afterward; a success message replaces the form instead
 * (works the same whether or not the project requires email
 * confirmation before a session exists).
 */
export async function signUp(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!fullName || !email || !password) {
    return { error: "Fill in your name, email and password." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
