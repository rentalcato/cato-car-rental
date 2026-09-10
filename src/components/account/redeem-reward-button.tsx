"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { redeemReward } from "@/lib/loyalty/actions";

export function RedeemRewardButton({
  rewardId,
  canAfford,
  pointsShort,
}: {
  rewardId: string;
  canAfford: boolean;
  /** How many more points are needed, when !canAfford. */
  pointsShort: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRedeem() {
    if (!window.confirm("Redeem this reward? Your points will be deducted immediately.")) return;
    setError(null);
    startTransition(async () => {
      const result = await redeemReward(rewardId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (!canAfford) {
    return (
      <div className="text-right">
        <Button size="sm" variant="outline" disabled className="w-full">
          Redeem
        </Button>
        <p className="mt-1 text-[11px] text-muted-foreground">Need {pointsShort.toLocaleString()} more pts</p>
      </div>
    );
  }

  return (
    <div className="text-right">
      <Button size="sm" disabled={isPending} onClick={handleRedeem} className="w-full">
        {isPending ? "Redeeming…" : "Redeem"}
      </Button>
      {error ? <p className="mt-1 text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}
