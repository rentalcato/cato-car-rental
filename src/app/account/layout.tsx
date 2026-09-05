import type { ReactNode } from "react";
import Link from "next/link";
import { Car, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/dal";
import { signOut } from "@/lib/auth/actions";
import { getPublicBusinessInfo, getPublicBusinessLogoUrl } from "@/lib/marketing/queries";

// Any signed-in user can land here — RLS scopes a customer to their own
// data, and a staff account with nothing linked just sees the "not
// linked yet" state, which is harmless.
export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireUser();

  const business = await getPublicBusinessInfo();
  const businessName = business?.business_name || "Fleet Manager";
  const logoUrl = await getPublicBusinessLogoUrl(business?.logo_storage_path ?? null);

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
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
          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit">
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
