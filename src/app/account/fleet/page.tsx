import { AccountFleetBrowser } from "@/components/account/account-fleet-browser";
import { getMyAccount } from "@/lib/account/queries";
import { getMyFavoriteVehicleIds } from "@/lib/favorites/queries";
import { getBookableVehicles } from "@/lib/marketing/queries";

// AccountLayout already calls requireUser(). Same catalog as the public
// homepage's fleet showcase (public_vehicle_listings, 0012/0013), just
// unlimited and demo-free — a real booking screen, not a marketing one.
// Search/category/sort are applied client-side (see AccountFleetBrowser)
// against this one fetch, same approach as the homepage showcase.
export default async function AccountFleetPage() {
  const [vehicles, account] = await Promise.all([getBookableVehicles(), getMyAccount()]);
  const favoriteIds = await getMyFavoriteVehicleIds(account?.customer?.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Browse Fleet</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a vehicle to see details and request a reservation.
      </p>

      <div className="mt-4">
        <AccountFleetBrowser vehicles={vehicles} favoriteIds={favoriteIds} />
      </div>
    </div>
  );
}
