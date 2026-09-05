import { PageHeader } from "@/components/layout/page-header";
import { PaymentFilters } from "@/components/payments/payment-filters";
import { PaymentTable } from "@/components/payments/payment-table";
import { requireRole } from "@/lib/auth/dal";
import { listPayments } from "@/lib/payments/queries";
import { PAYMENT_METHODS } from "@/lib/constants";
import type { PaymentMethod } from "@/types/database.types";

export default async function PaymentsPage(props: PageProps<"/payments">) {
  await requireRole(["super_admin", "manager"]);

  const searchParams = await props.searchParams;
  const search = typeof searchParams.search === "string" ? searchParams.search : "";
  const methodParam = typeof searchParams.method === "string" ? searchParams.method : "all";
  const method = (PAYMENT_METHODS as readonly string[]).includes(methodParam)
    ? (methodParam as PaymentMethod)
    : "all";
  const refundsOnly = searchParams.refunds === "1";

  const payments = await listPayments({ search, method, refundsOnly });

  return (
    <div>
      <div className="mb-6">
        <PageHeader title="Payments" description="Record and review rental payments." />
      </div>

      <div className="mb-4">
        <PaymentFilters
          defaultSearch={search}
          defaultMethod={method}
          defaultRefundsOnly={refundsOnly}
        />
      </div>

      <PaymentTable payments={payments} />
    </div>
  );
}
