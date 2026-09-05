import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { CheckoutForm } from "@/components/rentals/checkout-form";
import { requireRole } from "@/lib/auth/dal";
import { canAccess } from "@/lib/auth/roles";
import { getCustomer } from "@/lib/customers/queries";
import { getAvailableVehicles } from "@/lib/rentals/queries";
import { getAppSettings } from "@/lib/settings/queries";

export default async function NewRentalPage(props: PageProps<"/rentals/new">) {
  const { profile } = await requireRole(["super_admin", "manager", "staff"]);
  const canOverrideBlacklist = canAccess(profile.role, ["super_admin", "manager"]);

  const searchParams = await props.searchParams;
  const customerId = typeof searchParams.customerId === "string" ? searchParams.customerId : null;

  const [initialCustomer, vehicles, settings] = await Promise.all([
    customerId ? getCustomer(customerId) : Promise.resolve(null),
    getAvailableVehicles(),
    getAppSettings(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="New Rental" description="Check out a vehicle to a customer." />
      <Card>
        <CardContent className="pt-6">
          <CheckoutForm
            initialCustomer={initialCustomer}
            vehicles={vehicles}
            canOverrideBlacklist={canOverrideBlacklist}
            defaultDeposit={settings.default_security_deposit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
