import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Cog, Palette, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getVehicleListingById } from "@/lib/marketing/queries";
import { formatCurrency } from "@/lib/format";

// Public — no auth required. See src/lib/supabase/proxy.ts's PUBLIC_PATHS.
// Reads only the anon-readable public_vehicle_listings view (0012/0013),
// never the internal vehicles table — no license plate/VIN/mileage here.
export default async function FleetVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await getVehicleListingById(id);

  if (!vehicle) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/#fleet"
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
              <p className="text-2xl font-semibold">
                {formatCurrency(vehicle.dailyRate)}
                <span className="text-sm font-normal text-muted-foreground"> / day</span>
              </p>
            ) : (
              <p className="text-muted-foreground">Price on request</p>
            )}

            <Button size="lg" className="mt-4 w-full sm:w-auto" render={<Link href="/login" />}>
              Reserve This Vehicle
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Sign in to start a reservation, or{" "}
              <Link href="/signup" className="font-medium underline underline-offset-2">
                create an account
              </Link>{" "}
              first.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
