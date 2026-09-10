import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown in place of {children} in AccountLayout while any /account/*
 * page's data is loading — the sidebar/topbar chrome around it renders
 * immediately since only this segment suspends. Generic on purpose (a
 * heading + stat row + a couple of content blocks) since it covers every
 * page under /account, not just the dashboard.
 */
export default function AccountLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-28" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}
