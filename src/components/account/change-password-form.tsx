"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMyPassword, type ProfileActionState } from "@/lib/account/actions";

const initialState: ProfileActionState = {};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(updateMyPassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="max-w-sm space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
        <FieldError errors={errors.password} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirm new password</Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
        />
        <FieldError errors={errors.confirm_password} />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? <p className="text-sm text-muted-foreground">Password updated.</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Updating…" : "Update Password"}
      </Button>
    </form>
  );
}
