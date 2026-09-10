"use client";

import { useActionState, useEffect, useRef } from "react";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/format";
import { grantPointsManually, type LoyaltyActionState } from "@/lib/loyalty/actions";
import type { LoyaltyEarningRule, LoyaltyPointTransaction } from "@/types/database.types";

const initialState: LoyaltyActionState = {};

/**
 * Staff-facing loyalty panel on a customer's profile — the only place
 * that can award points for rules with no automatic trigger (reviews,
 * referrals — see 0024's comment on those two seeded rules), and a
 * general manual-adjustment tool for the rest.
 */
export function GrantPointsPanel({
  customerId,
  balance,
  rules,
  recentHistory,
}: {
  customerId: string;
  balance: number;
  rules: LoyaltyEarningRule[];
  recentHistory: LoyaltyPointTransaction[];
}) {
  const [state, formAction, pending] = useActionState(grantPointsManually, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Gift className="size-4" />
            Loyalty Points
          </h3>
          <p className="text-lg font-bold tabular-nums">{balance.toLocaleString()} pts</p>
        </div>

        {rules.length > 0 ? (
          <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-3">
            <input type="hidden" name="customer_id" value={customerId} />
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="rule_id">Earning rule</Label>
              <Select name="rule_id" defaultValue={rules[0]?.id}>
                <SelectTrigger id="rule_id" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rules.map((rule) => (
                    <SelectItem key={rule.id} value={rule.id}>
                      {rule.name} (+{rule.points.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="note">Note (optional)</Label>
              <Input id="note" name="note" placeholder="e.g. Left a great review" maxLength={200} />
            </div>
            <div className="flex items-end sm:col-span-1">
              <Button type="submit" size="sm" disabled={pending} className="w-full">
                {pending ? "Awarding…" : "Award Points"}
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">No active earning rules — add one under Settings.</p>
        )}

        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">Recent Activity</p>
          {recentHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No point activity yet.</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {recentHistory.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-2 p-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate">{entry.label}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</p>
                  </div>
                  <span
                    className={`shrink-0 font-medium tabular-nums ${
                      entry.points_delta >= 0 ? "text-emerald-600" : "text-destructive"
                    }`}
                  >
                    {entry.points_delta >= 0 ? "+" : ""}
                    {entry.points_delta.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
