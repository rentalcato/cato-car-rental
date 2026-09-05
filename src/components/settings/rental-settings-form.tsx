"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateRentalSettings, type SettingsActionState } from "@/lib/settings/actions";
import type { AppSettings } from "@/types/database.types";

const initialState: SettingsActionState = {};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}

export function RentalSettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction, pending] = useActionState(updateRentalSettings, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error ? (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="text-sm text-muted-foreground">Saved.</p> : null}

      <p className="text-xs text-muted-foreground">
        Daily rate and deposit below pre-fill the Add Vehicle / New Rental / New Reservation
        forms. The rest are stored for reference — they aren&apos;t auto-applied to checkout or
        completion yet.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="default_daily_rate">Default daily rate (JMD)</Label>
          <Input
            id="default_daily_rate"
            name="default_daily_rate"
            type="number"
            min={0}
            step="0.01"
            defaultValue={settings.default_daily_rate ?? ""}
          />
          <FieldError errors={errors.default_daily_rate} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="default_security_deposit">Default security deposit (JMD)</Label>
          <Input
            id="default_security_deposit"
            name="default_security_deposit"
            type="number"
            min={0}
            step="0.01"
            defaultValue={settings.default_security_deposit}
          />
          <FieldError errors={errors.default_security_deposit} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="grace_period_hours">Grace period (hours)</Label>
          <Input
            id="grace_period_hours"
            name="grace_period_hours"
            type="number"
            min={0}
            defaultValue={settings.grace_period_hours}
          />
          <FieldError errors={errors.grace_period_hours} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="late_fee_per_day">Late fee per day (JMD)</Label>
          <Input
            id="late_fee_per_day"
            name="late_fee_per_day"
            type="number"
            min={0}
            step="0.01"
            defaultValue={settings.late_fee_per_day}
          />
          <FieldError errors={errors.late_fee_per_day} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mileage_limit_per_day">Mileage limit per day</Label>
          <Input
            id="mileage_limit_per_day"
            name="mileage_limit_per_day"
            type="number"
            min={0}
            defaultValue={settings.mileage_limit_per_day ?? ""}
          />
          <FieldError errors={errors.mileage_limit_per_day} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mileage_overage_fee">Mileage overage fee (per mile/km)</Label>
          <Input
            id="mileage_overage_fee"
            name="mileage_overage_fee"
            type="number"
            min={0}
            step="0.01"
            defaultValue={settings.mileage_overage_fee ?? ""}
          />
          <FieldError errors={errors.mileage_overage_fee} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="fuel_policy">Fuel policy</Label>
          <Input
            id="fuel_policy"
            name="fuel_policy"
            placeholder="e.g. Full-to-full"
            defaultValue={settings.fuel_policy ?? ""}
          />
          <FieldError errors={errors.fuel_policy} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save Rental Defaults"}
        </Button>
      </div>
    </form>
  );
}
