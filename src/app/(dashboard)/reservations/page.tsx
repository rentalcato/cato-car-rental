import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { ReservationTable } from "@/components/reservations/reservation-table";
import { requireRole } from "@/lib/auth/dal";
import { canAccess } from "@/lib/auth/roles";
import { listReservations } from "@/lib/reservations/queries";

export default async function ReservationsPage() {
  const { profile } = await requireRole(["super_admin", "manager", "staff"]);
  const canOverrideBlacklist = canAccess(profile.role, ["super_admin", "manager"]);

  const reservations = await listReservations();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <PageHeader title="Reservations" description="Upcoming bookings before check-out." />
        <Button render={<Link href="/reservations/new" />}>
          <Plus className="size-4" />
          New Reservation
        </Button>
      </div>

      <ReservationTable reservations={reservations} canOverrideBlacklist={canOverrideBlacklist} />
    </div>
  );
}
