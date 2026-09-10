import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { VehicleGallery } from "@/components/marketing/vehicle-gallery";
import { VehicleDetailHeader } from "@/components/marketing/vehicle-detail-header";
import { VehiclePricingSummary } from "@/components/marketing/vehicle-pricing-summary";
import { VehicleSpecGrid, type SpecItem, SPEC_ICONS } from "@/components/marketing/vehicle-spec-grid";
import { VehicleFeatures } from "@/components/marketing/vehicle-features";
import { VehicleRentalInfo } from "@/components/marketing/vehicle-rental-info";
import { VehicleContactActions } from "@/components/marketing/vehicle-contact-actions";
import { PublicBookingEstimator } from "@/components/marketing/public-booking-estimator";
import { SimilarVehiclesSection } from "@/components/marketing/similar-vehicles-section";
import {
  getPublicBusinessInfo,
  getPublicRentalPolicy,
  getSimilarVehicles,
  getVehicleListingById,
} from "@/lib/marketing/queries";
import { computePricingTiers, getEstimatedDoors, getVehicleDescription, getVehicleFeatures } from "@/lib/vehicles/details";
import { FUEL_TYPE_LABELS } from "@/lib/vehicles/labels";

// Public — no auth required. See src/lib/supabase/proxy.ts's PUBLIC_PATHS.
// Reads only the anon-readable public_vehicle_listings/public_rental_policy
// views (0012/0017/0023), never the internal vehicles table — no license
// plate/VIN/mileage here.
export default async function FleetVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vehicle, business, policy] = await Promise.all([
    getVehicleListingById(id),
    getPublicBusinessInfo(),
    getPublicRentalPolicy(),
  ]);

  if (!vehicle) notFound();

  const similar = await getSimilarVehicles(id, vehicle.category);
  const pricing = computePricingTiers(vehicle.dailyRate);
  const features = getVehicleFeatures(vehicle);
  const description = getVehicleDescription(vehicle);
  const doors = getEstimatedDoors(vehicle.bodyType);

  const specs: SpecItem[] = [
    { label: "Seats", value: String(vehicle.seats), icon: SPEC_ICONS.Users },
    ...(doors ? [{ label: "Doors", value: String(doors), icon: SPEC_ICONS.DoorOpen }] : []),
    { label: "Transmission", value: vehicle.transmission, icon: SPEC_ICONS.Cog },
    { label: "Fuel Type", value: vehicle.fuelType ? FUEL_TYPE_LABELS[vehicle.fuelType] : "—", icon: SPEC_ICONS.Fuel },
    { label: "Vehicle Class", value: vehicle.category, icon: SPEC_ICONS.Tag },
    ...(vehicle.year ? [{ label: "Year", value: String(vehicle.year), icon: SPEC_ICONS.Calendar }] : []),
    ...(vehicle.colour ? [{ label: "Colour", value: vehicle.colour, icon: SPEC_ICONS.Palette }] : []),
  ];

  const vehicleLabel = `${vehicle.make} ${vehicle.model}`.trim();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href="/#fleet"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Vehicles
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-5">
        {/* Left column — vehicle information */}
        <div className="space-y-8 lg:col-span-3">
          <VehicleGallery images={vehicle.imageUrls} alt={vehicleLabel} />
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
                <PublicBookingEstimator
                  vehicleId={vehicle.id}
                  dailyRate={vehicle.dailyRate}
                  deposit={policy?.default_security_deposit ?? null}
                  location={business?.address ?? null}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="mb-3 font-semibold">Questions About This Vehicle?</h3>
                <VehicleContactActions business={business} contactHref="/#contact" vehicleLabel={vehicleLabel} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="mt-14">
        <SimilarVehiclesSection vehicles={similar} fleetHref="/#fleet" cardHrefBase="/fleet" />
      </div>
    </div>
  );
}
