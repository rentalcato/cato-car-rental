import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown in place of {children} in DashboardLayout while any staff page's
 * data is loading — sidebar/topbar render immediately, only the main
 * content region suspends. Generic across every module (Vehicles,
 * Customers, Rentals, Reports, etc.).
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-full max-w-sm" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
