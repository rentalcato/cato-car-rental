"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error?: string;
}

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Surface this specific case rather than masking it as bad credentials
    // — it means the password is right but Supabase is still waiting on
    // email confirmation (see README's "Confirm email" note).
    if (error.code === "email_not_confirmed") {
      return {
        error:
          "This account's email hasn't been confirmed yet. Check your inbox (and spam folder), or ask an admin to confirm it for you.",
      };
    }
    return { error: "Invalid email or password." };
  }

  redirect(next.startsWith("/") ? next : "/dashboard");
}
