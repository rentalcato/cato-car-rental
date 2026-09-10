import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CalendarClock, Pencil, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import { CustomerStatusDialog } from "@/components/customers/customer-status-dialog";
import { CustomerWarningBanner } from "@/components/customers/customer-warning-banner";
import { CustomerPhotoUploader } from "@/components/customers/customer-photo-uploader";
import { CustomerAccountLink } from "@/components/customers/customer-account-link";
import { CustomerDocumentsPanel } from "@/components/customers/customer-documents-panel";
import { CustomerRentalHistoryTable } from "@/components/customers/customer-rental-history-table";
import { CustomerFinancialSummary } from "@/components/customers/customer-financial-summary";
import { CustomerPaymentHistoryTable } from "@/components/customers/customer-payment-history-table";
import { CustomerIncidentHistoryTable } from "@/components/customers/customer-incident-history-table";
import { GrantPointsPanel } from "@/components/customers/grant-points-panel";
import { CompleteRentalDialog } from "@/components/rentals/complete-rental-dialog";
import { requireRole } from "@/lib/auth/dal";
import { canAccess } from "@/lib/auth/roles";
import { getCustomerProfile } from "@/lib/customers/queries";
import { getActiveEarningRules, getCustomerPointHistory, getCustomerPointsBalance } from "@/lib/loyalty/queries";
import { formatCurrency, formatDate } from "@/lib/format";

function DetailItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

function isLicenseExpired(expiry: string | null): boolean {
  if (!expiry) return false;
  return new Date(expiry).getTime() < Date.now();
}

export default async function CustomerProfilePage(props: PageProps<"/customers/[id]">) {
  const { profile } = await requireRole(["super_admin", "manager", "staff"]);
  const canManageStatus = canAccess(profile.role, ["super_admin", "manager"]);

  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const linkWarning = searchParams.linkWarning === "1";
  const docWarning = searchParams.docWarning === "1";
  const data = await getCustomerProfile(id);
  if (!data) notFound();

  const [pointsBalance, pointHistory, earningRules] = await Promise.all([
    getCustomerPointsBalance(data.customer.id),
    getCustomerPointHistory(data.customer.id),
    getActiveEarningRules(),
  ]);

  const {
    customer,
    linkedAccount,
    photoUrl,
    documents,
    currentRental,
    rentalHistory,
    vehiclesRented,
    totalRentals,
    lifetimeSpend,
    balanceOutstanding,
    depositsHeld,
    paymentHistory,
    incidentHistory,
  } = data;

  const fullName = [customer.first_name, customer.middle_name, customer.last_name]
    .filter(Boolean)
    .join(" ");
  const licenseExpired = isLicenseExpired(customer.drivers_license_expiry);

  return (
    <div>
      {linkWarning ? (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Customer saved, but no website account was found with that email — double check it, or
          confirm they&apos;ve signed up yet. You can try again from the Website Account box in
          the Overview tab below.
        </div>
      ) : null}

      {docWarning ? (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Customer saved, but one or more documents couldn&apos;t be uploaded — try again from the
          Documents tab below.
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <CustomerPhotoUploader customerId={customer.id} photoUrl={photoUrl} canUpload />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{fullName}</h1>
              <CustomerStatusBadge status={customer.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {customer.customer_number} ·{" "}
              {[customer.email, customer.primary_phone].filter(Boolean).join(" · ") ||
                "No contact info on file"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            render={<Link href={`/rentals/new?customerId=${customer.id}`} />}
          >
            <Plus className="size-3.5" />
            New Rental
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/reservations/new?customerId=${customer.id}`} />}
          >
            <CalendarClock className="size-3.5" />
            New Reservation
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/customers/${customer.id}/edit`} />}
          >
            <Pencil className="size-3.5" />
            Edit
          </Button>
          {canManageStatus ? (
            <CustomerStatusDialog customerId={customer.id} currentStatus={customer.status} />
          ) : null}
        </div>
      </div>

      {customer.status !== "active" ? (
        <div className="mb-6">
          <CustomerWarningBanner status={customer.status} />
        </div>
      ) : null}

      <div className="mb-6">
        <CustomerFinancialSummary
          balanceOutstanding={balanceOutstanding}
          lifetimeSpend={lifetimeSpend}
          depositsHeld={depositsHeld}
        />
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="rentals">Rentals ({totalRentals})</TabsTrigger>
          <TabsTrigger value="financial">Payments</TabsTrigger>
          <TabsTrigger value="incidents">Incidents ({incidentHistory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {canManageStatus ? (
            <Card>
              <CardContent className="pt-6">
                <p className="mb-3 text-sm font-semibold">Website Account</p>
                <CustomerAccountLink customerId={customer.id} linkedAccount={linkedAccount} />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 text-sm font-semibold">Personal Information</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <DetailItem label="Date of Birth" value={formatDate(customer.date_of_birth)} />
                <DetailItem label="Gender" value={customer.gender} />
                <DetailItem label="Customer ID" value={customer.customer_number} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 text-sm font-semibold">Contact Information</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <DetailItem label="Email" value={customer.email} />
                <DetailItem label="Primary Phone" value={customer.primary_phone} />
                <DetailItem label="Secondary Phone" value={customer.secondary_phone} />
                <DetailItem label="Address" value={customer.address} />
                <DetailItem label="City / Parish" value={customer.city_parish} />
                <DetailItem label="Country" value={customer.country} />
                <DetailItem label="Emergency Contact" value={customer.emergency_contact_name} />
                <DetailItem
                  label="Emergency Contact Phone"
                  value={customer.emergency_contact_phone}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="mb-3 text-sm font-semibold">Driver&apos;s License &amp; Identification</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                <DetailItem label="License Number" value={customer.drivers_license_number} />
                <DetailItem
                  label="Issuing Country"
                  value={customer.drivers_license_issuing_country}
                />
                <DetailItem
                  label="Issue Date"
                  value={formatDate(customer.drivers_license_issue_date)}
                />
                <div>
                  <p className="text-xs text-muted-foreground">Expiry Date</p>
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    {formatDate(customer.drivers_license_expiry) || "—"}
                    {licenseExpired ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="size-3" />
                        Expired
                      </Badge>
                    ) : null}
                  </p>
                </div>
                <DetailItem label="ID Type" value={customer.identification_type} />
                <DetailItem label="ID Number" value={customer.identification_number} />
                <DetailItem label="Passport Number" value={customer.passport_number} />
              </div>
            </CardContent>
          </Card>

          {customer.notes ? (
            <Card>
              <CardContent className="pt-6">
                <p className="mb-1 text-sm font-medium">Notes</p>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {customer.notes}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="documents">
          <CustomerDocumentsPanel customerId={customer.id} documents={documents} canDelete={canManageStatus} />
        </TabsContent>

        <TabsContent value="rentals" className="space-y-6">
          {currentRental ? (
            <Card>
              <CardContent className="pt-6">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Current Rental</p>
                  <CompleteRentalDialog
                    rentalId={currentRental.id}
                    vehicleId={currentRental.vehicle_id}
                    customerId={customer.id}
                    rentalNumber={currentRental.rental_number}
                    checkoutMileage={currentRental.checkout_mileage}
                    balanceDue={currentRental.balance_due}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <DetailItem label="Rental #" value={currentRental.rental_number} />
                  <DetailItem
                    label="Vehicle"
                    value={
                      currentRental.vehicle
                        ? `${currentRental.vehicle.license_plate} — ${[currentRental.vehicle.make, currentRental.vehicle.model].filter(Boolean).join(" ")}`
                        : "—"
                    }
                  />
                  <DetailItem label="Expected Return" value={formatDate(currentRental.expected_return_datetime)} />
                  <DetailItem label="Balance Due" value={formatCurrency(currentRental.balance_due)} />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {vehiclesRented.length > 0 ? (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Vehicles Previously Rented</h3>
              <div className="flex flex-wrap gap-2">
                {vehiclesRented.map((vehicle) => (
                  <Link key={vehicle.vehicleId} href={`/vehicles/${vehicle.vehicleId}`}>
                    <Badge variant="outline" className="hover:bg-accent">
                      {vehicle.licensePlate}
                      {vehicle.make ? ` — ${vehicle.make} ${vehicle.model ?? ""}`.trimEnd() : ""}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <h3 className="mb-2 text-sm font-semibold">Rental History</h3>
            <CustomerRentalHistoryTable rentals={rentalHistory} />
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Payment History</h3>
            <CustomerPaymentHistoryTable payments={paymentHistory} />
          </div>
          <GrantPointsPanel
            customerId={customer.id}
            balance={pointsBalance}
            rules={earningRules}
            recentHistory={pointHistory.slice(0, 8)}
          />
        </TabsContent>

        <TabsContent value="incidents">
          <CustomerIncidentHistoryTable incidents={incidentHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
