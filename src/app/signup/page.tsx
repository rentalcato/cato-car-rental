import Link from "next/link";
import { Car } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";
import { getPublicBusinessInfo, getPublicBusinessLogoUrl } from "@/lib/marketing/queries";

export default async function SignupPage() {
  const business = await getPublicBusinessInfo();
  const businessName = business?.business_name || "Fleet Manager";
  const logoUrl = await getPublicBusinessLogoUrl(business?.logo_storage_path ?? null);

  return (
    <div className="flex min-h-screen">
      {/* Branding panel — hidden on small screens */}
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
          <p className="text-2xl font-medium">Your journey starts here.</p>
          <p className="text-sm text-primary-foreground/70">
            Create an account to get started. Vehicles, customers, rentals
            and payments — built for teams operating in Jamaica.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/50">
          &copy; {new Date().getFullYear()} {businessName}
        </p>
      </div>

      {/* Sign-up panel */}
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
            <CardTitle className="text-xl">Create an account</CardTitle>
            <CardDescription>Sign up to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-foreground hover:underline">
                Sign In
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
