import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface MonthlyRevenuePoint {
  month: string; // "2026-01"
  label: string; // "Jan"
  revenue: number;
}

export interface VehiclePerformanceRow {
  vehicleId: string;
  licensePlate: string;
  make: string | null;
  model: string | null;
  rentalCount: number;
  revenue: number;
  maintenanceCost: number;
  profit: number;
}

export interface TopCustomerRow {
  customerId: string;
  name: string;
  customerNumber: string;
  revenue: number;
}

export interface OverdueRentalRow {
  id: string;
  rentalNumber: string;
  customerId: string;
  customerName: string;
  vehicleId: string;
  licensePlate: string;
  expectedReturn: string | null;
  balanceDue: number | null;
}

export interface LoyaltyRedemptionRow {
  id: string;
  customerId: string;
  customerName: string;
  customerNumber: string;
  /** e.g. "Redeemed: $10 Discount" — the ledger's own snapshot label (lib/loyalty), stays accurate even if the reward is later renamed/deleted. */
  label: string;
  pointsUsed: number;
  redeemedAt: string;
}

export interface ReportsData {
  revenueToday: number;
  revenueThisMonth: number;
  revenueAllTime: number;
  monthlyRevenue: MonthlyRevenuePoint[];
  totalRentals: number;
  averageRentalDays: number | null;
  fleetSize: number;
  fleetUtilizationPct: number;
  outstandingBalance: number;
  depositsHeld: number;
  maintenanceCostAllTime: number;
  overdueRentals: OverdueRentalRow[];
  vehiclePerformance: VehiclePerformanceRow[];
  topCustomers: TopCustomerRow[];
  reservationsCreated: number;
  reservationsActivated: number;
  recentRedemptions: LoyaltyRedemptionRow[];
}

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export async function getReportsData(): Promise<ReportsData> {
  const supabase = await createClient();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    paymentsResult,
    rentalsResult,
    vehiclesResult,
    maintenanceResult,
    customersResult,
    auditResult,
    redemptionsResult,
  ] = await Promise.all([
    // No date filter: needed both for the true all-time total and the
    // 12-month trend buckets below.
    supabase.from("payments").select("payment_amount, payment_date"),
    supabase
      .from("rentals")
      .select(
        "id, rental_number, vehicle_id, customer_id, amount_paid, balance_due, deposit_amount, rental_status, rental_start_datetime, expected_return_datetime, actual_return_datetime"
      ),
    supabase.from("vehicles").select("id, license_plate, make, model, vehicle_status, archived_at"),
    supabase.from("maintenance").select("vehicle_id, cost"),
    supabase.from("customers").select("id, customer_number, first_name, last_name"),
    supabase
      .from("audit_logs")
      .select("action")
      .in("action", ["reservation_created", "reservation_activated"]),
    // Loyalty redemptions (0024) — a customer's own name/number, not
    // just the customer_id, so this doesn't need a second round trip.
    supabase
      .from("loyalty_point_transactions")
      .select("id, customer_id, points_delta, label, created_at, customer:customers(id, customer_number, first_name, last_name)")
      .eq("transaction_type", "redeemed")
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  if (paymentsResult.error) throw paymentsResult.error;
  if (rentalsResult.error) throw rentalsResult.error;
  if (vehiclesResult.error) throw vehiclesResult.error;
  if (maintenanceResult.error) throw maintenanceResult.error;
  if (customersResult.error) throw customersResult.error;
  if (auditResult.error) throw auditResult.error;
  // 42P01/PGRST205 = relation doesn't exist — degrade to "no redemptions
  // yet" instead of breaking the whole Reports page if 0024 hasn't been
  // applied to this database yet (same pattern as lib/loyalty/queries.ts).
  if (redemptionsResult.error && redemptionsResult.error.code !== "42P01" && redemptionsResult.error.code !== "PGRST205") {
    throw redemptionsResult.error;
  }

  const payments = paymentsResult.data ?? [];
  const rentals = rentalsResult.data ?? [];
  const vehicles = vehiclesResult.data ?? [];
  const maintenance = maintenanceResult.data ?? [];
  const customers = customersResult.data ?? [];
  const auditLogs = auditResult.data ?? [];
  const redemptions = redemptionsResult.data ?? [];

  // --- Revenue windows (net of refunds — payment_amount is signed) ---
  let revenueToday = 0;
  let revenueThisMonth = 0;
  let revenueAllTime = 0;
  const monthlyBuckets = new Map<string, number>();
  for (const p of payments) {
    revenueAllTime += p.payment_amount;
    const date = new Date(p.payment_date);
    if (date >= startOfToday) revenueToday += p.payment_amount;
    if (date >= startOfMonth) revenueThisMonth += p.payment_amount;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthlyBuckets.set(key, (monthlyBuckets.get(key) ?? 0) + p.payment_amount);
  }
  const monthlyRevenue: MonthlyRevenuePoint[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyRevenue.push({
      month: key,
      label: MONTH_LABELS[d.getMonth()]!,
      revenue: monthlyBuckets.get(key) ?? 0,
    });
  }

  // --- Rentals / duration ---
  const completedRentals = rentals.filter(
    (r) => r.rental_status === "completed" && r.rental_start_datetime && r.actual_return_datetime
  );
  const averageRentalDays =
    completedRentals.length > 0
      ? completedRentals.reduce((sum, r) => {
          const start = new Date(r.rental_start_datetime!).getTime();
          const end = new Date(r.actual_return_datetime!).getTime();
          return sum + (end - start) / (1000 * 60 * 60 * 24);
        }, 0) / completedRentals.length
      : null;

  // --- Fleet utilization ---
  const activeFleet = vehicles.filter((v) => !v.archived_at);
  const rentedCount = activeFleet.filter((v) => v.vehicle_status === "rented").length;
  const fleetUtilizationPct = activeFleet.length > 0 ? (rentedCount / activeFleet.length) * 100 : 0;

  // --- Outstanding / deposits (open rentals only) ---
  const openRentals = rentals.filter(
    (r) => r.rental_status === "active" || r.rental_status === "overdue"
  );
  const outstandingBalance = openRentals.reduce((sum, r) => sum + (r.balance_due ?? 0), 0);
  const depositsHeld = openRentals.reduce((sum, r) => sum + (r.deposit_amount ?? 0), 0);

  // --- Maintenance cost ---
  const maintenanceCostAllTime = maintenance.reduce((sum, m) => sum + (m.cost ?? 0), 0);
  const maintenanceCostByVehicle = new Map<string, number>();
  for (const m of maintenance) {
    maintenanceCostByVehicle.set(
      m.vehicle_id,
      (maintenanceCostByVehicle.get(m.vehicle_id) ?? 0) + (m.cost ?? 0)
    );
  }

  // --- Per-vehicle performance (revenue from rentals.amount_paid, same
  //     convention as the customer profile's lifetime-spend calc) ---
  const rentalCountByVehicle = new Map<string, number>();
  const revenueByVehicle = new Map<string, number>();
  for (const r of rentals) {
    rentalCountByVehicle.set(r.vehicle_id, (rentalCountByVehicle.get(r.vehicle_id) ?? 0) + 1);
    revenueByVehicle.set(r.vehicle_id, (revenueByVehicle.get(r.vehicle_id) ?? 0) + (r.amount_paid ?? 0));
  }
  const vehiclePerformance: VehiclePerformanceRow[] = vehicles.map((v) => {
    const revenue = revenueByVehicle.get(v.id) ?? 0;
    const maintenanceCost = maintenanceCostByVehicle.get(v.id) ?? 0;
    return {
      vehicleId: v.id,
      licensePlate: v.license_plate,
      make: v.make,
      model: v.model,
      rentalCount: rentalCountByVehicle.get(v.id) ?? 0,
      revenue,
      maintenanceCost,
      profit: revenue - maintenanceCost,
    };
  });
  vehiclePerformance.sort((a, b) => b.revenue - a.revenue);

  // --- Top customers ---
  const revenueByCustomer = new Map<string, number>();
  for (const r of rentals) {
    revenueByCustomer.set(r.customer_id, (revenueByCustomer.get(r.customer_id) ?? 0) + (r.amount_paid ?? 0));
  }
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const topCustomers: TopCustomerRow[] = Array.from(revenueByCustomer.entries())
    .map(([customerId, revenue]) => {
      const c = customerById.get(customerId);
      return {
        customerId,
        name: c ? `${c.first_name} ${c.last_name}` : "Unknown customer",
        customerNumber: c?.customer_number ?? "—",
        revenue,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // --- Overdue rentals ---
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const overdueRentals: OverdueRentalRow[] = rentals
    .filter((r) => r.rental_status === "overdue")
    .map((r) => {
      const c = customerById.get(r.customer_id);
      const v = vehicleById.get(r.vehicle_id);
      return {
        id: r.id,
        rentalNumber: r.rental_number,
        customerId: r.customer_id,
        customerName: c ? `${c.first_name} ${c.last_name}` : "Unknown customer",
        vehicleId: r.vehicle_id,
        licensePlate: v?.license_plate ?? "—",
        expectedReturn: r.expected_return_datetime,
        balanceDue: r.balance_due,
      };
    });

  // --- Reservation conversion ---
  const reservationsCreated = auditLogs.filter((a) => a.action === "reservation_created").length;
  const reservationsActivated = auditLogs.filter((a) => a.action === "reservation_activated").length;

  // --- Recent loyalty redemptions ---
  const recentRedemptions: LoyaltyRedemptionRow[] = redemptions.map((r) => {
    const c = Array.isArray(r.customer) ? r.customer[0] : r.customer;
    return {
      id: r.id,
      customerId: r.customer_id,
      customerName: c ? `${c.first_name} ${c.last_name}` : "Unknown customer",
      customerNumber: c?.customer_number ?? "—",
      label: r.label,
      pointsUsed: Math.abs(r.points_delta),
      redeemedAt: r.created_at,
    };
  });

  return {
    revenueToday,
    revenueThisMonth,
    revenueAllTime,
    monthlyRevenue,
    totalRentals: rentals.length,
    averageRentalDays,
    fleetSize: activeFleet.length,
    fleetUtilizationPct,
    outstandingBalance,
    depositsHeld,
    maintenanceCostAllTime,
    overdueRentals,
    vehiclePerformance,
    topCustomers,
    reservationsCreated,
    reservationsActivated,
    recentRedemptions,
  };
}
