"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateDailyRate } from "@/lib/vehicles/actions";
import { formatCurrency } from "@/lib/format";

export function DailyRateDialog({
  vehicleId,
  currentRate,
}: {
  vehicleId: string;
  currentRate: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await updateDailyRate(vehicleId, {}, formData);
      if (result.success) {
        setOpen(false);
      } else {
        setError(result.fieldErrors?.daily_rental_rate?.[0] ?? result.error ?? "Could not save.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="size-3.5" />
        Change rate
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change daily rental rate</DialogTitle>
          <DialogDescription>
            Current rate: {formatCurrency(currentRate)} / day
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="daily_rental_rate">New daily rate (JMD)</Label>
            <Input
              id="daily_rental_rate"
              name="daily_rental_rate"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              defaultValue={currentRate ?? ""}
              required
              autoFocus
            />
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save rate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
