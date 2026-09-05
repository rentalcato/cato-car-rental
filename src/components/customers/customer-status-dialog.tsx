"use client";

import { useState, useTransition, type FormEvent } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CUSTOMER_STATUSES } from "@/lib/constants";
import { CUSTOMER_STATUS_CONFIG } from "@/components/customers/customer-status-badge";
import { setCustomerStatus } from "@/lib/customers/actions";
import type { CustomerStatus } from "@/types/database.types";

export function CustomerStatusDialog({
  customerId,
  currentStatus,
}: {
  customerId: string;
  currentStatus: CustomerStatus;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<CustomerStatus>(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const reason = String(formData.get("reason") ?? "");
    setError(null);
    startTransition(async () => {
      const result = await setCustomerStatus(customerId, status, reason);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setStatus(currentStatus);
        setError(null);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <ShieldAlert className="size-3.5" />
        Change status
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change account status</DialogTitle>
          <DialogDescription>
            Restricted and Blacklisted customers trigger a warning before staff can create a
            rental for them; a Blacklisted customer additionally needs a manager override to
            check out a vehicle at all.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="status">New status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as CustomerStatus)}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_STATUSES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {CUSTOMER_STATUS_CONFIG[option].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (recorded in the audit log)</Label>
            <Textarea id="reason" name="reason" rows={3} />
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
