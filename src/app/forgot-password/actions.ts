"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface ForgotPasswordState {
  error?: string;
  success?: boolean;
}

/**
 * Always reports success, whether or not the email matches a real
 * account — standard practice, avoids letting this form be used to
 * check which addresses are registered. The actual email only sends for
 * a real match; Supabase Auth handles that silently on its end.
 */
export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Enter your email address." };
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const origin = process.env.NEXT_PUBLIC_SITE_URL || (host ? `${protocol}://${host}` : "https://cato-car-rental.vercel.app");

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    // Logged for operators, never surfaced — see the no-enumeration note above.
    console.error("resetPasswordForEmail failed", error.message);
  }

  return { success: true };
}
