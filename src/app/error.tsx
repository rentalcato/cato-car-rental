"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Route-segment error boundary — catches any otherwise-uncaught render
 * error in a page or layout under src/app (except the root layout
 * itself, which needs global-error.tsx instead). Without this, an
 * uncaught error showed the browser's own bare fallback rather than
 * anything recoverable — see the Topbar dropdown crash and the
 * dashboard layout race condition earlier this project, both real bugs
 * that looked far worse than they were for lack of this.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <AlertTriangle className="size-12 text-destructive" />
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        This page hit an unexpected error. You can try again, or head back to the homepage — your
        data is safe either way.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => reset()}>
          <RotateCw className="size-4" />
          Try again
        </Button>
        <Button variant="outline" render={<Link href="/" />}>
          Back to home
        </Button>
      </div>
    </div>
  );
}
