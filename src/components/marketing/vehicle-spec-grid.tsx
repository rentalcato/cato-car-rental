import { Calendar, Cog, DoorOpen, Fuel, Palette, Tag, Users, type LucideIcon } from "lucide-react";

interface SpecItem {
  label: string;
  value: string;
  icon: LucideIcon;
}

/**
 * Only ever built from real vehicle_listings columns (plus doors, a
 * documented estimate — see lib/vehicles/details.ts) — no invented
 * engine/drivetrain/luggage figures the site can't actually back up.
 */
export function VehicleSpecGrid({ specs }: { specs: SpecItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {specs.map((spec) => (
        <div key={spec.label} className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <spec.icon className="size-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{spec.label}</p>
            <p className="truncate text-sm font-semibold">{spec.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export const SPEC_ICONS = { Users, DoorOpen, Cog, Fuel, Tag, Calendar, Palette };
export type { SpecItem };
