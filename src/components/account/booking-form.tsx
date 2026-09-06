"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { requestReservation, type BookingActionState } from "@/lib/account/actions";

const initialState: BookingActionState = {};

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

export function BookingForm({
  vehicleId,
  dailyRate,
}: {
  vehicleId: string;
  dailyRate: number | null;
}) {
  const action = requestReservation.bind(null, vehicleId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};

  // "" as an intermediate state fixes a real bug: falling back to 1 on
  // every keystroke that clears the field made it impossible to type any
  // number that doesn't start with "1" — see reservation-form.tsx.
  const [durationDays, setDurationDays] = useState<number | "">(1);
  const [rentalStart, setRentalStart] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toLocalDateTimeInputValue(tomorrow);
  });

  const estimatedTotal = useMemo(
    () => (dailyRate ?? 0) * (durationDays || 0),
    [dailyRate, durationDays]
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error ? (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

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
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" name="notes" rows={3} placeholder="Anything we should know?" />
      </div>

      <div className="flex items-center justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Estimated total: <span className="font-semibold text-foreground">{formatCurrency(estimatedTotal)}</span>
        </p>
        <Button type="submit" disabled={pending}>
          {pending ? "Booking…" : "Request Reservation"}
        </Button>
      </div>
    </form>
  );
}
