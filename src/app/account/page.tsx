import Link from "next/link";
import {
  Bell,
  Calendar,
  Car,
  CreditCard,
  Gift,
  LifeBuoy,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrentRentalCard } from "@/components/account/current-rental-card";
import { BookingConfirmedBanner } from "@/components/account/booking-confirmed-banner";
import { getMyAccount, getMyBookings } from "@/lib/account/queries";
import { getMyNotifications } from "@/lib/notifications/queries";
import { getRentalCheckin } from "@/lib/checkin/queries";
import { getVehiclePhotos } from "@/lib/vehicles/queries";
import { assignFallbackImage, getPublicBusinessInfo } from "@/lib/marketing/queries";
import { getCustomerPointsBalance } from "@/lib/loyalty/queries";
import { getNotificationVisual } from "@/lib/notifications/catalog";
import { formatCurrency } from "@/lib/format";

function StatCard({
  icon: Icon,
  label,
  value,
  emphasis,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  emphasis?: boolean;
  href?: string;
}) {
  const body = (
    <CardContent className="flex items-center gap-3 p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={emphasis ? "text-lg font-bold tabular-nums text-destructive" : "text-lg font-bold tabular-nums"}>
          {value}
        </p>
      </div>
    </CardContent>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        <Card className="transition-shadow hover:shadow-md">{body}</Card>
      </Link>
    );
  }
  return <Card>{body}</Card>;
}

function QuickAction({ icon: Icon, label, href }: { icon: LucideIcon; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="size-5" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

export default async function AccountPage(props: { searchParams: Promise<{ booked?: string }> }) {
  const { booked } = await props.searchParams;

  // AccountLayout already calls requireUser() — getMyAccount() can't
  // realistically return null here, but the type says it can.
  const [account, business] = await Promise.all([getMyAccount(), getPublicBusinessInfo()]);
  if (!account) return null;

  const { profile, customer } = account;
  const bookings = customer ? await getMyBookings(customer.id) : [];
  const notifications = await getMyNotifications(profile.id, 3);

  const firstName = (profile.full_name || "there").trim().split(/\s+/)[0];
  const currentTrip = bookings.find((b) => b.rental_status === "active" || b.rental_status === "overdue");
  const upcomingTrip = !currentTrip ? bookings.find((b) => b.rental_status === "reserved") : undefined;
  const highlightTrip = currentTrip ?? upcomingTrip;

  const [highlightImageUrl, highlightCheckin] = await Promise.all([
    highlightTrip
      ? getVehiclePhotos(highlightTrip.vehicle_id).then(
          (photos) => photos[0]?.url ?? assignFallbackImage(highlightTrip.vehicle_id)
        )
      : Promise.resolve(null),
    highlightTrip ? getRentalCheckin(highlightTrip.id) : Promise.resolve(null),
  ]);

  const openBookings = bookings.filter(
    (b) => b.rental_status === "active" || b.rental_status === "overdue" || b.rental_status === "reserved"
  );
  const balanceDue = openBookings.reduce((sum, b) => sum + (b.balance_due ?? 0), 0);
  const pointsBalance = await getCustomerPointsBalance(customer?.id);

  return (
    <div className="space-y-6">
      {booked === "1" ? <BookingConfirmedBanner /> : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
          <p className="text-sm text-muted-foreground">
            {customer ? `Customer #${customer.customer_number}` : profile.email}
          </p>
        </div>
        <Button render={<Link href="/account/fleet" />}>
          <Car className="size-4" />
          Book a Car
        </Button>
      </div>

      {customer ? (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={Calendar} label="Open Bookings" value={String(openBookings.length)} href="/account/rentals" />
            <StatCard icon={Car} label="Total Rentals" value={String(bookings.length)} href="/account/rentals" />
            <StatCard
              icon={Wallet}
              label="Balance Due"
              value={formatCurrency(balanceDue)}
              emphasis={balanceDue > 0}
              href="/account/payments"
            />
            <StatCard
              icon={Gift}
              label="Loyalty Points"
              value={String(pointsBalance)}
              href="/account/loyalty"
            />
          </div>

          {highlightTrip && highlightImageUrl ? (
            <CurrentRentalCard
              booking={highlightTrip}
              imageUrl={highlightImageUrl}
              isUpcoming={!currentTrip}
              businessAddress={business?.address ?? null}
              checkinCompleted={
                highlightTrip.rental_status === "reserved" || highlightTrip.rental_status === "active"
                  ? Boolean(highlightCheckin?.completed_at)
                  : null
              }
            />
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <Car className="size-8 text-muted-foreground" />
                <p className="font-medium">No active or upcoming rentals</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Ready for your next trip? Browse the fleet and request a reservation in a couple of minutes.
                </p>
                <Button className="mt-2" size="sm" render={<Link href="/account/fleet" />}>
                  Browse Fleet
                </Button>
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <QuickAction icon={Car} label="Book a Car" href="/account/fleet" />
              <QuickAction icon={Calendar} label="My Rentals" href="/account/rentals" />
              <QuickAction icon={CreditCard} label="Payments" href="/account/payments" />
              <QuickAction icon={LifeBuoy} label="Contact Support" href="/account/support" />
            </div>
          </div>

          {notifications.length > 0 ? (
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <Bell className="size-4" />
                    Recent Notifications
                  </h2>
                  <Link href="/account/notifications" className="text-sm font-medium text-primary hover:underline">
                    View all →
                  </Link>
                </div>
                <ul className="space-y-3">
                  {notifications.map((n) => {
                    const visual = getNotificationVisual(n.type);
                    const Icon = visual.icon;
                    return (
                      <li key={n.id} className="flex items-start gap-3">
                        <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${visual.accent}`}>
                          <Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{n.title}</p>
                          {n.body ? <p className="truncate text-xs text-muted-foreground">{n.body}</p> : null}
                        </div>
                        {!n.read_at ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" /> : null}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-5">
            <p className="mb-1 flex items-center gap-2 text-xs font-medium tracking-wide text-primary uppercase">
              <Sparkles className="size-3.5" />
              Get set up to book
            </p>
            <p className="text-lg font-semibold">Your account isn&apos;t connected yet</p>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Once we connect your account to your customer record, this dashboard fills in with
              your real bookings and balance. In the meantime, get in touch and we&apos;ll set it up
              {business?.phone ? (
                <>
                  {" "}
                  — call{" "}
                  <a href={`tel:${business.phone}`} className="font-medium underline underline-offset-2">
                    {business.phone}
                  </a>
                </>
              ) : (
                ""
              )}
              {business?.phone && business?.email ? " or email" : business?.email ? " — email" : ""}
              {business?.email ? (
                <>
                  {" "}
                  <a href={`mailto:${business.email}`} className="font-medium underline underline-offset-2">
                    {business.email}
                  </a>
                </>
              ) : (
                ""
              )}
              .
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button render={<Link href="/account/support" />}>Contact Us</Button>
              <Button variant="outline" render={<Link href="/account/fleet" />}>
                <Car className="size-4" />
                Browse the fleet meanwhile
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
