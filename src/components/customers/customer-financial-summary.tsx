import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export function CustomerFinancialSummary({
  balanceOutstanding,
  lifetimeSpend,
  depositsHeld,
}: {
  balanceOutstanding: number;
  lifetimeSpend: number;
  depositsHeld: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Amount Outstanding</p>
          <p
            className={
              balanceOutstanding > 0
                ? "text-2xl font-bold tabular-nums text-destructive"
                : "text-2xl font-bold tabular-nums"
            }
          >
            {formatCurrency(balanceOutstanding)}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Lifetime Rental Spending</p>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(lifetimeSpend)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Deposits Held</p>
          <p className="text-2xl font-bold tabular-nums">{formatCurrency(depositsHeld)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
