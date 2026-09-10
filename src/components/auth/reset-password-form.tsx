"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
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

/**
 * Reuses updateMyPassword() (lib/account/actions.ts, Profile -> Security)
 * — this page's only difference is what happens after a successful
 * change: an in-app settings save just confirms in place, this one sends
 * the visitor straight into their account/dashboard.
 */
export function ResetPasswordForm({ continueHref }: { continueHref: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateMyPassword, initialState);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.success) {
      const timeout = setTimeout(() => router.push(continueHref), 1500);
      return () => clearTimeout(timeout);
    }
  }, [state.success, continueHref, router]);

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="size-10 text-primary" />
        <p className="text-sm text-muted-foreground">Password updated — taking you in…</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
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

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Updating…" : "Set New Password"}
      </Button>
    </form>
  );
}
