import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { Payment } from "@/types/database.types";

const METHOD_LABELS: Record<NonNullable<Payment["payment_method"]>, string> = {
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  online: "Online",
  other: "Other",
};

export function CustomerPaymentHistoryTable({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return <p className="text-sm text-muted-foreground">No payments recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
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
                <TableCell className="text-right font-medium tabular-nums">
                  <span className={isRefund ? "text-destructive" : undefined}>
                    {isRefund
                      ? `(${formatCurrency(Math.abs(payment.payment_amount))})`
                      : formatCurrency(payment.payment_amount)}
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
