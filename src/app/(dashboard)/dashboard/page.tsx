import Link from "next/link";
import { Car, FileText, DollarSign, AlertTriangle, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/dal";
import { canAccess, ROLE_LABELS } from "@/lib/auth/roles";
import { getDashboardStats } from "@/lib/dashboard/queries";
import { formatCurrency } from "@/lib/format";

export default async function DashboardPage() {
  const { profile } = await requireUser();
  const canSeeRevenue = canAccess(profile.role, ["super_admin", "manager"]);

  const stats = await getDashboardStats();

  // Revenue is manager+ only everywhere else in the app (Reports page),
  // so it's kept out of a plain staff account's dashboard too — swapped
  // for Pending Reservations, an equally operational number staff can
  // act on (Accept/Deny, see the Reservations page) without it being
  // financial data.
  const kpiCards = [
    {
      label: "Vehicles",
      icon: Car,
      value: String(stats.fleetSize),
      caption: `${stats.availableVehicles} available`,
      href: "/vehicles",
    },
    {
      label: "Active Rentals",
      icon: FileText,
      value: String(stats.activeRentals),
      caption: "Currently out",
      href: "/rentals?status=active",
    },
    canSeeRevenue
      ? {
          label: "Revenue (this month)",
          icon: DollarSign,
          value: formatCurrency(stats.revenueThisMonth),
          caption: `${stats.paymentsThisMonthCount} payment${stats.paymentsThisMonthCount === 1 ? "" : "s"} recorded`,
          href: "/reports",
        }
      : {
          label: "Pending Reservations",
          icon: CalendarClock,
          value: String(stats.pendingReservations),
          caption: stats.pendingReservations > 0 ? "Awaiting your review" : "None waiting",
          href: "/reservations",
        },
    {
      label: "Overdue Rentals",
      icon: AlertTriangle,
      value: String(stats.overdueRentals),
      caption: stats.overdueRentals > 0 ? "Needs attention" : "None overdue",
      href: "/rentals?status=overdue",
      emphasis: stats.overdueRentals > 0,
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${profile.full_name || "there"}`}
        description={`Signed in as ${ROLE_LABELS[profile.role]}.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(({ label, icon: Icon, value, caption, href, emphasis }) => (
          <Link key={label} href={href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {label}
                </CardTitle>
                <Icon className={emphasis ? "size-4 text-destructive" : "size-4 text-muted-foreground"} />
              </CardHeader>
              <CardContent>
                <div className={emphasis ? "text-2xl font-bold text-destructive" : "text-2xl font-bold"}>
                  {value}
                </div>
                <p className="text-xs text-muted-foreground">{caption}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
