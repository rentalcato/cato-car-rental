import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// "/" only ever matches its exact-path branch below (the sub-path check
// becomes pathname.startsWith("//"), which no real path ever satisfies) —
// it marks the public landing page itself as public, not everything.
const PUBLIC_PATHS = ["/", "/login", "/signup", "/unauthorized", "/auth/callback"];

/**
 * Called from src/proxy.ts on every request. Refreshes the Supabase auth
 * cookie (so server components always see a valid/expired-and-renewed
 * session) and does an *optimistic* redirect for unauthenticated visitors
 * to protected routes. This is a fast, cookie-only check — the real,
 * secure authorization check happens per-request in
 * `src/lib/auth/dal.ts` (getCurrentUser), close to the data. See the
 * Next.js authentication guide's "Optimistic vs Secure checks".
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() re-validates against Supabase Auth rather than just trusting
  // the JWT in the cookie — required reading before touching any route.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  // Exact match or a "/" boundary — plain startsWith would also treat a
  // future route like "/login-history" as public.
  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // Redirects must carry forward any cookies `setAll` just wrote onto
  // `response` (a refreshed session). A bare `NextResponse.redirect(...)`
  // is a brand-new response with none of those Set-Cookie headers —
  // dropping a refreshed/rotated session cookie here is exactly what
  // causes an infinite redirect loop between /login and a protected route.
  function redirectCarryingCookies(url: URL) {
    const redirectResponse = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return redirectCarryingCookies(loginUrl);
  }

  if (user && pathname === "/login") {
    return redirectCarryingCookies(new URL("/dashboard", request.url));
  }

  return response;
}
