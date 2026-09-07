import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { requireRole } from "@/lib/auth/dal";
import { canAccess } from "@/lib/auth/roles";
import { getCustomer, getLinkedAccountEmail } from "@/lib/customers/queries";
import { updateCustomer } from "@/lib/customers/actions";

export default async function EditCustomerPage(props: PageProps<"/customers/[id]/edit">) {
  const { profile } = await requireRole(["super_admin", "manager", "staff"]);
  const canManageAccountLink = canAccess(profile.role, ["super_admin", "manager"]);

  const { id } = await props.params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const linkedAccountEmail = canManageAccountLink
    ? await getLinkedAccountEmail(customer.profile_id)
    : null;
  const action = updateCustomer.bind(null, customer.id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`Edit ${customer.first_name} ${customer.last_name}`}
        description="Update this customer's details."
      />
      <Card>
        <CardContent className="pt-6">
          <CustomerForm
            action={action}
            defaultValues={customer}
            submitLabel="Save Changes"
            canManageAccountLink={canManageAccountLink}
            linkedAccountEmail={linkedAccountEmail}
            customerId={customer.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
