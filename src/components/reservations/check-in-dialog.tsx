"use client";

import { useState, useTransition, type FormEvent } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CustomerWarningBanner } from "@/components/customers/customer-warning-banner";
import { PAYMENT_METHODS } from "@/lib/constants";
import { checkInReservation } from "@/lib/reservations/actions";
import type { CustomerStatus } from "@/types/database.types";

const PAYMENT_METHOD_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  online: "Online",
  other: "Other",
};

export function CheckInDialog({
  rentalId,
  vehicleId,
  customerId,
  rentalNumber,
  customerStatus,
  canOverrideBlacklist,
}: {
  rentalId: string;
  vehicleId: string;
  customerId: string;
  rentalNumber: string;
  customerStatus: CustomerStatus;
  canOverrideBlacklist: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isBlacklisted = customerStatus === "blacklisted";
  const blocked = isBlacklisted && !canOverrideBlacklist;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await checkInReservation(rentalId, vehicleId, customerId, formData);
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
        setError(null);
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <LogIn className="size-3.5" />
        Check In
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check in {rentalNumber}</DialogTitle>
          <DialogDescription>
            Hand over the vehicle and mark this reservation Active.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {customerStatus !== "active" ? <CustomerWarningBanner status={customerStatus} /> : null}

          {isBlacklisted ? (
            canOverrideBlacklist ? (
              <label className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                <input
                  type="checkbox"
                  name="override_blacklist"
                  className="mt-0.5 size-4 rounded border-input"
                />
                <span>
                  I am a manager/super admin and I am overriding the blacklist restriction to
                  check out a vehicle to this customer.
                </span>
              </label>
            ) : (
              <p className="text-sm font-medium text-destructive">
                A manager or super admin must be present to override this and continue.
              </p>
            )
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payment_amount">Payment collected now</Label>
              <Input id="payment_amount" name="payment_amount" type="number" min={0} step="0.01" defaultValue={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment method</Label>
              <Select name="payment_method">
                <SelectTrigger id="payment_method" className="w-full">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="payment_reference">Payment reference</Label>
              <Input id="payment_reference" name="payment_reference" />
            </div>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending || blocked}>
              {isPending ? "Checking in…" : "Confirm Check-In"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
