"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { deleteVehicle } from "@/lib/vehicles/actions";

/**
 * Permanent removal — distinct from Archive/Restore (ArchiveVehicleDialog),
 * which is reversible and keeps history. This can't be undone, so it's a
 * separate, more explicit confirmation rather than a third mode bolted
 * onto that dialog.
 */
export function DeleteVehicleDialog({
  vehicleId,
  licensePlate,
}: {
  vehicleId: string;
  licensePlate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteVehicle(vehicleId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push("/vehicles");
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
        <Trash2 className="size-3.5" />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {licensePlate} permanently?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the vehicle and its photos and maintenance/issue history for good — this
            can&apos;t be undone. If it has any rental or reservation history, this will be
            blocked; use Archive instead to remove it from the active fleet without losing that
            history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Deleting…" : "Delete Permanently"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
