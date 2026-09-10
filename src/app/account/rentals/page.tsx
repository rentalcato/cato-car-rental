import { Car } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingCard } from "@/components/account/booking-card";
import { getMyAccount, getMyBookings } from "@/lib/account/queries";
import { getFirstPhotoUrlsByVehicleIds } from "@/lib/vehicles/queries";
import { assignFallbackImage, getPublicBusinessInfo } from "@/lib/marketing/queries";

const UPCOMING_STATUSES = new Set(["reserved", "active", "overdue"]);

export default async function MyRentalsPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await props.searchParams;
  const [account, business] = await Promise.all([getMyAccount(), getPublicBusinessInfo()]);
  const bookings = account?.customer ? await getMyBookings(account.customer.id) : [];

  const photoUrls = await getFirstPhotoUrlsByVehicleIds(bookings.map((b) => b.vehicle_id));
  const imageFor = (vehicleId: string) => photoUrls.get(vehicleId) ?? assignFallbackImage(vehicleId);

  const upcoming = bookings.filter((b) => UPCOMING_STATUSES.has(b.rental_status));
  const history = bookings.filter((b) => !UPCOMING_STATUSES.has(b.rental_status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Rentals</h1>
        <p className="text-sm text-muted-foreground">Your upcoming trips and past rental history, all in one place.</p>
      </div>

      <Tabs defaultValue={tab === "history" ? "history" : "upcoming"}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming &amp; Current ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="history">Rental History ({history.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4 space-y-4">
          {upcoming.length === 0 ? (
            <EmptyState message="You don't have any upcoming or current rentals." />
          ) : (
            upcoming.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                imageUrl={imageFor(booking.vehicle_id)}
                businessAddress={business?.address ?? null}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {history.length === 0 ? (
            <EmptyState message="No past rentals yet — your completed trips will show up here." />
          ) : (
            history.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                imageUrl={imageFor(booking.vehicle_id)}
                businessAddress={business?.address ?? null}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-14 text-center">
      <Car className="size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
