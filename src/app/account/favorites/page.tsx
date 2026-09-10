import Link from "next/link";
import Image from "next/image";
import { Heart, Users, Cog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteButton } from "@/components/account/favorite-button";
import { getMyAccount } from "@/lib/account/queries";
import { getMyFavoriteVehicles } from "@/lib/favorites/queries";
import { formatCurrency } from "@/lib/format";

export default async function FavoritesPage() {
  const account = await getMyAccount();
  const favorites = account?.customer ? await getMyFavoriteVehicles(account.customer.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
        <p className="text-sm text-muted-foreground">Vehicles you&apos;ve saved for next time.</p>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Heart className="size-8 text-muted-foreground" />
          <p className="font-medium">No favorites yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Tap the heart on any vehicle in the fleet to save it here for quick access.
          </p>
          <Button size="sm" render={<Link href="/account/fleet" />}>
            Browse Fleet
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((vehicle) => (
            <Card key={vehicle.favoriteId} className="overflow-hidden py-0">
              <div className="relative aspect-4/3 overflow-hidden bg-muted">
                <Image
                  src={vehicle.imageUrl}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
                <Badge variant="secondary" className="absolute top-3 left-3 shadow-sm">
                  {vehicle.category}
                </Badge>
                <div className="absolute top-2 right-2">
                  <FavoriteButton vehicleId={vehicle.vehicleId} initialFavorited />
                </div>
                {!vehicle.isBookable ? (
                  <Badge variant="outline" className="absolute bottom-3 left-3 bg-background/90 shadow-sm">
                    Not currently available
                  </Badge>
                ) : null}
              </div>

              <CardContent className="space-y-3 p-4">
                <div>
                  <h3 className="font-semibold">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  {vehicle.year ? <p className="text-xs text-muted-foreground">{vehicle.year}</p> : null}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" />
                    {vehicle.seats} seats
                  </span>
                  <span className="flex items-center gap-1">
                    <Cog className="size-3.5" />
                    {vehicle.transmission}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 border-t pt-3">
                  {vehicle.dailyRate !== null ? (
                    <span>
                      <span className="text-lg font-semibold">{formatCurrency(vehicle.dailyRate)}</span>
                      <span className="text-xs text-muted-foreground"> / day</span>
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Price on request</span>
                  )}
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" render={<Link href={`/account/fleet/${vehicle.vehicleId}`} />}>
                      Details
                    </Button>
                    {vehicle.isBookable ? (
                      <Button size="sm" render={<Link href={`/account/fleet/${vehicle.vehicleId}`} />}>
                        Book Now
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
