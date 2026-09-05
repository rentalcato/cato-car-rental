"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBusinessSettings, type SettingsActionState } from "@/lib/settings/actions";
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

export function BusinessSettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction, pending] = useActionState(updateBusinessSettings, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error ? (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="text-sm text-muted-foreground">Saved.</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="business_name">Business name</Label>
          <Input id="business_name" name="business_name" defaultValue={settings.business_name ?? ""} />
          <FieldError errors={errors.business_name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={settings.phone ?? ""} />
          <FieldError errors={errors.phone} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" defaultValue={settings.address ?? ""} />
          <FieldError errors={errors.address} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={settings.email ?? ""} />
          <FieldError errors={errors.email} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">
            Currency code{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (stored, not yet applied to displayed amounts)
            </span>
          </Label>
          <Input id="currency" name="currency" maxLength={3} defaultValue={settings.currency} required />
          <FieldError errors={errors.currency} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">
            Timezone{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (stored, not yet applied app-wide)
            </span>
          </Label>
          <Input id="timezone" name="timezone" defaultValue={settings.timezone} required />
          <FieldError errors={errors.timezone} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tax_rate">Tax rate (%)</Label>
          <Input
            id="tax_rate"
            name="tax_rate"
            type="number"
            min={0}
            max={100}
            step="0.01"
            defaultValue={settings.tax_rate}
          />
          <FieldError errors={errors.tax_rate} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save Business Settings"}
        </Button>
      </div>
    </form>
  );
}
