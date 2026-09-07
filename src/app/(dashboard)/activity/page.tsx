import { PageHeader } from "@/components/layout/page-header";
import { ActivityFilters } from "@/components/audit/activity-filters";
import { ActivityTable } from "@/components/audit/activity-table";
import { requireRole } from "@/lib/auth/dal";
import { listAuditLogs } from "@/lib/audit/queries";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@/lib/audit/log";

export default async function ActivityPage(props: PageProps<"/activity">) {
  await requireRole(["super_admin", "manager"]);

  const searchParams = await props.searchParams;
  const search = typeof searchParams.search === "string" ? searchParams.search : "";
  const actionParam = typeof searchParams.action === "string" ? searchParams.action : "all";
  const action = (AUDIT_ACTIONS as readonly string[]).includes(actionParam) ? actionParam : "all";
  const typeParam = typeof searchParams.type === "string" ? searchParams.type : "all";
  const entityType = (AUDIT_ENTITY_TYPES as readonly string[]).includes(typeParam) ? typeParam : "all";

  const entries = await listAuditLogs({ search, action, entityType });

  return (
    <div>
      <div className="mb-6">
        <PageHeader
          title="Activity"
          description="Who did what, across customers, vehicles, reservations, payments and staff accounts."
        />
      </div>

      <div className="mb-4">
        <ActivityFilters defaultSearch={search} defaultAction={action} defaultEntityType={entityType} />
      </div>

      <ActivityTable entries={entries} />
    </div>
  );
}
