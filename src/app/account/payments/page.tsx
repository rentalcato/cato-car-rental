import Link from "next/link";
import { CreditCard, Receipt, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CustomerPaymentHistoryTable } from "@/components/customers/customer-payment-history-table";
import { getMyAccount, getMyBookings, getMyPayments } from "@/lib/account/queries";
import { formatCurrency } from "@/lib/format";

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${tone === "warn" ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}

export default async function PaymentsPage() {
  const account = await getMyAccount();
  const customer = account?.customer;
  const [bookings, payments] = await Promise.all([
    getMyBookings(customer?.id),
    getMyPayments(customer?.id),
  ]);

  const totalAmount = bookings.reduce((sum, b) => sum + (b.total_amount ?? 0), 0);
  const totalPaid = bookings.reduce((sum, b) => sum + (b.amount_paid ?? 0), 0);
  const totalBalance = bookings.reduce((sum, b) => sum + (b.balance_due ?? 0), 0);
  const heldDeposits = bookings
    .filter((b) => b.rental_status === "active" || b.rental_status === "overdue")
    .reduce((sum, b) => sum + (b.deposit_amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payments &amp; Invoices</h1>
        <p className="text-sm text-muted-foreground">Your balance, payment history, and receipts across every booking.</p>
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          <SummaryStat label="Lifetime total" value={formatCurrency(totalAmount)} />
          <SummaryStat label="Total paid" value={formatCurrency(totalPaid)} />
          <SummaryStat label="Outstanding balance" value={formatCurrency(totalBalance)} tone={totalBalance > 0 ? "warn" : undefined} />
          <SummaryStat label="Deposits currently held" value={formatCurrency(heldDeposits)} />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Receipt className="size-4.5" />
          Invoices by Booking
        </h2>
        {bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Booking #</th>
                  <th className="p-3 font-medium">Vehicle</th>
                  <th className="p-3 text-right font-medium">Total</th>
                  <th className="p-3 text-right font-medium">Paid</th>
                  <th className="p-3 text-right font-medium">Balance</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="p-3 font-medium">{b.rental_number}</td>
                    <td className="p-3 text-muted-foreground">
                      {b.vehicle ? [b.vehicle.make, b.vehicle.model].filter(Boolean).join(" ") : "—"}
                    </td>
                    <td className="p-3 text-right tabular-nums">{formatCurrency(b.total_amount)}</td>
                    <td className="p-3 text-right tabular-nums">{formatCurrency(b.amount_paid)}</td>
                    <td className="p-3 text-right tabular-nums">{formatCurrency(b.balance_due)}</td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" render={<Link href={`/account/rentals/${b.id}#payments`} />}>
                        View Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <CreditCard className="size-4.5" />
          Payment History
        </h2>
        <CustomerPaymentHistoryTable payments={payments} />
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 shrink-0" />
        Security deposits are collected at pickup and released after your vehicle is returned and inspected.
      </p>
    </div>
  );
}
