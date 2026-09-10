import { CheckCircle2 } from "lucide-react";
import type { VehicleFeature } from "@/lib/vehicles/details";

/** Only ever renders features assigned to this specific vehicle — see getVehicleFeatures(). */
export function VehicleFeatures({ features }: { features: VehicleFeature[] }) {
  if (features.length === 0) {
    return <p className="text-sm text-muted-foreground">Feature details for this vehicle aren&apos;t listed yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
      {features.map((feature) => (
        <div key={feature.key} className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="size-4 shrink-0 text-primary" />
          <span>{feature.label}</span>
        </div>
      ))}
    </div>
  );
}
