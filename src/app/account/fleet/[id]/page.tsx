import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Cog, Palette, Users } from "lucide-react";
import { BookingForm } from "@/components/account/booking-form";
import { getMyAccount } from "@/lib/account/queries";
import { getVehicleListingById, getPublicBusinessInfo } from "@/lib/marketing/queries";
import { formatCurrency } from "@/lib/format";

// AccountLayout already calls requireUser() for everything under /account.
// Reads the same anon/authenticated-readable public_vehicle_listings view
// as the public /fleet/[id] page (0012/0013) — booking access itself is
// gated by whether this account is linked to a customer record (0014),
// not by anything vehicle-related.
export default async function AccountFleetVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vehicle, account, business] = await Promise.all([
    getVehicleListingById(id),
    getMyAccount(),
    getPublicBusinessInfo(),
  ]);

  if (!vehicle) notFound();

  return (
    <div>
      <Link
        href="/account/fleet"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to fleet
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-muted">
          <Image
            src={vehicle.imageUrl}
            alt={`${vehicle.make} ${vehicle.model}`}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            priority
            className="object-cover"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground">{vehicle.category}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {vehicle.make} {vehicle.model}
          </h1>
          {vehicle.year ? <p className="mt-1 text-muted-foreground">{vehicle.year}</p> : null}

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="size-4" />
              {vehicle.seats} seats
            </span>
            <span className="flex items-center gap-1.5">
              <Cog className="size-4" />
              {vehicle.transmission}
            </span>
            {vehicle.colour ? (
              <span className="flex items-center gap-1.5">
                <Palette className="size-4" />
                {vehicle.colour}
              </span>
            ) : null}
          </div>

          <div className="mt-8 border-t pt-6">
            {vehicle.dailyRate !== null ? (
              <p className="mb-4 text-2xl font-semibold">
                {formatCurrency(vehicle.dailyRate)}
                <span className="text-sm font-normal text-muted-foreground"> / day</span>
              </p>
            ) : (
              <p className="mb-4 text-muted-foreground">Price on request</p>
            )}

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
                      <a
                        href={`mailto:${business.email}`}
                        className="font-medium underline underline-offset-2"
                      >
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
          </div>
        </div>
      </div>
    </div>
  );
}
