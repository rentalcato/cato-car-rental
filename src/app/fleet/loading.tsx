import { Skeleton } from "@/components/ui/skeleton";

/** Shown while a Vehicle Details page's data is loading — mirrors that page's two-column shape so the layout doesn't jump once the real content arrives. */
export default function FleetVehicleLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Skeleton className="h-4 w-32" />

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          <Skeleton className="aspect-4/3 w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="space-y-5 lg:col-span-2">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
