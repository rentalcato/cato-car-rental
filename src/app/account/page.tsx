import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MyBookingsTable } from "@/components/account/my-bookings-table";
import { getMyAccount, getMyBookings } from "@/lib/account/queries";
import { getPublicBusinessInfo } from "@/lib/marketing/queries";
import { ROLE_LABELS } from "@/lib/auth/roles";

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export default async function AccountPage() {
  // AccountLayout already calls requireUser() — getMyAccount() can't
  // realistically return null here, but the type says it can.
  const [account, business] = await Promise.all([getMyAccount(), getPublicBusinessInfo()]);
  if (!account) return null;

  const { profile, customer } = account;
  const bookings = await getMyBookings(customer?.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Account</h1>
        <p className="text-sm text-muted-foreground">{ROLE_LABELS[profile.role]}</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <p className="mb-3 text-sm font-semibold">Profile</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem label="Name" value={profile.full_name} />
            <DetailItem label="Email" value={profile.email} />
          </div>
        </CardContent>
      </Card>

      {customer ? (
        <>
          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 text-sm font-semibold">Your Details</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem label="Customer #" value={customer.customer_number} />
                <DetailItem label="Phone" value={customer.primary_phone} />
                <DetailItem label="Address" value={customer.address} />
                <DetailItem label="City / Parish" value={customer.city_parish} />
              </div>
            </CardContent>
          </Card>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Your Bookings</h2>
              <Link href="/account/fleet" className="text-sm font-medium text-primary hover:underline">
                Book another vehicle →
              </Link>
            </div>
            <MyBookingsTable bookings={bookings} />
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-semibold">No bookings linked yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your account isn&apos;t connected to a customer record yet, so there&apos;s no
              booking history to show here. Get in touch and we&apos;ll connect it —
              {business?.phone ? ` call ${business.phone}` : ""}
              {business?.phone && business?.email ? " or " : ""}
              {business?.email ? (
                <>
                  {" "}
                  email{" "}
                  <a href={`mailto:${business.email}`} className="font-medium underline underline-offset-2">
                    {business.email}
                  </a>
                </>
              ) : (
                ""
              )}
              {!business?.phone && !business?.email ? " contact us." : "."}
            </p>
            <Link
              href="/account/fleet"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              Browse our fleet →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
