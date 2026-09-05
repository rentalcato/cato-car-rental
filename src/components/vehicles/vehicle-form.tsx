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
import { FUEL_TYPES, VEHICLE_STATUSES } from "@/lib/constants";
import { VEHICLE_STATUS_CONFIG } from "@/components/vehicles/status-badge";
import type { VehicleActionState } from "@/lib/vehicles/actions";
import type { Vehicle } from "@/types/database.types";

const FUEL_TYPE_LABELS: Record<(typeof FUEL_TYPES)[number], string> = {
  gasoline: "Gasoline",
  diesel: "Diesel",
  hybrid: "Hybrid",
  electric: "Electric",
  other: "Other",
};

const initialState: VehicleActionState = {};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}

export function VehicleForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: VehicleActionState, formData: FormData) => Promise<VehicleActionState>;
  defaultValues?: Partial<Vehicle>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};
  // Whatever was just submitted (and rejected) wins over the original
  // defaultValues, so a failed attempt redisplays what you typed instead
  // of resetting the form.
  const values = state.values;
  // Only the Add Vehicle form (no id yet) offers a photo picker here —
  // an existing vehicle already has its own Photos panel on its profile.
  const isCreate = !defaultValues?.id;
  function field(name: keyof Vehicle): string | number {
    if (values?.[name] !== undefined) return values[name];
    const dv = defaultValues?.[name];
    return dv === null || dv === undefined ? "" : (dv as string | number);
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.error ? (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="license_plate">License plate *</Label>
          <Input
            id="license_plate"
            name="license_plate"
            defaultValue={field("license_plate")}
            required
            maxLength={20}
            placeholder="e.g. AB 1234"
          />
          <FieldError errors={errors.license_plate} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vin">VIN / chassis number</Label>
          <Input id="vin" name="vin" defaultValue={field("vin")} maxLength={32} />
          <FieldError errors={errors.vin} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="make">Make</Label>
          <Input id="make" name="make" defaultValue={field("make")} />
          <FieldError errors={errors.make} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input id="model" name="model" defaultValue={field("model")} />
          <FieldError errors={errors.model} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            name="year"
            type="number"
            inputMode="numeric"
            defaultValue={field("year")}
          />
          <FieldError errors={errors.year} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="colour">Colour</Label>
          <Input id="colour" name="colour" defaultValue={field("colour")} />
          <FieldError errors={errors.colour} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="daily_rental_rate">Daily rental rate (JMD) *</Label>
          <Input
            id="daily_rental_rate"
            name="daily_rental_rate"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            defaultValue={field("daily_rental_rate")}
          />
          <FieldError errors={errors.daily_rental_rate} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="current_mileage">Current mileage</Label>
          <Input
            id="current_mileage"
            name="current_mileage"
            type="number"
            inputMode="numeric"
            min="0"
            defaultValue={field("current_mileage")}
          />
          <FieldError errors={errors.current_mileage} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fuel_type">Fuel type</Label>
          <Select name="fuel_type" defaultValue={values?.fuel_type || defaultValues?.fuel_type || undefined}>
            <SelectTrigger id="fuel_type" className="w-full">
              <SelectValue placeholder="Select fuel type" />
            </SelectTrigger>
            <SelectContent>
              {FUEL_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {FUEL_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={errors.fuel_type} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vehicle_status">Status *</Label>
          <Select
            name="vehicle_status"
            defaultValue={values?.vehicle_status || defaultValues?.vehicle_status || "available"}
          >
            <SelectTrigger id="vehicle_status" className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {VEHICLE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {VEHICLE_STATUS_CONFIG[status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={errors.vehicle_status} />
          <p className="text-xs text-muted-foreground">
            Rented / Reserved / Overdue will be set automatically by the rental system in a
            later phase — for now they can be set here for testing.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={field("notes")} />
        <FieldError errors={errors.notes} />
      </div>

      {isCreate ? (
        <div className="space-y-2">
          <Label htmlFor="photos">Photos (optional)</Label>
          <input
            id="photos"
            type="file"
            name="photos"
            accept="image/*"
            multiple
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
          />
          <p className="text-xs text-muted-foreground">
            You can add or change photos later from the vehicle&apos;s profile too.
          </p>
        </div>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
