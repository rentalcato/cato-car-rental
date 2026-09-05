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
import { ISSUE_SEVERITIES } from "@/lib/constants";
import { reportDamage, type IssueActionState } from "@/lib/issues/actions";
import type { Vehicle } from "@/types/database.types";

const initialState: IssueActionState = {};

const SEVERITY_LABELS: Record<(typeof ISSUE_SEVERITIES)[number], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}

export function IssueForm({
  vehicles,
  defaultVehicleId,
}: {
  vehicles: Vehicle[];
  defaultVehicleId?: string;
}) {
  const [state, formAction, pending] = useActionState(reportDamage, initialState);
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
          <Label htmlFor="severity">Severity</Label>
          <Select name="severity" defaultValue="medium">
            <SelectTrigger id="severity" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ISSUE_SEVERITIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {SEVERITY_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={errors.severity} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="issue_type">Issue type</Label>
          <Input id="issue_type" name="issue_type" placeholder="e.g. Bumper scratch, cracked windshield" />
          <FieldError errors={errors.issue_type} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="repair_cost">Estimated repair cost (JMD)</Label>
          <Input id="repair_cost" name="repair_cost" type="number" min={0} step="0.01" />
          <FieldError errors={errors.repair_cost} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="photo">Photo evidence</Label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent text-sm file:mr-3 file:h-full file:border-0 file:bg-secondary file:px-2.5 file:text-sm file:font-medium file:text-secondary-foreground"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={3} />
        <FieldError errors={errors.description} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="take_out_of_service" className="size-4 rounded border-input" />
        Take this vehicle out of service (marks it Damaged)
      </label>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} variant="destructive">
          {pending ? "Saving…" : "Report Damage"}
        </Button>
      </div>
    </form>
  );
}
