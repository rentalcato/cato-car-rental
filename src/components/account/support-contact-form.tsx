"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitSupportMessage, type SupportActionState } from "@/lib/support/actions";

const initialState: SupportActionState = {};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}

export function SupportContactForm({
  defaultName,
  defaultEmail,
  defaultSubject,
}: {
  defaultName: string;
  defaultEmail: string;
  defaultSubject?: string;
}) {
  const [state, formAction, pending] = useActionState(submitSupportMessage, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  if (state.success) {
    return (
      <p className="rounded-md bg-emerald-500/10 p-4 text-sm font-medium text-emerald-700 dark:text-emerald-500">
        Thanks — your message has been sent. We&apos;ll get back to you shortly.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={defaultName} required maxLength={120} />
          <FieldError errors={errors.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultEmail} maxLength={255} />
          <FieldError errors={errors.email} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" name="phone" maxLength={30} />
        <FieldError errors={errors.phone} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" defaultValue={defaultSubject} required maxLength={150} />
        <FieldError errors={errors.subject} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows={4} required maxLength={2000} />
        <FieldError errors={errors.message} />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
