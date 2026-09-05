import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { requireRole } from "@/lib/auth/dal";
import { createCustomer } from "@/lib/customers/actions";

export default async function NewCustomerPage() {
  await requireRole(["super_admin", "manager", "staff"]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add Customer" description="Add a new customer record." />
      <Card>
        <CardContent className="pt-6">
          <CustomerForm action={createCustomer} submitLabel="Add Customer" />
        </CardContent>
      </Card>
    </div>
  );
}
