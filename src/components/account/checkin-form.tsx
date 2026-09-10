"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { saveCheckin, type CheckinActionState } from "@/lib/checkin/actions";
import type { RentalCheckin } from "@/types/database.types";

const initialState: CheckinActionState = {};

function CheckItem({
  name,
  defaultChecked,
  title,
  description,
}: {
  name: string;
  defaultChecked: boolean;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/50">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 shrink-0 accent-primary"
      />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

/**
 * Every field here confirms information already on file (see
 * save_rental_checkin(), 0022) rather than collecting anything new — per
 * the spec's "do not request unnecessary sensitive information."
 */
export function CheckinForm({ rentalId, checkin }: { rentalId: string; checkin: RentalCheckin | null }) {
  const action = saveCheckin.bind(null, rentalId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const isComplete = state.success ? true : Boolean(checkin?.completed_at);

  return (
    <div className="space-y-4">
      {isComplete ? (
        <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-500">
          <CheckCircle2 className="size-4 shrink-0" />
          Check-in complete — you&apos;re all set for pickup.
        </div>
      ) : null}

      <form action={formAction} className="space-y-3">
        <CheckItem
          name="license_confirmed"
          defaultChecked={checkin?.license_confirmed ?? false}
          title="Driver's license on file is current"
          description="The license we have for you hasn't expired or changed."
        />
        <CheckItem
          name="address_confirmed"
          defaultChecked={checkin?.address_confirmed ?? false}
          title="Contact address is up to date"
          description="We'll use this if we ever need to reach you about your rental."
        />
        <CheckItem
          name="emergency_contact_confirmed"
          defaultChecked={checkin?.emergency_contact_confirmed ?? false}
          title="Emergency contact is up to date"
          description="Someone we can call in case of an emergency during your rental."
        />
        <CheckItem
          name="agreement_accepted"
          defaultChecked={checkin?.agreement_accepted ?? false}
          title="I accept the rental agreement"
          description="See the Rental Agreement section below for the full terms."
        />

        <div className="space-y-2">
          <Label htmlFor="additional_notes">Anything we should know before pickup? (optional)</Label>
          <Textarea
            id="additional_notes"
            name="additional_notes"
            rows={2}
            placeholder="e.g. arriving a little early, need a child seat…"
            defaultValue={checkin?.additional_notes ?? ""}
          />
        </div>

        {state.error ? (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save Check-in"}
        </Button>
      </form>
    </div>
  );
}
