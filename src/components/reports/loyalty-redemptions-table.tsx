import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import type { LoyaltyRedemptionRow } from "@/lib/reports/queries";

/** What customers have redeemed their loyalty points for — most recent first. */
export function LoyaltyRedemptionsTable({ redemptions }: { redemptions: LoyaltyRedemptionRow[] }) {
  if (redemptions.length === 0) {
    return <p className="text-sm text-muted-foreground">No loyalty rewards have been redeemed yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Reward Redeemed</TableHead>
            <TableHead className="text-right">Points Used</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {redemptions.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">
                <Link href={`/customers/${r.customerId}`} className="hover:underline">
                  {r.customerName}
                </Link>
                <span className="ml-1.5 font-mono text-xs text-muted-foreground">{r.customerNumber}</span>
              </TableCell>
              <TableCell className="text-muted-foreground">{r.label.replace(/^Redeemed:\s*/, "")}</TableCell>
              <TableCell className="text-right tabular-nums">{r.pointsUsed.toLocaleString()}</TableCell>
              <TableCell className="text-muted-foreground">{formatDateTime(r.redeemedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
