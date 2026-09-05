"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Image as ImageIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { getIssuePhotoUrl, resolveIssue } from "@/lib/issues/actions";
import type { IssueRow } from "@/lib/issues/queries";

const SEVERITY_VARIANT = {
  low: "secondary",
  medium: "secondary",
  high: "destructive",
  critical: "destructive",
} as const;

export function IssuesTable({ issues }: { issues: IssueRow[] }) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleViewPhoto(path: string) {
    setError(null);
    startTransition(async () => {
      const result = await getIssuePhotoUrl(path);
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        setError(result.error ?? "Could not open this photo.");
      }
    });
  }

  function handleResolve(issueId: string, vehicleId: string) {
    setError(null);
    startTransition(async () => {
      const result = await resolveIssue(issueId, vehicleId);
      if (result.error) setError(result.error);
    });
  }

  if (issues.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          No open damage/issue reports.
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
              <TableHead>Severity</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead className="text-right">Repair Cost</TableHead>
              <TableHead className="w-1" />
              <TableHead className="w-1" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell className="font-medium">
                  <Link href={`/vehicles/${issue.vehicle_id}`} className="hover:underline">
                    {issue.vehicle?.license_plate ?? "—"}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{issue.issue_type || "—"}</TableCell>
                <TableCell>
                  {issue.severity ? (
                    <Badge variant={SEVERITY_VARIANT[issue.severity]} className="capitalize">
                      {issue.severity}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{formatDate(issue.reported_date)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(issue.repair_cost)}
                </TableCell>
                <TableCell>
                  {issue.photo_storage_path ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleViewPhoto(issue.photo_storage_path!)}
                    >
                      <ImageIcon className="size-3.5" />
                      <span className="sr-only">View photo</span>
                    </Button>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolve(issue.id, issue.vehicle_id)}
                  >
                    Resolve
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
