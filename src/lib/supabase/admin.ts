import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Service-role client — bypasses RLS entirely. NEVER import this into
 * client code (the "server-only" import above makes that a build error),
 * and never use it for anything an authenticated user's own session
 * should be doing instead. Its one current use: creating a self-signup
 * account (src/app/signup/actions.ts) already confirmed, so new accounts
 * don't depend on Supabase's project-level "Confirm email" setting or on
 * its rate-limited default email sender actually delivering.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — required for admin-level Supabase Auth operations."
    );
  }

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
