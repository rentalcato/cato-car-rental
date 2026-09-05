import { Car, FileText, DollarSign, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/dal";
import { ROLE_LABELS } from "@/lib/auth/roles";

const KPI_CARDS = [
  { label: "Vehicles", icon: Car },
  { label: "Active Rentals", icon: FileText },
  { label: "Revenue (this month)", icon: DollarSign },
  { label: "Overdue Rentals", icon: AlertTriangle },
] as const;

export default async function DashboardPage() {
  const { profile } = await requireUser();

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${profile.full_name || "there"}`}
        description={`Signed in as ${ROLE_LABELS[profile.role]}.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map(({ label, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">
                Live data arrives in a later phase
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
