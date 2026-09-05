import Link from "next/link";
import { Car, CalendarClock, MapPin, Sparkles, Wallet, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RentalStatusBadge } from "@/components/rentals/rental-status-badge";
import { MyBookingsTable } from "@/components/account/my-bookings-table";
import { getMyAccount, getMyBookings } from "@/lib/account/queries";
import { getPublicBusinessInfo } from "@/lib/marketing/queries";
import { formatCurrency, formatDate } from "@/lib/format";

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  emphasis,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-4.5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={emphasis ? "text-lg font-bold tabular-nums text-destructive" : "text-lg font-bold tabular-nums"}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AccountPage() {
  // AccountLayout already calls requireUser() — getMyAccount() can't
  // realistically return null here, but the type says it can.
  const [account, business] = await Promise.all([getMyAccount(), getPublicBusinessInfo()]);
  if (!account) return null;

  const { profile, customer } = account;
  const bookings = await getMyBookings(customer?.id);

  const firstName = (profile.full_name || "there").trim().split(/\s+/)[0];
  const currentTrip = bookings.find(
    (b) => b.rental_status === "active" || b.rental_status === "overdue"
  );
  const upcomingTrip = !currentTrip ? bookings.find((b) => b.rental_status === "reserved") : undefined;
  const highlightTrip = currentTrip ?? upcomingTrip;

  const openBookings = bookings.filter(
    (b) => b.rental_status === "active" || b.rental_status === "overdue" || b.rental_status === "reserved"
  );
  const balanceDue = openBookings.reduce((sum, b) => sum + (b.balance_due ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
          <p className="text-sm text-muted-foreground">
            {customer ? `Customer #${customer.customer_number}` : profile.email}
          </p>
        </div>
        <Button render={<Link href="/account/fleet" />}>
          <Car className="size-4" />
          Browse Fleet
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={CalendarClock} label="Open Bookings" value={String(openBookings.length)} />
        <StatCard icon={Car} label="Total Bookings" value={String(bookings.length)} />
        <StatCard
          icon={Wallet}
          label="Balance Due"
          value={formatCurrency(balanceDue)}
          emphasis={balanceDue > 0}
        />
      </div>

      {customer ? (
        <>
          {highlightTrip ? (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="mb-1 flex items-center gap-2 text-xs font-medium tracking-wide text-primary uppercase">
                    <MapPin className="size-3.5" />
                    {currentTrip ? "Current Trip" : "Upcoming Trip"}
                  </p>
                  <p className="text-lg font-semibold">
                    {highlightTrip.vehicle
                      ? [highlightTrip.vehicle.make, highlightTrip.vehicle.model].filter(Boolean).join(" ")
                      : "Vehicle"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(highlightTrip.rental_start_datetime)} –{" "}
                    {formatDate(highlightTrip.expected_return_datetime)}
                  </p>
                </div>
                <RentalStatusBadge status={highlightTrip.rental_status} />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 text-sm font-semibold">Your Details</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem label="Name" value={profile.full_name} />
                <DetailItem label="Email" value={profile.email} />
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
        <>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5">
              <p className="mb-1 flex items-center gap-2 text-xs font-medium tracking-wide text-primary uppercase">
                <Sparkles className="size-3.5" />
                Get set up to book
              </p>
              <p className="text-lg font-semibold">Your account isn&apos;t connected yet</p>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Once we connect your account to your customer record, this page fills in with
                your real bookings and balance. In the meantime, get in touch and we&apos;ll set
                it up —
                {business?.phone ? ` call ${business.phone}` : ""}
                {business?.phone && business?.email ? " or" : ""}
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
              <Button className="mt-4" render={<Link href="/account/fleet" />}>
                <Car className="size-4" />
                Browse the fleet meanwhile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 text-sm font-semibold">Profile</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem label="Name" value={profile.full_name} />
                <DetailItem label="Email" value={profile.email} />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
