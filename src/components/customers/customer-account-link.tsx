"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Link2, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { linkCustomerAccount, unlinkCustomerAccount } from "@/lib/customers/actions";
import type { LinkedAccount } from "@/lib/customers/queries";

/**
 * Connects this customer's real rental record to the login they use on
 * the public site (0014 migration) — only then can their /account area
 * show their own real booking history instead of "not linked yet."
 */
export function CustomerAccountLink({
  customerId,
  linkedAccount,
}: {
  customerId: string;
  linkedAccount: LinkedAccount | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setError(null);
    startTransition(async () => {
      const result = await linkCustomerAccount(customerId, email);
      if (result.error) setError(result.error);
    });
  }

  function handleUnlink() {
    setError(null);
    startTransition(async () => {
      const result = await unlinkCustomerAccount(customerId);
      if (result.error) setError(result.error);
    });
  }

  if (linkedAccount) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm">
          <Link2 className="size-4 text-primary" />
          Linked to <span className="font-medium">{linkedAccount.email ?? "—"}</span>
          {linkedAccount.full_name ? (
            <span className="text-muted-foreground">({linkedAccount.full_name})</span>
          ) : null}
        </p>
        <Button variant="outline" size="sm" disabled={isPending} onClick={handleUnlink}>
          <Link2Off className="size-3.5" />
          Unlink
        </Button>
        {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <form onSubmit={handleLink} className="flex flex-wrap items-end gap-3" noValidate>
      <div className="space-y-2">
        <Label htmlFor="link-email" className="text-xs text-muted-foreground">
          Not linked to a website account. Connect it by email:
        </Label>
        <Input
          id="link-email"
          name="email"
          type="email"
          placeholder="customer@example.com"
          className="w-64"
          required
        />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        <Link2 className="size-3.5" />
        {isPending ? "Linking…" : "Link account"}
      </Button>
      {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
