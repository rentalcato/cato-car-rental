"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { setVehicleDisplayOrder, setVehicleFeatured } from "@/lib/settings/actions";
import type { WebsiteVehicleRow } from "@/lib/settings/queries";

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  rented: "Rented",
  maintenance: "Maintenance",
};

function FeaturedVehicleRow({ vehicle }: { vehicle: WebsiteVehicleRow }) {
  const [isPending, startTransition] = useTransition();
  const [order, setOrder] = useState(vehicle.website_display_order);
  const [error, setError] = useState<string | null>(null);

  function handleToggleFeatured() {
    setError(null);
    startTransition(async () => {
      const result = await setVehicleFeatured(vehicle.id, !vehicle.is_featured);
      if (result.error) setError(result.error);
    });
  }

  function handleOrderBlur() {
    if (order === vehicle.website_display_order) return;
    setError(null);
    startTransition(async () => {
      const result = await setVehicleDisplayOrder(vehicle.id, order);
      if (result.error) setError(result.error);
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        {vehicle.make} {vehicle.model}
        {vehicle.year ? <span className="text-muted-foreground"> ({vehicle.year})</span> : null}
      </TableCell>
      <TableCell className="text-muted-foreground">{vehicle.license_plate}</TableCell>
      <TableCell>
        <Badge variant={vehicle.vehicle_status === "available" ? "secondary" : "outline"}>
          {STATUS_LABELS[vehicle.vehicle_status] ?? vehicle.vehicle_status}
        </Badge>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          className="w-20"
          value={order}
          disabled={isPending}
          onChange={(e) => setOrder(Number(e.target.value))}
          onBlur={handleOrderBlur}
        />
      </TableCell>
      <TableCell>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 rounded border-input"
            checked={vehicle.is_featured}
            disabled={isPending}
            onChange={handleToggleFeatured}
          />
          Show on website
        </label>
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </TableCell>
    </TableRow>
  );
}

export function FeaturedVehiclesTable({ vehicles }: { vehicles: WebsiteVehicleRow[] }) {
  if (vehicles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No vehicles yet — add one under Vehicles first.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Choose which vehicles appear in the &ldquo;Explore Our Fleet&rdquo; section on the public
        homepage, and the order they appear in (lowest first). Only vehicles currently{" "}
        <strong>Available</strong> are ever shown publicly, regardless of this setting.
      </p>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Plate</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Website</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
              <FeaturedVehicleRow key={vehicle.id} vehicle={vehicle} />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
