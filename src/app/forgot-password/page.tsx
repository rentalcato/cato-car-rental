import Link from "next/link";
import { Car } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getPublicBusinessInfo, getPublicBusinessLogoUrl } from "@/lib/marketing/queries";

// Public — no auth required. See src/lib/supabase/proxy.ts's PUBLIC_PATHS.
export default async function ForgotPasswordPage() {
  const business = await getPublicBusinessInfo();
  const businessName = business?.business_name || "Fleet Manager";
  const logoUrl = await getPublicBusinessLogoUrl(business?.logo_storage_path ?? null);

  return (
    <div className="flex min-h-screen">
      {/* Branding panel — same as /login, hidden on small screens */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
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
        <div className="space-y-2">
          <p className="text-2xl font-medium">Forgot your password? No problem.</p>
          <p className="text-sm text-primary-foreground/70">
            We&apos;ll email you a secure link to choose a new one.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/50">
          &copy; {new Date().getFullYear()} {businessName}
        </p>
      </div>

      <div className="flex w-full flex-1 items-center justify-center p-6 lg:w-1/2">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-1 text-center">
            <Link
              href="/"
              className="mx-auto mb-2 flex items-center gap-2 text-lg font-semibold lg:hidden"
            >
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
            <CardTitle className="text-xl">Reset your password</CardTitle>
            <CardDescription>Enter your email and we&apos;ll send you a reset link.</CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Remembered it after all?{" "}
              <Link href="/login" className="font-medium text-foreground hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
