import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerFilters } from "@/components/customers/customer-filters";
import { CustomerTable } from "@/components/customers/customer-table";
import { requireRole } from "@/lib/auth/dal";
import { listCustomers } from "@/lib/customers/queries";
import { CUSTOMER_STATUSES } from "@/lib/constants";
import type { CustomerStatus } from "@/types/database.types";

export default async function CustomersPage(props: PageProps<"/customers">) {
  await requireRole(["super_admin", "manager", "staff"]);

  const searchParams = await props.searchParams;
  const search = typeof searchParams.search === "string" ? searchParams.search : "";
  const statusParam = typeof searchParams.status === "string" ? searchParams.status : "all";
  const status = (CUSTOMER_STATUSES as readonly string[]).includes(statusParam)
    ? (statusParam as CustomerStatus)
    : "all";
  const showInactive = searchParams.inactive === "1";

  const customers = await listCustomers({ search, status, showInactive });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <PageHeader title="Customers" description="Customer records, licenses and identification." />
        <Button render={<Link href="/customers/new" />}>
          <Plus className="size-4" />
          Add Customer
        </Button>
      </div>

      <div className="mb-4">
        <CustomerFilters
          defaultSearch={search}
          defaultStatus={status}
          defaultShowInactive={showInactive}
        />
      </div>

      <CustomerTable customers={customers} />
    </div>
  );
}
