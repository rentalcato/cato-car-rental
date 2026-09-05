import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/dal";

export default async function UnauthorizedPage() {
  const current = await getCurrentUser();
  const isCustomer = current?.profile.role === "customer";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <ShieldAlert className="size-12 text-destructive" />
      <h1 className="text-2xl font-semibold">You don&apos;t have access to this page</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {isCustomer
          ? "This section is for staff only — your account doesn't have dashboard access."
          : "Your account role doesn't include permission to view this section. If you think this is a mistake, contact a manager or super admin."}
      </p>
      <Button render={<Link href={isCustomer ? "/account" : "/"} />}>
        {isCustomer ? "Go to your account" : "Back to home"}
      </Button>
    </div>
  );
}
