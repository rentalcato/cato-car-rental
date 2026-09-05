import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { StatusSummaryCards } from "@/components/vehicles/status-summary-cards";
import { VehicleFilters } from "@/components/vehicles/vehicle-filters";
import { VehicleTable } from "@/components/vehicles/vehicle-table";
import { requireRole } from "@/lib/auth/dal";
import { canAccess } from "@/lib/auth/roles";
import { getVehicleStatusCounts, listVehicles } from "@/lib/vehicles/queries";
import { VEHICLE_STATUSES } from "@/lib/constants";
import type { VehicleStatus } from "@/types/database.types";

export default async function VehiclesPage(props: PageProps<"/vehicles">) {
  const { profile } = await requireRole(["super_admin", "manager", "staff"]);
  const canManage = canAccess(profile.role, ["super_admin", "manager"]);

  const searchParams = await props.searchParams;
  const search = typeof searchParams.search === "string" ? searchParams.search : "";
  const statusParam = typeof searchParams.status === "string" ? searchParams.status : "all";
  const status = (VEHICLE_STATUSES as readonly string[]).includes(statusParam)
    ? (statusParam as VehicleStatus)
    : "all";
  const showArchived = searchParams.archived === "1";

  const [counts, vehicles] = await Promise.all([
    getVehicleStatusCounts(),
    listVehicles({ search, status, showArchived }),
  ]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <PageHeader title="Vehicles" description="Your rental fleet, at a glance." />
        {canManage ? (
          <Button render={<Link href="/vehicles/new" />}>
            <Plus className="size-4" />
            Add Vehicle
          </Button>
        ) : null}
      </div>

      <div className="mb-6">
        <StatusSummaryCards counts={counts} activeStatus={status === "all" ? undefined : status} />
      </div>

      <div className="mb-4">
        <VehicleFilters
          defaultSearch={search}
          defaultStatus={status}
          defaultShowArchived={showArchived}
        />
      </div>

      <VehicleTable vehicles={vehicles} canManage={canManage} />
    </div>
  );
}
