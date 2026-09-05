"use client";

import { useState, useTransition, type FormEvent } from "react";
import { DollarSign } from "lucide-react";
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
import { recordPayment, type RecordPaymentActionState } from "@/lib/payments/actions";

const PAYMENT_METHOD_LABELS: Record<(typeof PAYMENT_METHODS)[number], string> = {
  cash: "Cash",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  online: "Online",
  other: "Other",
};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}

export function RecordPaymentDialog({
  rentalId,
  vehicleId,
  customerId,
  rentalNumber,
}: {
  rentalId: string;
  vehicleId: string;
  customerId: string;
  rentalNumber: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<RecordPaymentActionState>({});
  const [isPending, startTransition] = useTransition();
  const errors = state.fieldErrors ?? {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setState({});
    startTransition(async () => {
      const result = await recordPayment(rentalId, vehicleId, customerId, {}, formData);
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
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <DollarSign className="size-3.5" />
        Payment
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a payment — {rentalNumber}</DialogTitle>
          <DialogDescription>
            Records a payment (or refund) independent of checkout/check-in/completion.
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
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" name="amount" type="number" min={0.01} step="0.01" required />
              <FieldError errors={errors.amount} />
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

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_refund" className="size-4 rounded border-input" />
            This is a refund (money returned to the customer)
          </label>

          <div className="space-y-2">
            <Label htmlFor="payment-notes">Notes</Label>
            <Textarea id="payment-notes" name="notes" rows={2} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Recording…" : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
