"use client";

import { useState, useTransition, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { completeRental, type CompleteRentalActionState } from "@/lib/rentals/actions";

const PAYMENT_METHOD_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  online: "Online",
  other: "Other",
};

function toLocalDateTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}

export function CompleteRentalDialog({
  rentalId,
  vehicleId,
  customerId,
  rentalNumber,
  checkoutMileage,
  balanceDue,
}: {
  rentalId: string;
  vehicleId: string;
  customerId: string;
  rentalNumber: string;
  checkoutMileage: number | null;
  balanceDue: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<CompleteRentalActionState>({});
  const [isPending, startTransition] = useTransition();
  const errors = state.fieldErrors ?? {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setState({});
    startTransition(async () => {
      const result = await completeRental(rentalId, vehicleId, customerId, {}, formData);
      if (result.success) {
        setOpen(false);
      } else {
        setState(result);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setState({});
      }}
    >
      <DialogTrigger render={<Button size="sm" />}>
        <CheckCircle2 className="size-3.5" />
        Complete
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete {rentalNumber}</DialogTitle>
          <DialogDescription>
            Record the return and free this vehicle back to Available.
            {balanceDue && balanceDue > 0
              ? ` Balance before late fees/charges: ${formatCurrency(balanceDue)}.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {state.error ? (
            <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="actual_return">Actual return date &amp; time</Label>
              <Input
                id="actual_return"
                name="actual_return"
                type="datetime-local"
                defaultValue={toLocalDateTimeInputValue(new Date())}
                required
              />
              <FieldError errors={errors.actual_return} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="return_mileage">Return mileage</Label>
              <Input
                id="return_mileage"
                name="return_mileage"
                type="number"
                min={0}
                defaultValue={checkoutMileage ?? ""}
              />
              <FieldError errors={errors.return_mileage} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="return_fuel_level">Return fuel level</Label>
              <Input id="return_fuel_level" name="return_fuel_level" placeholder="e.g. Full, 3/4, 1/2" />
              <FieldError errors={errors.return_fuel_level} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="late_fee">Late fee</Label>
              <Input id="late_fee" name="late_fee" type="number" min={0} step="0.01" defaultValue={0} />
              <FieldError errors={errors.late_fee} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="additional_charges">Additional charges</Label>
              <Input
                id="additional_charges"
                name="additional_charges"
                type="number"
                min={0}
                step="0.01"
                defaultValue={0}
              />
              <FieldError errors={errors.additional_charges} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_amount">Final payment collected</Label>
              <Input
                id="payment_amount"
                name="payment_amount"
                type="number"
                min={0}
                step="0.01"
                defaultValue={0}
              />
              <FieldError errors={errors.payment_amount} />
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
            <div className="space-y-2">
              <Label htmlFor="payment_reference">Payment reference</Label>
              <Input id="payment_reference" name="payment_reference" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complete-notes">Notes</Label>
            <Textarea id="complete-notes" name="notes" rows={2} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Completing…" : "Confirm Return"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
