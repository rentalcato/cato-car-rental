import { AlertTriangle, ShieldX, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomerStatus } from "@/types/database.types";

/**
 * Prominent status warning — shown on the customer profile and again in
 * the rental checkout flow. No "warning" design token exists in this app
 * yet (VEHICLE_STATUS_CONFIG uses raw hex dots for the same reason), so
 * Restricted uses amber utilities directly; Blacklisted reuses the
 * existing destructive-token error-banner pattern from the customer/
 * vehicle forms.
 */
export function CustomerWarningBanner({
  status,
  className,
}: {
  status: CustomerStatus;
  className?: string;
}) {
  if (status === "restricted") {
    return (
      <div
        role="alert"
        className={cn(
          "flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400",
          className
        )}
      >
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <span>
          This customer is <strong>Restricted</strong>. Review their history carefully before
          creating a new rental.
        </span>
      </div>
    );
  }

  if (status === "blacklisted") {
    return (
      <div
        role="alert"
        className={cn(
          "flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive",
          className
        )}
      >
        <ShieldX className="mt-0.5 size-4 shrink-0" />
        <span>
          This customer is <strong>Blacklisted</strong>. A manager or super admin must
          explicitly override this restriction to check out a vehicle to them.
        </span>
      </div>
    );
  }

  if (status === "inactive") {
    return (
      <div
        role="alert"
        className={cn(
          "flex items-start gap-2 rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground",
          className
        )}
      >
        <UserX className="mt-0.5 size-4 shrink-0" />
        <span>
          This customer is <strong>Inactive</strong>. Confirm this profile is still current
          before creating a new rental.
        </span>
      </div>
    );
  }

  return null;
}
