"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAINTENANCE_TYPES } from "@/lib/constants";
import { recordMaintenance, type MaintenanceActionState } from "@/lib/maintenance/actions";
import type { Vehicle } from "@/types/database.types";

const initialState: MaintenanceActionState = {};

const MAINTENANCE_TYPE_LABELS: Record<(typeof MAINTENANCE_TYPES)[number], string> = {
  oil_service: "Oil Service",
  tyres: "Tyres",
  brakes: "Brakes",
  engine: "Engine",
  transmission: "Transmission",
  suspension: "Suspension",
  electrical: "Electrical",
  bodywork: "Bodywork",
  air_conditioning: "Air Conditioning",
  inspection: "Inspection",
  other: "Other",
};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}

export function MaintenanceForm({
  vehicles,
  defaultVehicleId,
}: {
  vehicles: Vehicle[];
  defaultVehicleId?: string;
}) {
  const [state, formAction, pending] = useActionState(recordMaintenance, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6" noValidate encType="multipart/form-data">
      {state.error ? (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vehicle_id">Vehicle</Label>
          <Select name="vehicle_id" defaultValue={defaultVehicleId}>
            <SelectTrigger id="vehicle_id" className="w-full">
              <SelectValue placeholder="Select a vehicle" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.license_plate} — {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={errors.vehicle_id} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maintenance_type">Maintenance type</Label>
          <Select name="maintenance_type" defaultValue={MAINTENANCE_TYPES[0]}>
            <SelectTrigger id="maintenance_type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MAINTENANCE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {MAINTENANCE_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={errors.maintenance_type} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="service_date">Service date</Label>
          <Input id="service_date" name="service_date" type="date" />
          <FieldError errors={errors.service_date} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="next_service_date">Next service date</Label>
          <Input id="next_service_date" name="next_service_date" type="date" />
          <FieldError errors={errors.next_service_date} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mileage_at_service">Mileage at service</Label>
          <Input id="mileage_at_service" name="mileage_at_service" type="number" min={0} />
          <FieldError errors={errors.mileage_at_service} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="next_service_mileage">Next service mileage</Label>
          <Input id="next_service_mileage" name="next_service_mileage" type="number" min={0} />
          <FieldError errors={errors.next_service_mileage} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cost">Cost (JMD)</Label>
          <Input id="cost" name="cost" type="number" min={0} step="0.01" />
          <FieldError errors={errors.cost} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="service_provider">Mechanic / garage</Label>
          <Input id="service_provider" name="service_provider" />
          <FieldError errors={errors.service_provider} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="receipt">Receipt / document</Label>
          <input
            id="receipt"
            name="receipt"
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent text-sm file:mr-3 file:h-full file:border-0 file:bg-secondary file:px-2.5 file:text-sm file:font-medium file:text-secondary-foreground"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={2} />
        <FieldError errors={errors.description} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={2} />
        <FieldError errors={errors.notes} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="send_to_maintenance" className="size-4 rounded border-input" />
        Send this vehicle to maintenance now
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Record Maintenance"}
        </Button>
      </div>
    </form>
  );
}
