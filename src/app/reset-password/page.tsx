import Link from "next/link";
import { Car, TriangleAlert } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getCurrentUser } from "@/lib/auth/dal";
import { getPublicBusinessInfo, getPublicBusinessLogoUrl } from "@/lib/marketing/queries";

// Reached only with a valid recovery session (see /auth/callback and
// forgot-password/actions.ts's redirectTo) — proxy.ts leaves this route
// out of PUBLIC_PATHS on purpose, so an unauthenticated visit already
// bounces to /login before this ever renders. The "link expired" state
// below covers the case where that recovery session itself has expired.
export default async function ResetPasswordPage() {
  const current = await getCurrentUser();
  const business = await getPublicBusinessInfo();
  const businessName = business?.business_name || "Fleet Manager";
  const logoUrl = await getPublicBusinessLogoUrl(business?.logo_storage_path ?? null);
  const continueHref = current?.profile.role === "customer" ? "/account" : "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <Link href="/" className="mx-auto mb-2 flex items-center gap-2 text-lg font-semibold">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={businessName} className="h-9 w-auto shrink-0 object-contain" />
            ) : (
              <>
                <Car className="size-6" />
                {businessName}
              </>
            )}
          </Link>
          <CardTitle className="text-xl">
            {current ? "Choose a new password" : "This link has expired"}
          </CardTitle>
          <CardDescription>
            {current
              ? "You're almost done — set a new password for your account."
              : "Password reset links are only valid for a short time."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {current ? (
            <ResetPasswordForm continueHref={continueHref} />
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <TriangleAlert className="size-10 text-muted-foreground" />
              <Button render={<Link href="/forgot-password" />}>Request a new link</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
