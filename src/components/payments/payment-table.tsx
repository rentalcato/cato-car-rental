import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { PaymentListRow } from "@/lib/payments/queries";

const METHOD_LABELS: Record<NonNullable<PaymentListRow["payment_method"]>, string> = {
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  online: "Online",
  other: "Other",
};

export function PaymentTable({ payments }: { payments: PaymentListRow[] }) {
  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          No payments match your filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Rental #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => {
            const isRefund = payment.payment_amount < 0;
            return (
              <TableRow key={payment.id}>
                <TableCell>{formatDateTime(payment.payment_date)}</TableCell>
                <TableCell className="font-medium">
                  {payment.rental?.rental_number ?? "—"}
                </TableCell>
                <TableCell>
                  {payment.customer ? (
                    <Link
                      href={`/customers/${payment.customer.id}`}
                      className="hover:underline"
                    >
                      {payment.customer.first_name} {payment.customer.last_name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {payment.payment_method ? (
                    <Badge variant="secondary">{METHOD_LABELS[payment.payment_method]}</Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {payment.payment_reference || "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <span className={isRefund ? "text-destructive" : "font-medium"}>
                    {isRefund ? `(${formatCurrency(Math.abs(payment.payment_amount))})` : formatCurrency(payment.payment_amount)}
                  </span>
                  {isRefund ? (
                    <Badge variant="outline" className="ml-1.5 align-middle">
                      Refund
                    </Badge>
                  ) : null}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
