import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { requireRole } from "@/lib/auth/dal";
import { canAccess } from "@/lib/auth/roles";
import { createCustomer } from "@/lib/customers/actions";

export default async function NewCustomerPage() {
  const { profile } = await requireRole(["super_admin", "manager", "staff"]);
  const canManageAccountLink = canAccess(profile.role, ["super_admin", "manager"]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add Customer" description="Add a new customer record." />
      <Card>
        <CardContent className="pt-6">
          <CustomerForm
            action={createCustomer}
            submitLabel="Add Customer"
            canManageAccountLink={canManageAccountLink}
          />
        </CardContent>
      </Card>
    </div>
  );
}
