import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, ShieldAlert, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleStatusBadge } from "@/components/vehicles/status-badge";
import { DailyRateDialog } from "@/components/vehicles/daily-rate-dialog";
import { ArchiveVehicleDialog } from "@/components/vehicles/archive-vehicle-dialog";
import { ReturnToServiceButton } from "@/components/vehicles/return-to-service-button";
import { PhotoGallery } from "@/components/vehicles/photo-gallery";
import { CurrentRenterCard } from "@/components/vehicles/current-renter-card";
import { UpcomingReservationCard } from "@/components/vehicles/upcoming-reservation-card";
import { RentalHistoryTable } from "@/components/vehicles/rental-history-table";
import { MaintenanceHistoryTable } from "@/components/vehicles/maintenance-history-table";
import { IssueHistoryTable } from "@/components/vehicles/issue-history-table";
import { requireRole } from "@/lib/auth/dal";
import { canAccess } from "@/lib/auth/roles";
import { getVehicleProfile } from "@/lib/vehicles/queries";
import { BODY_TYPE_LABELS, FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/lib/vehicles/labels";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export default async function VehicleProfilePage(props: PageProps<"/vehicles/[id]">) {
  const { profile } = await requireRole(["super_admin", "manager", "staff"]);
  const canManage = canAccess(profile.role, ["super_admin", "manager"]);

  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const photoError = searchParams.photoError === "1";
  const data = await getVehicleProfile(id);
  if (!data) notFound();

  const {
    vehicle,
    photos,
    currentRental,
    pendingReservation,
    totalRentals,
    lifetimeRevenue,
    rentalHistory,
    maintenanceHistory,
    issueHistory,
  } = data;

  return (
    <div>
      {photoError ? (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Vehicle saved, but the photo you added couldn&apos;t be uploaded. Try again from the
          Photos tab below.
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{vehicle.license_plate}</h1>
            <VehicleStatusBadge status={vehicle.vehicle_status} />
            {vehicle.archived_at ? <Badge variant="outline">Archived</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
              "No make/model on file"}
          </p>
        </div>

        {canManage ? (
          <div className="flex flex-wrap items-start gap-2">
            <DailyRateDialog vehicleId={vehicle.id} currentRate={vehicle.daily_rental_rate} />
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/maintenance/new?vehicleId=${vehicle.id}`} />}
            >
              <Wrench className="size-3.5" />
              Record Maintenance
            </Button>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/maintenance/report-damage?vehicleId=${vehicle.id}`} />}
            >
              <ShieldAlert className="size-3.5" />
              Report Damage
            </Button>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/vehicles/${vehicle.id}/edit`} />}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
            <ArchiveVehicleDialog
              vehicleId={vehicle.id}
              licensePlate={vehicle.license_plate}
              isArchived={Boolean(vehicle.archived_at)}
            />
            {vehicle.vehicle_status === "maintenance" || vehicle.vehicle_status === "damaged" ? (
              <ReturnToServiceButton vehicleId={vehicle.id} />
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Rentals</p>
            <p className="text-2xl font-bold tabular-nums">{totalRentals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Lifetime Rental Revenue</p>
            <p className="text-2xl font-bold tabular-nums">{formatCurrency(lifetimeRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 space-y-3">
        <CurrentRenterCard rental={currentRental} />
        {pendingReservation ? <UpcomingReservationCard reservation={pendingReservation} /> : null}
      </div>

      <Tabs defaultValue={photoError ? "photos" : "overview"}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="photos">Photos ({photos.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 md:grid-cols-3">
              <DetailItem label="Colour" value={vehicle.colour} />
              <DetailItem label="VIN / Chassis Number" value={vehicle.vin} />
              <DetailItem label="Fuel Type" value={vehicle.fuel_type ? FUEL_TYPE_LABELS[vehicle.fuel_type] : null} />
              <DetailItem label="Seats" value={vehicle.seats ? String(vehicle.seats) : null} />
              <DetailItem
                label="Transmission"
                value={vehicle.transmission ? TRANSMISSION_LABELS[vehicle.transmission] : null}
              />
              <DetailItem label="Body Type" value={vehicle.body_type ? BODY_TYPE_LABELS[vehicle.body_type] : null} />
              <DetailItem label="Current Mileage" value={formatNumber(vehicle.current_mileage)} />
              <DetailItem label="Date Added" value={formatDate(vehicle.date_added)} />
              <DetailItem label="Daily Rate" value={formatCurrency(vehicle.daily_rental_rate)} />
            </CardContent>
          </Card>
          {vehicle.notes ? (
            <Card>
              <CardContent className="pt-6">
                <p className="mb-1 text-sm font-medium">Notes</p>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {vehicle.notes}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="photos">
          <PhotoGallery vehicleId={vehicle.id} photos={photos} canManage={canManage} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Rental History</h3>
            <RentalHistoryTable rentals={rentalHistory} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Maintenance History</h3>
            <MaintenanceHistoryTable records={maintenanceHistory} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Issue / Damage History</h3>
            <IssueHistoryTable issues={issueHistory} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
