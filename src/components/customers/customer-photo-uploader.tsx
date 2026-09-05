"use client";

import { useActionState, useRef } from "react";
import { Camera, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadCustomerPhoto, type PhotoActionState } from "@/lib/customers/photo-actions";

const initialState: PhotoActionState = {};

export function CustomerPhotoUploader({
  customerId,
  photoUrl,
  canUpload,
}: {
  customerId: string;
  photoUrl: string | null;
  canUpload: boolean;
}) {
  const action = uploadCustomerPhoto.bind(null, customerId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Customer" className="size-full object-cover" />
        ) : (
          <User className="size-7 text-muted-foreground" />
        )}
      </div>
      {canUpload ? (
        <form action={formAction} className="space-y-1">
          <input
            ref={inputRef}
            type="file"
            name="photo"
            accept="image/*"
            hidden
            onChange={(event) => event.target.form?.requestSubmit()}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="size-3.5" />
            {pending ? "Uploading…" : photoUrl ? "Change photo" : "Add photo"}
          </Button>
          {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
