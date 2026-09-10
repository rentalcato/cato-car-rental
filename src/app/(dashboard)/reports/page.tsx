import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { RevenueSummaryCards } from "@/components/reports/revenue-summary-cards";
import { RevenueTrendChart } from "@/components/reports/revenue-trend-chart";
import { FleetPerformanceTable } from "@/components/reports/fleet-performance-table";
import { TopCustomersTable } from "@/components/reports/top-customers-table";
import { OverdueRentalsTable } from "@/components/reports/overdue-rentals-table";
import { LoyaltyRedemptionsTable } from "@/components/reports/loyalty-redemptions-table";
import { requireRole } from "@/lib/auth/dal";
import { getReportsData } from "@/lib/reports/queries";
import { formatCurrency, formatNumber } from "@/lib/format";

export default async function ReportsPage() {
  await requireRole(["super_admin", "manager"]);
  const data = await getReportsData();

  const conversionRate =
    data.reservationsCreated > 0
      ? Math.round((data.reservationsActivated / data.reservationsCreated) * 100)
      : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Fleet performance and revenue, from live data." />

      <RevenueSummaryCards
        revenueToday={data.revenueToday}
        revenueThisMonth={data.revenueThisMonth}
        revenueAllTime={data.revenueAllTime}
        outstandingBalance={data.outstandingBalance}
        depositsHeld={data.depositsHeld}
        fleetUtilizationPct={data.fleetUtilizationPct}
      />

      <RevenueTrendChart data={data.monthlyRevenue} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Rentals</p>
            <p className="text-2xl font-bold tabular-nums">{formatNumber(data.totalRentals)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Avg. Rental Duration</p>
            <p className="text-2xl font-bold tabular-nums">
              {data.averageRentalDays !== null ? `${data.averageRentalDays.toFixed(1)}d` : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Reservation Conversion</p>
            <p className="text-2xl font-bold tabular-nums">
              {conversionRate !== null ? `${conversionRate}%` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.reservationsActivated} of {data.reservationsCreated} checked in
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Maintenance Cost (All-Time)</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(data.maintenanceCostAllTime)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">
          Overdue Rentals {data.overdueRentals.length > 0 ? `(${data.overdueRentals.length})` : ""}
        </h3>
        <OverdueRentalsTable rentals={data.overdueRentals} />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Fleet Performance</h3>
        <FleetPerformanceTable vehicles={data.vehiclePerformance} />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">Top Customers by Revenue</h3>
        <TopCustomersTable customers={data.topCustomers} />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold">
          Loyalty Redemptions {data.recentRedemptions.length > 0 ? `(${data.recentRedemptions.length})` : ""}
        </h3>
        <LoyaltyRedemptionsTable redemptions={data.recentRedemptions} />
      </div>
    </div>
  );
}
