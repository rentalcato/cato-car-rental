import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Supabase client for Server Components, Server Actions and Route
 * Handlers. `cookies()` is async in Next.js 15+.
 *
 * Setting cookies is not possible during Server Component rendering
 * (Next.js will throw) — that's fine here because `src/proxy.ts` refreshes
 * the session cookie on every request, so Server Components only ever need
 * to *read* it. The try/catch keeps that a no-op instead of a crash.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore, see above.
          }
        },
      },
    }
  );
}
