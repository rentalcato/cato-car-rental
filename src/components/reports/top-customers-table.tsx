import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import type { TopCustomerRow } from "@/lib/reports/queries";

export function TopCustomersTable({ customers }: { customers: TopCustomerRow[] }) {
  if (customers.length === 0) {
    return <p className="text-sm text-muted-foreground">No customer revenue recorded yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead className="text-right">Lifetime Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow key={c.customerId}>
              <TableCell className="font-medium">
                <Link href={`/customers/${c.customerId}`} className="hover:underline">
                  {c.name}
                </Link>
                <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                  {c.customerNumber}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(c.revenue)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
