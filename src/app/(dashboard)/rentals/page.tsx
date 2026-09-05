import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { RentalFilters } from "@/components/rentals/rental-filters";
import { RentalTable } from "@/components/rentals/rental-table";
import { requireRole } from "@/lib/auth/dal";
import { canAccess } from "@/lib/auth/roles";
import { listRentals } from "@/lib/rentals/queries";
import { RENTAL_STATUSES } from "@/lib/constants";
import type { RentalStatus } from "@/types/database.types";

export default async function RentalsPage(props: PageProps<"/rentals">) {
  const { profile } = await requireRole(["super_admin", "manager", "staff"]);
  const canRecordPayment = canAccess(profile.role, ["super_admin", "manager"]);

  const searchParams = await props.searchParams;
  const search = typeof searchParams.search === "string" ? searchParams.search : "";
  const statusParam = typeof searchParams.status === "string" ? searchParams.status : "all";
  const status = (RENTAL_STATUSES as readonly string[]).includes(statusParam)
    ? (statusParam as RentalStatus)
    : "all";

  const rentals = await listRentals({ search, status });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <PageHeader title="Rentals" description="Create rentals, check vehicles in/out, track balances." />
        <Button render={<Link href="/rentals/new" />}>
          <Plus className="size-4" />
          New Rental
        </Button>
      </div>

      <div className="mb-4">
        <RentalFilters defaultSearch={search} defaultStatus={status} />
      </div>

      <RentalTable rentals={rentals} canRecordPayment={canRecordPayment} />
    </div>
  );
}
