"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
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
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { getMaintenanceAttachmentUrl } from "@/lib/maintenance/actions";
import type { MaintenanceRow } from "@/lib/maintenance/queries";

export function MaintenanceTable({ records }: { records: MaintenanceRow[] }) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleViewReceipt(path: string) {
    setError(null);
    startTransition(async () => {
      const result = await getMaintenanceAttachmentUrl(path);
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        setError(result.error ?? "Could not open this receipt.");
      }
    });
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          No maintenance records yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Service Date</TableHead>
              <TableHead>Next Service</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead className="w-1" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">
                  <Link href={`/vehicles/${record.vehicle_id}`} className="hover:underline">
                    {record.vehicle?.license_plate ?? "—"}
                  </Link>
                </TableCell>
                <TableCell className="capitalize">
                  {record.maintenance_type?.replace(/_/g, " ") ?? "—"}
                </TableCell>
                <TableCell>{formatDate(record.service_date)}</TableCell>
                <TableCell>{formatDate(record.next_service_date)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(record.cost)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {record.service_provider ?? "—"}
                </TableCell>
                <TableCell>
                  {record.receipt_storage_path ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleViewReceipt(record.receipt_storage_path!)}
                    >
                      <FileText className="size-3.5" />
                      <span className="sr-only">View receipt</span>
                    </Button>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{formatNumber(records.length)} record(s)</p>
    </div>
  );
}
