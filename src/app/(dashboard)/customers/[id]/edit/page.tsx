import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { requireRole } from "@/lib/auth/dal";
import { getCustomer } from "@/lib/customers/queries";
import { updateCustomer } from "@/lib/customers/actions";

export default async function EditCustomerPage(props: PageProps<"/customers/[id]/edit">) {
  await requireRole(["super_admin", "manager", "staff"]);

  const { id } = await props.params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const action = updateCustomer.bind(null, customer.id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`Edit ${customer.first_name} ${customer.last_name}`}
        description="Update this customer's details."
      />
      <Card>
        <CardContent className="pt-6">
          <CustomerForm action={action} defaultValues={customer} submitLabel="Save Changes" />
        </CardContent>
      </Card>
    </div>
  );
}
