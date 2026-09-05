import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VehicleStatusBadge } from "@/components/vehicles/status-badge";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { Vehicle } from "@/types/database.types";

export function VehicleTable({
  vehicles,
  canManage,
}: {
  vehicles: Vehicle[];
  canManage: boolean;
}) {
  if (vehicles.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          No vehicles match your filters.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop / tablet: real table */}
      <div className="hidden overflow-x-auto rounded-md border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>License Plate</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Daily Rate</TableHead>
              <TableHead className="text-right">Mileage</TableHead>
              {canManage ? <TableHead className="w-10" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id} className="cursor-default">
                <TableCell className="font-semibold">
                  <Link
                    href={`/vehicles/${vehicle.id}`}
                    className="hover:underline"
                  >
                    {vehicle.license_plate}
                  </Link>
                  {vehicle.archived_at ? (
                    <Badge variant="outline" className="ml-2 text-muted-foreground">
                      Archived
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "—"}
                </TableCell>
                <TableCell>
                  <VehicleStatusBadge status={vehicle.vehicle_status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrency(vehicle.daily_rental_rate)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(vehicle.current_mileage)}
                </TableCell>
                {canManage ? (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      render={<Link href={`/vehicles/${vehicle.id}/edit`} />}
                    >
                      <Pencil className="size-3.5" />
                      <span className="sr-only">Edit {vehicle.license_plate}</span>
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-3 sm:hidden">
        {vehicles.map((vehicle) => (
          <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`}>
            <Card>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-semibold">
                    {vehicle.license_plate}
                    {vehicle.archived_at ? (
                      <Badge variant="outline" className="text-muted-foreground">
                        Archived
                      </Badge>
                    ) : null}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "—"}
                  </p>
                  <p className="text-sm font-medium tabular-nums">
                    {formatCurrency(vehicle.daily_rental_rate)}
                    <span className="font-normal text-muted-foreground"> / day</span>
                  </p>
                </div>
                <VehicleStatusBadge status={vehicle.vehicle_status} className="shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
