import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database.types";
import { canAccess, type Role } from "@/lib/auth/roles";

export interface CurrentUser {
  id: string;
  email: string | undefined;
  profile: Profile;
}

/**
 * Data Access Layer entry point — the one place that decides who's signed
 * in. `cache()` memoizes this per request so every layout/page/component
 * that calls it during one render only hits Supabase once. This is the
 * *secure* check (validates against the Supabase Auth server via
 * `getUser()`); `src/proxy.ts` only does a cheap optimistic redirect.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return { id: user.id, email: user.email, profile: profile as Profile };
});

/** Use in any Server Component/Action/Route Handler that requires a signed-in user. */
export async function requireUser(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  return current;
}

/** Use where a route is limited to specific roles (e.g. Settings -> super_admin only). */
export async function requireRole(allowed: readonly Role[]): Promise<CurrentUser> {
  const current = await requireUser();
  if (!canAccess(current.profile.role, allowed)) redirect("/unauthorized");
  return current;
}
