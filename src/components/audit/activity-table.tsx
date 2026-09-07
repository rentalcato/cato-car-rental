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
import { formatDateTime } from "@/lib/format";
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_TYPE_LABELS, humanize } from "@/lib/audit/log";
import type { AuditLogRow } from "@/lib/audit/queries";

/** Loosely groups actions by shape so the badge color carries meaning at a glance. */
function actionVariant(action: string): "destructive" | "secondary" | "outline" {
  if (/(deleted|denied|cancelled|deactivated|unlinked)$/.test(action)) return "destructive";
  if (/(created|approved|activated|linked|recorded|reactivated|completed)$/.test(action)) return "secondary";
  return "outline";
}

export function ActivityTable({ entries }: { entries: AuditLogRow[] }) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          No activity matches your filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Who</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDateTime(entry.created_at)}
              </TableCell>
              <TableCell className="font-medium">{entry.actorName}</TableCell>
              <TableCell>
                <Badge variant={actionVariant(entry.action)}>
                  {AUDIT_ACTION_LABELS[entry.action] ?? humanize(entry.action)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  {entry.targetHref ? (
                    <Link href={entry.targetHref} className="hover:underline">
                      {entry.targetLabel}
                    </Link>
                  ) : (
                    <span>{entry.targetLabel}</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {AUDIT_ENTITY_TYPE_LABELS[entry.entity_type] ?? humanize(entry.entity_type)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{entry.detail ?? "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
