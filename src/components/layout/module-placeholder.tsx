import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

/**
 * Shared shell for every not-yet-built module page. Later phases replace
 * the <CardContent> body with real CRUD UI — the route, nav entry and
 * role gate already exist from Phase 1.
 */
export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
  phase,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  phase: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Icon className="size-10 text-muted-foreground" />
          <p className="text-sm font-medium">Coming in {phase}</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            This module isn&apos;t built yet — Phase 1 only sets up the
            database, navigation and permissions it will use.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
