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
import { updateMyDetails } from "@/lib/account/actions";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}

export function EditDetailsDialog({
  fullName,
  contact,
}: {
  fullName: string | null;
  contact?: {
    primaryPhone: string | null;
    secondaryPhone: string | null;
    address: string | null;
    cityParish: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
  };
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = await updateMyDetails({}, formData);
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      } else if (result.error) {
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
        if (next) {
          setError(null);
          setFieldErrors({});
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="size-3.5" />
        Edit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit your details</DialogTitle>
          <DialogDescription>
            {contact
              ? "Update your name and contact information."
              : "Update your name. Contact details will be editable here once your account is connected to a customer record."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="full_name">Name</Label>
            <Input id="full_name" name="full_name" defaultValue={fullName ?? ""} required maxLength={120} />
            <FieldError errors={fieldErrors.full_name} />
          </div>

          {contact ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="primary_phone">Phone</Label>
                  <Input
                    id="primary_phone"
                    name="primary_phone"
                    defaultValue={contact.primaryPhone ?? ""}
                    maxLength={30}
                  />
                  <FieldError errors={fieldErrors.primary_phone} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondary_phone">Secondary phone</Label>
                  <Input
                    id="secondary_phone"
                    name="secondary_phone"
                    defaultValue={contact.secondaryPhone ?? ""}
                    maxLength={30}
                  />
                  <FieldError errors={fieldErrors.secondary_phone} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" defaultValue={contact.address ?? ""} maxLength={300} />
                <FieldError errors={fieldErrors.address} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city_parish">City / Parish</Label>
                <Input
                  id="city_parish"
                  name="city_parish"
                  defaultValue={contact.cityParish ?? ""}
                  maxLength={100}
                />
                <FieldError errors={fieldErrors.city_parish} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Emergency contact name</Label>
                  <Input
                    id="emergency_contact_name"
                    name="emergency_contact_name"
                    defaultValue={contact.emergencyContactName ?? ""}
                    maxLength={120}
                  />
                  <FieldError errors={fieldErrors.emergency_contact_name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Emergency contact phone</Label>
                  <Input
                    id="emergency_contact_phone"
                    name="emergency_contact_phone"
                    defaultValue={contact.emergencyContactPhone ?? ""}
                    maxLength={30}
                  />
                  <FieldError errors={fieldErrors.emergency_contact_phone} />
                </div>
              </div>
            </>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
