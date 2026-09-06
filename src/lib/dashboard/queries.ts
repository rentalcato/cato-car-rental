import "server-only";

import { createClient } from "@/lib/supabase/server";

export interface DashboardStats {
  fleetSize: number;
  availableVehicles: number;
  activeRentals: number;
  overdueRentals: number;
  pendingReservations: number;
  /** Net of refunds — payment_amount is signed, same convention as the Reports module. */
  revenueThisMonth: number;
  paymentsThisMonthCount: number;
}

/** Lightweight KPI counts for the main dashboard — a purpose-built, smaller query than the full Reports computation (lib/reports/queries.ts), which pulls far more than four numbers need. */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [fleetResult, availableResult, activeResult, overdueResult, pendingResult, paymentsResult] =
    await Promise.all([
      supabase.from("vehicles").select("id", { count: "exact", head: true }).is("archived_at", null),
      supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .is("archived_at", null)
        .eq("vehicle_status", "available"),
      supabase.from("rentals").select("id", { count: "exact", head: true }).eq("rental_status", "active"),
      supabase.from("rentals").select("id", { count: "exact", head: true }).eq("rental_status", "overdue"),
      supabase
        .from("rentals")
        .select("id", { count: "exact", head: true })
        .eq("rental_status", "reserved")
        .eq("approval_status", "pending"),
      supabase
        .from("payments")
        .select("payment_amount")
        .gte("payment_date", startOfMonth.toISOString()),
    ]);

  if (fleetResult.error) throw fleetResult.error;
  if (availableResult.error) throw availableResult.error;
  if (activeResult.error) throw activeResult.error;
  if (overdueResult.error) throw overdueResult.error;
  if (pendingResult.error) throw pendingResult.error;
  if (paymentsResult.error) throw paymentsResult.error;

  const payments = paymentsResult.data ?? [];

  return {
    fleetSize: fleetResult.count ?? 0,
    availableVehicles: availableResult.count ?? 0,
    activeRentals: activeResult.count ?? 0,
    overdueRentals: overdueResult.count ?? 0,
    pendingReservations: pendingResult.count ?? 0,
    revenueThisMonth: payments.reduce((sum, p) => sum + p.payment_amount, 0),
    paymentsThisMonthCount: payments.length,
  };
}
