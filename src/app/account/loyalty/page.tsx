import { CheckCircle2, Gift, History, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReferralCodeCard } from "@/components/account/referral-code-card";
import { RedeemRewardButton } from "@/components/account/redeem-reward-button";
import { getMyAccount } from "@/lib/account/queries";
import {
  getActiveEarningRules,
  getActiveRewards,
  getCustomerPointHistory,
  getCustomerPointsBalance,
} from "@/lib/loyalty/queries";
import { getReferralCode } from "@/lib/loyalty/compute";
import { getRewardTypeIcon, getRewardTypeLabel } from "@/lib/loyalty/labels";
import { formatDateTime } from "@/lib/format";

export default async function LoyaltyPage() {
  const account = await getMyAccount();
  const customer = account?.customer;

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16 text-center">
        <Gift className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loyalty rewards unlock once your account is connected.</p>
      </div>
    );
  }

  const [balance, rules, rewards, history] = await Promise.all([
    getCustomerPointsBalance(customer.id),
    getActiveEarningRules(),
    getActiveRewards(),
    getCustomerPointHistory(customer.id),
  ]);

  const referralRule = rules.find((r) => r.action_key === "referral_completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Loyalty &amp; Rewards</h1>
        <p className="text-sm text-muted-foreground">Earn points on every rental and spend them on real rewards.</p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-xs font-medium tracking-wide text-primary uppercase">Your Balance</p>
            <p className="text-3xl font-bold tabular-nums">{balance.toLocaleString()} pts</p>
          </div>
          <Gift className="size-10 text-primary/40" />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">How You Earn Points</h2>
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No earning rules are active right now — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{rule.name}</p>
                    {rule.description ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">{rule.description}</p>
                    ) : null}
                  </div>
                  <Badge className="shrink-0">
                    +{rule.points.toLocaleString()} {rule.action_key === "spend_per_dollar" ? "/ $1" : "pts"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Available Rewards</h2>
        {rewards.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rewards are available to redeem right now.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => {
              const Icon = getRewardTypeIcon(reward.reward_type);
              const canAfford = balance >= reward.points_required;
              return (
                <Card key={reward.id} className={canAfford ? "ring-1 ring-primary/30" : undefined}>
                  <CardContent className="flex flex-col gap-3 p-4">
                    <div className="flex items-start gap-2">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="size-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{reward.name}</p>
                        <p className="text-xs text-muted-foreground">{getRewardTypeLabel(reward.reward_type)}</p>
                      </div>
                    </div>
                    {reward.description ? (
                      <p className="text-xs text-muted-foreground">{reward.description}</p>
                    ) : null}
                    <div className="mt-auto flex items-end justify-between gap-2 border-t pt-3">
                      <div>
                        <p className="text-lg font-bold tabular-nums">{reward.points_required.toLocaleString()}</p>
                        <p className="text-[11px] text-muted-foreground">points {reward.reward_value ? `· ${reward.reward_value}` : ""}</p>
                      </div>
                      <RedeemRewardButton
                        rewardId={reward.id}
                        canAfford={canAfford}
                        pointsShort={Math.max(0, reward.points_required - balance)}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <History className="size-4.5" />
          Points History
        </h2>
        <Card>
          <CardContent className="p-0">
            {history.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No point activity yet.</p>
            ) : (
              <ul className="divide-y">
                {history.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                          entry.points_delta >= 0
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {entry.points_delta >= 0 ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <Gift className="size-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{entry.label}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 font-semibold tabular-nums ${
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
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Share2 className="size-4.5" />
          Refer a Friend
        </h2>
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="text-sm text-muted-foreground">
              Share your referral code with friends and family.{" "}
              {referralRule
                ? `Once a friend you refer completes a rental, let us know and we'll add ${referralRule.points.toLocaleString()} points to your balance.`
                : "Have them mention your code when they book."}
            </p>
            <ReferralCodeCard code={getReferralCode(customer.customer_number)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
