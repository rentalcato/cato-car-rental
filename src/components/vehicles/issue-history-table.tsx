import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { VehicleIssue } from "@/types/database.types";

export function IssueHistoryTable({ issues }: { issues: VehicleIssue[] }) {
  if (issues.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No issues or damage reported — issue tracking arrives in a later phase.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Reported</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Repair Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <TableRow key={issue.id}>
              <TableCell className="font-medium">{issue.issue_type ?? "—"}</TableCell>
              <TableCell className="capitalize">{issue.severity ?? "—"}</TableCell>
              <TableCell>{formatDate(issue.reported_date)}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize">
                  {issue.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(issue.repair_cost)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
