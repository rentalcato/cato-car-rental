import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <ShieldAlert className="size-12 text-destructive" />
      <h1 className="text-2xl font-semibold">You don&apos;t have access to this page</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Your account role doesn&apos;t include permission to view this
        section. If you think this is a mistake, contact a manager or
        super admin.
      </p>
      <Button render={<Link href="/" />}>Back to home</Button>
    </div>
  );
}
