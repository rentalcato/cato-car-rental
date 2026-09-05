import { Suspense } from "react";
import Link from "next/link";
import { Car } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { getPublicBusinessInfo } from "@/lib/marketing/queries";

export default async function LoginPage() {
  const business = await getPublicBusinessInfo();
  const businessName = business?.business_name || "Fleet Manager";

  return (
    <div className="flex min-h-screen">
      {/* Branding panel — hidden on small screens */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <Car className="size-6" />
          {businessName}
        </Link>
        <div className="space-y-2">
          <p className="text-2xl font-medium">
            Manage your rental fleet from one place.
          </p>
          <p className="text-sm text-primary-foreground/70">
            Vehicles, customers, rentals and payments — built for teams
            operating in Jamaica.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/50">
          &copy; {new Date().getFullYear()} {businessName}
        </p>
      </div>

      {/* Login panel */}
      <div className="flex w-full flex-1 items-center justify-center p-6 lg:w-1/2">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-1 text-center">
            <Link
              href="/"
              className="mx-auto mb-2 flex items-center gap-2 text-lg font-semibold lg:hidden"
            >
              <Car className="size-6" />
              {businessName}
            </Link>
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Enter your email and password to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense>
              <LoginForm />
            </Suspense>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-foreground hover:underline">
                Sign Up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
