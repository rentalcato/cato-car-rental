import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Camera, Clock, Gauge, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RentalStatusBadge, getCustomerFacingRentalLabel } from "@/components/rentals/rental-status-badge";
import { CancelBookingButton } from "@/components/account/cancel-booking-button";
import { CheckinForm } from "@/components/account/checkin-form";
import { AgreementList } from "@/components/account/agreement-list";
import { PrintButton } from "@/components/account/print-button";
import { CustomerPaymentHistoryTable } from "@/components/customers/customer-payment-history-table";
import { getMyAccount, getMyBookingById } from "@/lib/account/queries";
import { getRentalCheckin } from "@/lib/checkin/queries";
import { getCustomerDocuments } from "@/lib/customers/documents";
import { getPublicBusinessInfo, assignFallbackImage } from "@/lib/marketing/queries";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { ISSUE_PHOTO_BUCKET } from "@/lib/issues/queries";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [account, business] = await Promise.all([getMyAccount(), getPublicBusinessInfo()]);
  const customerId = account?.customer?.id;

  const booking = await getMyBookingById(customerId, id);
  if (!booking) notFound();

  const [checkin, documents] = await Promise.all([
    getRentalCheckin(booking.id),
    customerId ? getCustomerDocuments(customerId) : Promise.resolve([]),
  ]);
  const agreementDocuments = documents.filter(
    (doc) => doc.document_type === "rental_agreement" || doc.document_type === "signed_document"
  );

  const supabase = await createClient();
  const issuesWithPhotoUrl = await Promise.all(
    booking.issues.map(async (issue) => {
      if (!issue.photo_storage_path) return { ...issue, photoUrl: null as string | null };
      const { data } = await supabase.storage
        .from(ISSUE_PHOTO_BUCKET)
        .createSignedUrl(issue.photo_storage_path, 3600);
      return { ...issue, photoUrl: data?.signedUrl ?? null };
    })
  );

  const vehicleName = booking.vehicle ? [booking.vehicle.make, booking.vehicle.model].filter(Boolean).join(" ") : "Vehicle";
  const imageUrl = booking.photos[0]?.url ?? assignFallbackImage(booking.vehicle_id);
  const canCheckin = booking.rental_status === "reserved" || booking.rental_status === "active";
  const canCancel = booking.rental_status === "reserved";

  return (
    <div className="space-y-6">
      <Link
        href="/account/rentals"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to My Rentals
      </Link>

      <Card className="overflow-hidden py-0">
        <CardContent className="grid grid-cols-1 gap-0 p-0 md:grid-cols-5">
          <div className="relative aspect-4/3 md:col-span-2">
            <Image src={imageUrl} alt={vehicleName} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" priority />
          </div>
          <div className="flex flex-col gap-4 p-5 md:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h1 className="text-xl font-semibold">{vehicleName}</h1>
                <p className="text-xs text-muted-foreground">Booking #{booking.rental_number}</p>
              </div>
              <RentalStatusBadge
                status={booking.rental_status}
                label={getCustomerFacingRentalLabel(booking.rental_status, booking.approval_status)}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 border-t pt-4 text-sm sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Pickup</p>
                  <p className="font-medium">{formatDateTime(booking.rental_start_datetime)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Return</p>
                  <p className="font-medium">
                    {formatDateTime(booking.actual_return_datetime ?? booking.expected_return_datetime)}
                    {booking.actual_return_datetime ? " (actual)" : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-md bg-muted/50 p-3 text-center text-sm">
              <div>
                <p className="text-[11px] text-muted-foreground">Total</p>
                <p className="font-medium tabular-nums">{formatCurrency(booking.total_amount)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Paid</p>
                <p className="font-medium tabular-nums">{formatCurrency(booking.amount_paid)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Balance</p>
                <p className={`font-medium tabular-nums ${(booking.balance_due ?? 0) > 0 ? "text-destructive" : ""}`}>
                  {formatCurrency(booking.balance_due)}
                </p>
              </div>
            </div>

            {canCancel ? (
              <div className="mt-auto border-t pt-4">
                <CancelBookingButton rentalId={booking.id} />
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Pickup & Return */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Pickup &amp; Return Information</h2>
        <Card>
          <CardContent className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">Pickup &amp; return location</p>
                <p className="text-sm text-muted-foreground">{business?.address || "Contact us for location details"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">Opening hours</p>
                <p className="text-sm whitespace-pre-line text-muted-foreground">
                  {business?.business_hours || "Contact us to confirm hours"}
                </p>
              </div>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm font-medium">What to bring</p>
              <ul className="mt-1 list-inside list-disc text-sm text-muted-foreground">
                <li>A valid driver&apos;s license</li>
                <li>A government-issued photo ID or passport</li>
                <li>The card used for the security deposit, if applicable</li>
                <li>Please arrive on time — a short grace period applies for late pickup/return</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Digital Check-in */}
      {canCheckin ? (
        <section id="checkin" className="scroll-mt-20">
          <h2 className="mb-3 text-lg font-semibold">Digital Check-in</h2>
          <Card>
            <CardContent className="p-5">
              <CheckinForm rentalId={booking.id} checkin={checkin} />
            </CardContent>
          </Card>
        </section>
      ) : null}

      {/* Vehicle Condition */}
      {booking.rental_status === "active" ||
      booking.rental_status === "completed" ||
      booking.rental_status === "overdue" ? (
        <section id="condition" className="scroll-mt-20">
          <h2 className="mb-3 text-lg font-semibold">Vehicle Condition</h2>
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <div className="flex items-start gap-2">
                  <Gauge className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Checkout mileage</p>
                    <p className="font-medium">{booking.checkout_mileage ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Gauge className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Return mileage</p>
                    <p className="font-medium">{booking.return_mileage ?? "—"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fuel at checkout</p>
                  <p className="font-medium">{booking.checkout_fuel_level ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fuel at return</p>
                  <p className="font-medium">{booking.return_fuel_level ?? "—"}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="mb-2 text-sm font-medium">Inspection notes</p>
                {issuesWithPhotoUrl.length === 0 ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
                    No condition issues were reported for this rental.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {issuesWithPhotoUrl.map((issue) => (
                      <div key={issue.id} className="flex gap-3 rounded-md border p-3">
                        {issue.photoUrl ? (
                          <a href={issue.photoUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                            <div className="relative size-16 overflow-hidden rounded-md bg-muted">
                              <Image src={issue.photoUrl} alt="Reported condition" fill className="object-cover" />
                            </div>
                          </a>
                        ) : (
                          <div className="flex size-16 shrink-0 items-center justify-center rounded-md bg-muted">
                            <Camera className="size-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{issue.issue_type || "Condition note"}</p>
                            <Badge variant="outline" className="capitalize">
                              {issue.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{issue.description || "No further details."}</p>
                          <p className="text-xs text-muted-foreground">Reported {formatDate(issue.reported_date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {/* Rental Agreement */}
      <section id="agreement" className="scroll-mt-20">
        <h2 className="mb-3 text-lg font-semibold">Rental Agreement</h2>
        <Card>
          <CardContent className="p-5">
            <AgreementList documents={agreementDocuments} />
          </CardContent>
        </Card>
      </section>

      {/* Payments */}
      <section id="payments" className="scroll-mt-20">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Payments for This Booking</h2>
          <PrintButton />
        </div>
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-semibold tabular-nums">{formatCurrency(booking.total_amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="font-semibold tabular-nums">{formatCurrency(booking.amount_paid)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className="font-semibold tabular-nums">{formatCurrency(booking.balance_due)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Security deposit</p>
                <p className="font-semibold tabular-nums">{formatCurrency(booking.deposit_amount)}</p>
              </div>
            </div>
            <CustomerPaymentHistoryTable payments={booking.payments} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
