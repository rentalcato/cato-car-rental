"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { approveReservation, denyReservation } from "@/lib/reservations/actions";

/**
 * A customer's self-service reservation (approval_status = 'pending',
 * 0020) needs a staff decision before Check-In makes sense — a
 * staff-created reservation never has this (approval_status stays
 * null), so ReservationTable only renders this for the self-service
 * case.
 */
export function ReservationApprovalActions({
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
  const [approveError, setApproveError] = useState<string | null>(null);
  const [isApproving, startApproveTransition] = useTransition();

  function handleApprove() {
    setApproveError(null);
    startApproveTransition(async () => {
      const result = await approveReservation(rentalId, vehicleId, customerId);
      if (result.error) setApproveError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        <Button variant="outline" size="sm" disabled={isApproving} onClick={handleApprove}>
          <Check className="size-3.5" />
          {isApproving ? "Accepting…" : "Accept"}
        </Button>
        <DenyReservationDialog
          rentalId={rentalId}
          vehicleId={vehicleId}
          customerId={customerId}
          rentalNumber={rentalNumber}
        />
      </div>
      {approveError ? <p className="text-xs text-destructive">{approveError}</p> : null}
    </div>
  );
}

function DenyReservationDialog({
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
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await denyReservation(rentalId, vehicleId, customerId, reason);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError(null);
          setReason("");
        }
      }}
    >
      <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
        <X className="size-3.5" />
        Deny
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Deny {rentalNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            The vehicle will be freed back to Available and the customer&apos;s reservation marked
            denied. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="deny-reason">Reason (optional, recorded in the audit log)</Label>
          <Textarea
            id="deny-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
          />
        </div>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Keep pending</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Denying…" : "Deny reservation"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
