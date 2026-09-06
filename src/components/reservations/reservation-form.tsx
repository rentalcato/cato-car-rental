"use client";

import { useActionState, useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { CustomerSearchCombobox } from "@/components/customers/customer-search-combobox";
import { CustomerStatusBadge } from "@/components/customers/customer-status-badge";
import { CustomerWarningBanner } from "@/components/customers/customer-warning-banner";
import { formatCurrency, formatDate } from "@/lib/format";
import { createReservation, type ReservationActionState } from "@/lib/reservations/actions";
import type { AvailableVehicle } from "@/lib/rentals/queries";
import type { Customer } from "@/types/database.types";

const initialState: ReservationActionState = {};

function isLicenseExpired(expiry: string | null): boolean {
  if (!expiry) return false;
  return new Date(expiry).getTime() < Date.now();
}

function toLocalDateTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}

export function ReservationForm({
  initialCustomer,
  vehicles,
  canOverrideBlacklist,
  defaultDeposit = 0,
}: {
  initialCustomer: Customer | null;
  vehicles: AvailableVehicle[];
  canOverrideBlacklist: boolean;
  defaultDeposit?: number;
}) {
  const [state, formAction, pending] = useActionState(createReservation, initialState);
  const errors = state.fieldErrors ?? {};

  const [customer, setCustomer] = useState<Customer | null>(initialCustomer);
  const [vehicleId, setVehicleId] = useState("");
  // Allowing "" (not just a number) as an intermediate state is the fix
  // for a real bug: falling back to 1 on every keystroke that clears the
  // field made it impossible to type any number that doesn't start with
  // "1" — clearing it to type e.g. "20" instantly snapped back to "1"
  // before you could type the "2". Server-side validation (min 1) still
  // catches a genuinely empty submission.
  const [durationDays, setDurationDays] = useState<number | "">(1);
  const [rentalStart, setRentalStart] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toLocalDateTimeInputValue(tomorrow);
  });

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId) ?? null;
  const estimatedTotal = useMemo(
    () => (selectedVehicle?.daily_rental_rate ?? 0) * (durationDays || 0),
    [selectedVehicle, durationDays]
  );
  const estimatedReturn = useMemo(() => {
    if (!rentalStart) return null;
    const start = new Date(rentalStart);
    if (Number.isNaN(start.getTime())) return null;
    const end = new Date(start);
    end.setDate(end.getDate() + (durationDays || 0));
    return end;
  }, [rentalStart, durationDays]);

  const isBlacklisted = customer?.status === "blacklisted";
  const blockedByBlacklist = isBlacklisted && !canOverrideBlacklist;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.error ? (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">1. Customer</h3>
        {customer ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {customer.first_name} {customer.last_name}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({customer.customer_number})
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {customer.primary_phone || customer.email || "No contact info on file"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CustomerStatusBadge status={customer.status} />
                  <Button type="button" variant="outline" size="sm" onClick={() => setCustomer(null)}>
                    Change
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-muted-foreground">Driver&apos;s license expiry:</span>
                <span className="font-medium">
                  {formatDate(customer.drivers_license_expiry) || "Not on file"}
                </span>
                {isLicenseExpired(customer.drivers_license_expiry) ? (
                  <span className="flex items-center gap-1 font-medium text-destructive">
                    <AlertTriangle className="size-3.5" />
                    Expired
                  </span>
                ) : null}
              </div>

              {customer.status !== "active" ? <CustomerWarningBanner status={customer.status} /> : null}

              {isBlacklisted ? (
                canOverrideBlacklist ? (
                  <label className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                    <input
                      type="checkbox"
                      name="override_blacklist"
                      className="mt-0.5 size-4 rounded border-input"
                    />
                    <span>
                      I am a manager/super admin and I am overriding the blacklist restriction to
                      book this customer.
                    </span>
                  </label>
                ) : (
                  <p className="text-sm font-medium text-destructive">
                    A manager or super admin must be present to override this and continue.
                  </p>
                )
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <CustomerSearchCombobox onSelect={setCustomer} />
        )}
        <input type="hidden" name="customer_id" value={customer?.id ?? ""} />
        {errors.customer_id ? <FieldError errors={errors.customer_id} /> : null}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">2. Vehicle</h3>
        <div className="space-y-2">
          <Label htmlFor="vehicle_id">Available vehicle</Label>
          <Select
            name="vehicle_id"
            value={vehicleId}
            onValueChange={(value) => setVehicleId(value ?? "")}
          >
            <SelectTrigger id="vehicle_id" className="w-full">
              <SelectValue placeholder="Select an available vehicle" />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.license_plate} — {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ")}{" "}
                  ({formatCurrency(vehicle.daily_rental_rate)}/day)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.vehicle_id ? <FieldError errors={errors.vehicle_id} /> : null}
        </div>
        {selectedVehicle ? (
          <p className="text-sm text-muted-foreground">
            Plate <span className="font-mono font-semibold text-foreground">{selectedVehicle.license_plate}</span>{" "}
            · Daily rate {formatCurrency(selectedVehicle.daily_rental_rate)}
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">3. Booking Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rental_start">Pickup date &amp; time</Label>
            <Input
              id="rental_start"
              name="rental_start"
              type="datetime-local"
              value={rentalStart}
              onChange={(event) => setRentalStart(event.target.value)}
              required
            />
            <FieldError errors={errors.rental_start} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration_days">Number of rental days</Label>
            <Input
              id="duration_days"
              name="duration_days"
              type="number"
              min={1}
              max={365}
              value={durationDays}
              onChange={(event) => {
                const raw = event.target.value;
                setDurationDays(raw === "" ? "" : Number(raw));
              }}
              required
            />
            <FieldError errors={errors.duration_days} />
          </div>
          <div className="space-y-2">
            <Label>Expected return</Label>
            <p className="flex h-8 items-center text-sm font-medium">
              {estimatedReturn ? estimatedReturn.toLocaleString() : "—"}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Estimated total</Label>
            <p className="flex h-8 items-center text-sm font-medium">{formatCurrency(estimatedTotal)}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deposit_amount">Deposit</Label>
            <Input id="deposit_amount" name="deposit_amount" type="number" min={0} step="0.01" defaultValue={defaultDeposit} />
            <FieldError errors={errors.deposit_amount} />
          </div>
        </div>
      </section>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending || !customer || !vehicleId || blockedByBlacklist}>
          {pending ? "Booking…" : "Confirm Reservation"}
        </Button>
      </div>
    </form>
  );
}
