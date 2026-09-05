import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import type { Customer } from "@/types/database.types";

export function CustomerTable({ customers }: { customers: Customer[] }) {
  if (customers.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          No customers match your search.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop / tablet: real table */}
      <div className="hidden overflow-x-auto rounded-md border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id} className="cursor-default">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {customer.customer_number}
                </TableCell>
                <TableCell className="font-semibold">
                  <Link href={`/customers/${customer.id}`} className="hover:underline">
                    {customer.first_name} {customer.last_name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{customer.email || "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.primary_phone || "—"}
                </TableCell>
                <TableCell>
                  <CustomerStatusBadge status={customer.status} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    render={<Link href={`/customers/${customer.id}/edit`} />}
                  >
                    <Pencil className="size-3.5" />
                    <span className="sr-only">
                      Edit {customer.first_name} {customer.last_name}
                    </span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-3 sm:hidden">
        {customers.map((customer) => (
          <Link key={customer.id} href={`/customers/${customer.id}`}>
            <Card>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {customer.first_name} {customer.last_name}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {customer.customer_number}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {customer.email || customer.primary_phone || "No contact info on file"}
                  </p>
                </div>
                <CustomerStatusBadge status={customer.status} className="shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
