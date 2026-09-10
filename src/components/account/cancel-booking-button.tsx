"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cancelMyReservation } from "@/lib/account/actions";

export function CancelBookingButton({ rentalId, size = "sm" }: { rentalId: string; size?: "sm" | "default" }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    if (!window.confirm("Cancel this reservation? This can't be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelMyReservation(rentalId);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant="outline" size={size} disabled={isPending} onClick={handleCancel}>
        {isPending ? "Cancelling…" : "Cancel Booking"}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
