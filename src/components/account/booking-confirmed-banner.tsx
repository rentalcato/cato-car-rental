"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";

/**
 * The explicit "your booking went through" moment requestReservation()
 * redirects into (via ?booked=1) — the durable record is the
 * notification/trip-card below, this is just the one-time confirmation.
 * Clears the query param from the URL itself once shown, so a refresh
 * or reshare of the link doesn't keep re-showing it.
 */
export function BookingConfirmedBanner() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    router.replace("/account", { scroll: false });
  }, [router]);

  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-emerald-600/30 bg-emerald-500/10 p-4">
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-emerald-800 dark:text-emerald-400">Booking request sent!</p>
        <p className="text-sm text-emerald-800/80 dark:text-emerald-400/80">
          We&apos;ve received your reservation request — you&apos;ll see it below, and we&apos;ll notify you
          once it&apos;s confirmed.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="rounded-md p-1 text-emerald-800/60 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-400/60 dark:hover:text-emerald-400"
      >
        <X className="size-4" />
        <span className="sr-only">Dismiss</span>
      </button>
    </div>
  );
}
