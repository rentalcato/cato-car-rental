"use client";

import { useActionState, useRef } from "react";
import { Building2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadBusinessLogo, type SettingsActionState } from "@/lib/settings/actions";

const initialState: SettingsActionState = {};

export function LogoUploader({ logoUrl }: { logoUrl: string | null }) {
  const [state, formAction, pending] = useActionState(uploadBusinessLogo, initialState);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-4">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="Business logo" className="size-full object-contain" />
        ) : (
          <Building2 className="size-7 text-muted-foreground" />
        )}
      </div>
      <form action={formAction} className="space-y-1">
        <input
          ref={inputRef}
          type="file"
          name="logo"
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
          <Upload className="size-3.5" />
          {pending ? "Uploading…" : logoUrl ? "Change logo" : "Upload logo"}
        </Button>
        {state.error ? <p className="text-xs text-destructive">{state.error}</p> : null}
      </form>
    </div>
  );
}
