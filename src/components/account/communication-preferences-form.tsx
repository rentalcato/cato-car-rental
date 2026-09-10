"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { updateMyCommunicationPrefs, type ProfileActionState } from "@/lib/account/actions";

const initialState: ProfileActionState = {};

export function CommunicationPreferencesForm({
  emailEnabled,
  smsEnabled,
}: {
  emailEnabled: boolean;
  smsEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateMyCommunicationPrefs, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/50">
        <input
          type="checkbox"
          name="email_notifications_enabled"
          defaultChecked={emailEnabled}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <span>
          <span className="block text-sm font-medium">Email updates</span>
          <span className="block text-xs text-muted-foreground">
            Booking confirmations, payment receipts, and reminders by email.
          </span>
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted/50">
        <input
          type="checkbox"
          name="sms_notifications_enabled"
          defaultChecked={smsEnabled}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <span>
          <span className="block text-sm font-medium">SMS updates</span>
          <span className="block text-xs text-muted-foreground">Text messages for time-sensitive updates only.</span>
        </span>
      </label>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="text-sm text-muted-foreground">Preferences saved.</p> : null}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save Preferences"}
      </Button>
    </form>
  );
}
