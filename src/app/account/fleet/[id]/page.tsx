import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BookingForm } from "@/components/account/booking-form";
import { FavoriteButton } from "@/components/account/favorite-button";
import { VehicleGallery } from "@/components/marketing/vehicle-gallery";
import { VehicleDetailHeader } from "@/components/marketing/vehicle-detail-header";
import { VehiclePricingSummary } from "@/components/marketing/vehicle-pricing-summary";
import { VehicleSpecGrid, type SpecItem, SPEC_ICONS } from "@/components/marketing/vehicle-spec-grid";
import { VehicleFeatures } from "@/components/marketing/vehicle-features";
import { VehicleRentalInfo } from "@/components/marketing/vehicle-rental-info";
import { VehicleContactActions } from "@/components/marketing/vehicle-contact-actions";
import { SimilarVehiclesSection } from "@/components/marketing/similar-vehicles-section";
import { getMyAccount } from "@/lib/account/queries";
import { getMyFavoriteVehicleIds } from "@/lib/favorites/queries";
import {
  getPublicBusinessInfo,
  getPublicRentalPolicy,
  getSimilarVehicles,
  getVehicleListingById,
} from "@/lib/marketing/queries";
import { computePricingTiers, getEstimatedDoors, getVehicleDescription, getVehicleFeatures } from "@/lib/vehicles/details";
import { FUEL_TYPE_LABELS } from "@/lib/vehicles/labels";

// AccountLayout already calls requireUser() for everything under /account.
// Reads the same anon/authenticated-readable public_vehicle_listings view
// as the public /fleet/[id] page (0012/0017) — booking access itself is
// gated by whether this account is linked to a customer record (0014),
// not by anything vehicle-related.
export default async function AccountFleetVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vehicle, account, business, policy] = await Promise.all([
    getVehicleListingById(id),
    getMyAccount(),
    getPublicBusinessInfo(),
    getPublicRentalPolicy(),
  ]);

  if (!vehicle) notFound();

  const [favoriteIds, similar] = await Promise.all([
    getMyFavoriteVehicleIds(account?.customer?.id),
    getSimilarVehicles(id, vehicle.category),
  ]);

  const pricing = computePricingTiers(vehicle.dailyRate);
  const features = getVehicleFeatures(vehicle);
  const description = getVehicleDescription(vehicle);
  const doors = getEstimatedDoors(vehicle.bodyType);
  const vehicleLabel = `${vehicle.make} ${vehicle.model}`.trim();

  const specs: SpecItem[] = [
    { label: "Seats", value: String(vehicle.seats), icon: SPEC_ICONS.Users },
    ...(doors ? [{ label: "Doors", value: String(doors), icon: SPEC_ICONS.DoorOpen }] : []),
    { label: "Transmission", value: vehicle.transmission, icon: SPEC_ICONS.Cog },
    { label: "Fuel Type", value: vehicle.fuelType ? FUEL_TYPE_LABELS[vehicle.fuelType] : "—", icon: SPEC_ICONS.Fuel },
    { label: "Vehicle Class", value: vehicle.category, icon: SPEC_ICONS.Tag },
    ...(vehicle.year ? [{ label: "Year", value: String(vehicle.year), icon: SPEC_ICONS.Calendar }] : []),
    ...(vehicle.colour ? [{ label: "Colour", value: vehicle.colour, icon: SPEC_ICONS.Palette }] : []),
  ];

  return (
    <div>
      <Link
        href="/account/fleet"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Vehicles
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-5">
        {/* Left column — vehicle information */}
        <div className="space-y-8 lg:col-span-3">
          <div className="relative">
            <VehicleGallery images={vehicle.imageUrls} alt={vehicleLabel} />
            <div className="absolute top-3 right-3 z-10">
              <FavoriteButton vehicleId={vehicle.id} initialFavorited={favoriteIds.has(vehicle.id)} />
            </div>
          </div>

          <VehicleDetailHeader vehicle={vehicle} />

          <section>
            <h2 className="mb-3 text-lg font-semibold">About This Vehicle</h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              {description.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Specifications</h2>
            <VehicleSpecGrid specs={specs} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Features &amp; Amenities</h2>
            <VehicleFeatures features={features} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">Rental Information</h2>
            <VehicleRentalInfo policy={policy} business={business} />
          </section>
        </div>

        {/* Right column — pricing, booking, contact */}
        <div className="lg:col-span-2">
          <div className="space-y-5 lg:sticky lg:top-6">
            <Card>
              <CardContent className="p-5">
                <VehiclePricingSummary pricing={pricing} deposit={policy?.default_security_deposit ?? null} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="mb-4 font-semibold">Reserve This Vehicle</h3>
                {account?.customer ? (
                  <BookingForm vehicleId={vehicle.id} dailyRate={vehicle.dailyRate} />
                ) : (
                  <div className="rounded-md border bg-muted/40 p-4">
                    <p className="text-sm font-medium">Your account isn&apos;t set up for booking yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Get in touch and we&apos;ll connect your account so you can book online —
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
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 font-semibold">Questions About This Vehicle?</h3>
                <VehicleContactActions business={business} contactHref="/account/support" vehicleLabel={vehicleLabel} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="mt-14">
        <SimilarVehiclesSection vehicles={similar} fleetHref="/account/fleet" cardHrefBase="/account/fleet" />
      </div>
    </div>
  );
}
