import { Check, Gift, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReferralCodeCard } from "@/components/account/referral-code-card";
import { getMyAccount, getMyBookings } from "@/lib/account/queries";
import { computeLoyaltySummary, LOYALTY_TIERS } from "@/lib/loyalty/compute";
import { formatCurrency } from "@/lib/format";

export default async function LoyaltyPage() {
  const account = await getMyAccount();
  const customer = account?.customer;
  const bookings = customer ? await getMyBookings(customer.id) : [];

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
        <Gift className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loyalty rewards unlock once your account is connected.</p>
      </div>
    );
  }

  const summary = computeLoyaltySummary(bookings, customer.customer_number);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Loyalty &amp; Rewards</h1>
        <p className="text-sm text-muted-foreground">Earn points on every completed rental — redemption is coming soon.</p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-xs font-medium tracking-wide text-primary uppercase">{summary.tier.name} Member</p>
            <p className="text-3xl font-bold tabular-nums">{summary.points.toLocaleString()} pts</p>
            <p className="text-sm text-muted-foreground">
              From {formatCurrency(summary.lifetimeSpend)} spent across {summary.completedRentals} completed{" "}
              {summary.completedRentals === 1 ? "rental" : "rentals"}
            </p>
          </div>
          <Gift className="size-10 text-primary/40" />
        </CardContent>
        {summary.nextTier ? (
          <CardContent className="border-t pt-4">
            <p className="text-sm text-muted-foreground">
              {summary.pointsToNextTier.toLocaleString()} more points to reach{" "}
              <span className="font-medium text-foreground">{summary.nextTier.name}</span>
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, (summary.points / summary.nextTier.minPoints) * 100)}%`,
                }}
              />
            </div>
          </CardContent>
        ) : null}
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Membership Tiers</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {LOYALTY_TIERS.map((tier) => (
            <Card key={tier.name} className={tier.name === summary.tier.name ? "ring-2 ring-primary" : undefined}>
              <CardContent className="flex flex-col gap-1 p-4">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{tier.name}</p>
                  {tier.name === summary.tier.name ? <Badge>Current</Badge> : null}
                </div>
                <p className="text-xs text-muted-foreground">{tier.minPoints.toLocaleString()}+ points</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm">
                  <Check className="size-3.5 shrink-0 text-primary" />
                  {tier.perk}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Share2 className="size-4.5" />
          Refer a Friend
        </h2>
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="text-sm text-muted-foreground">
              Share your referral code with friends and family. Referral rewards tracking is coming soon —
              for now, just have them mention your code when they book.
            </p>
            <ReferralCodeCard code={summary.referralCode} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
