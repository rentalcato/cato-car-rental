import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";

export function RevenueSummaryCards({
  revenueToday,
  revenueThisMonth,
  revenueAllTime,
  outstandingBalance,
  depositsHeld,
  fleetUtilizationPct,
}: {
  revenueToday: number;
  revenueThisMonth: number;
  revenueAllTime: number;
  outstandingBalance: number;
  depositsHeld: number;
  fleetUtilizationPct: number;
}) {
  const cards = [
    { label: "Revenue Today", value: formatCurrency(revenueToday) },
    { label: "Revenue This Month", value: formatCurrency(revenueThisMonth) },
    { label: "Revenue All-Time", value: formatCurrency(revenueAllTime) },
    { label: "Fleet Utilization", value: `${formatNumber(Math.round(fleetUtilizationPct))}%` },
    {
      label: "Outstanding Balance",
      value: formatCurrency(outstandingBalance),
      accent: outstandingBalance > 0,
    },
    { label: "Deposits Held", value: formatCurrency(depositsHeld) },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p
              className={
                card.accent
                  ? "text-2xl font-bold tabular-nums text-destructive"
                  : "text-2xl font-bold tabular-nums"
              }
            >
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
