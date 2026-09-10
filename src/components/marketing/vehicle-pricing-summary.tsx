import { formatCurrency } from "@/lib/format";
import type { PricingTiers } from "@/lib/vehicles/details";

/** The prominent daily/weekly/monthly price block — used on both the public and account Vehicle Details pages, above the booking card. */
export function VehiclePricingSummary({
  pricing,
  deposit,
}: {
  pricing: PricingTiers;
  deposit: number | null;
}) {
  if (pricing.daily === null) {
    return <p className="text-lg font-medium text-muted-foreground">Price on request</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight">{formatCurrency(pricing.daily)}</span>
        <span className="text-sm font-medium text-muted-foreground">/ day</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Weekly</p>
          <p className="font-semibold tabular-nums">{formatCurrency(pricing.weekly)}</p>
          <p className="text-[11px] text-primary">Save {pricing.weeklySavingsPct}%</p>
        </div>
        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-xs text-muted-foreground">Monthly</p>
          <p className="font-semibold tabular-nums">{formatCurrency(pricing.monthly)}</p>
          <p className="text-[11px] text-primary">Save {pricing.monthlySavingsPct}%</p>
        </div>
        {deposit ? (
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Security Deposit</p>
            <p className="font-semibold tabular-nums">{formatCurrency(deposit)}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
