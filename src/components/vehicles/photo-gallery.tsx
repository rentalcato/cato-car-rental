"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  deleteVehiclePhoto,
  uploadVehiclePhotos,
  type VehicleActionState,
} from "@/lib/vehicles/actions";
import type { VehiclePhotoWithUrl } from "@/lib/vehicles/queries";

const initialState: VehicleActionState = {};

export function PhotoGallery({
  vehicleId,
  photos,
  canManage,
}: {
  vehicleId: string;
  photos: VehiclePhotoWithUrl[];
  canManage: boolean;
}) {
  const action = uploadVehiclePhotos.bind(null, vehicleId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, startDeleteTransition] = useTransition();

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <div className="space-y-4">
      {canManage ? (
        <form
          ref={formRef}
          action={formAction}
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <input
            type="file"
            name="photos"
            accept="image/*"
            multiple
            required
            className="flex-1 text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
          />
          <Button type="submit" disabled={pending} size="sm">
            <Upload className="size-3.5" />
            {pending ? "Uploading…" : "Upload"}
          </Button>
        </form>
      ) : null}

      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {deleteError ? (
        <p role="alert" className="text-sm text-destructive">
          {deleteError}
        </p>
      ) : null}

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">No photos uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-video overflow-hidden rounded-md border bg-muted"
            >
              {/* Plain <img>, not next/image — keeps the Storage public-bucket
                  URLs simple with no remote-pattern config to maintain. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt="Vehicle"
                className="size-full object-cover"
                loading="lazy"
              />
              {canManage ? (
                <button
                  type="button"
                  onClick={() =>
                    startDeleteTransition(async () => {
                      const result = await deleteVehiclePhoto(vehicleId, photo.id, photo.storage_path);
                      setDeleteError(result.error ?? null);
                    })
                  }
                  className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1.5 text-white"
                  aria-label="Delete photo"
                >
                  <Trash2 className="size-3.5" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
