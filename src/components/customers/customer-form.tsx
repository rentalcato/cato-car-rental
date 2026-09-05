"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DuplicateWarning } from "@/components/customers/duplicate-warning";
import type { CustomerActionState } from "@/lib/customers/actions";
import type { Customer } from "@/types/database.types";

const initialState: CustomerActionState = {};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p role="alert" className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}

function Field({
  id,
  label,
  required,
  errors,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  errors?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      {children}
      <FieldError errors={errors} />
    </div>
  );
}

export function CustomerForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (prevState: CustomerActionState, formData: FormData) => Promise<CustomerActionState>;
  defaultValues?: Partial<Customer>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-8" noValidate>
      {state.error ? (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}

      {state.duplicates?.length ? <DuplicateWarning duplicates={state.duplicates} /> : null}

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Personal Details</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Field id="first_name" label="First name" required errors={errors.first_name}>
            <Input
              id="first_name"
              name="first_name"
              defaultValue={defaultValues?.first_name}
              required
              maxLength={60}
            />
          </Field>
          <Field id="middle_name" label="Middle name" errors={errors.middle_name}>
            <Input id="middle_name" name="middle_name" defaultValue={defaultValues?.middle_name ?? ""} />
          </Field>
          <Field id="last_name" label="Last name" required errors={errors.last_name}>
            <Input
              id="last_name"
              name="last_name"
              defaultValue={defaultValues?.last_name}
              required
              maxLength={60}
            />
          </Field>
          <Field id="date_of_birth" label="Date of birth" errors={errors.date_of_birth}>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              defaultValue={defaultValues?.date_of_birth ?? ""}
            />
          </Field>
          <Field id="gender" label="Gender" errors={errors.gender}>
            <Input id="gender" name="gender" defaultValue={defaultValues?.gender ?? ""} maxLength={30} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Contact Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Field id="email" label="Email" errors={errors.email}>
            <Input id="email" name="email" type="email" defaultValue={defaultValues?.email ?? ""} maxLength={255} />
          </Field>
          <Field id="primary_phone" label="Primary phone" required errors={errors.primary_phone}>
            <Input
              id="primary_phone"
              name="primary_phone"
              defaultValue={defaultValues?.primary_phone ?? ""}
              required
              maxLength={30}
            />
          </Field>
          <Field id="secondary_phone" label="Secondary phone" errors={errors.secondary_phone}>
            <Input
              id="secondary_phone"
              name="secondary_phone"
              defaultValue={defaultValues?.secondary_phone ?? ""}
              maxLength={30}
            />
          </Field>
          <Field id="address" label="Home address" errors={errors.address}>
            <Input id="address" name="address" defaultValue={defaultValues?.address ?? ""} maxLength={300} />
          </Field>
          <Field id="city_parish" label="City / Parish" errors={errors.city_parish}>
            <Input id="city_parish" name="city_parish" defaultValue={defaultValues?.city_parish ?? ""} maxLength={100} />
          </Field>
          <Field id="country" label="Country" errors={errors.country}>
            <Input id="country" name="country" defaultValue={defaultValues?.country ?? ""} maxLength={100} />
          </Field>
          <Field id="emergency_contact_name" label="Emergency contact name" errors={errors.emergency_contact_name}>
            <Input
              id="emergency_contact_name"
              name="emergency_contact_name"
              defaultValue={defaultValues?.emergency_contact_name ?? ""}
              maxLength={120}
            />
          </Field>
          <Field
            id="emergency_contact_phone"
            label="Emergency contact phone"
            errors={errors.emergency_contact_phone}
          >
            <Input
              id="emergency_contact_phone"
              name="emergency_contact_phone"
              defaultValue={defaultValues?.emergency_contact_phone ?? ""}
              maxLength={30}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Identification</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Field id="drivers_license_number" label="Driver's license number" errors={errors.drivers_license_number}>
            <Input
              id="drivers_license_number"
              name="drivers_license_number"
              defaultValue={defaultValues?.drivers_license_number ?? ""}
              maxLength={50}
            />
          </Field>
          <Field
            id="drivers_license_issuing_country"
            label="License issuing country"
            errors={errors.drivers_license_issuing_country}
          >
            <Input
              id="drivers_license_issuing_country"
              name="drivers_license_issuing_country"
              defaultValue={defaultValues?.drivers_license_issuing_country ?? ""}
              maxLength={100}
            />
          </Field>
          <Field
            id="drivers_license_issue_date"
            label="License issue date"
            errors={errors.drivers_license_issue_date}
          >
            <Input
              id="drivers_license_issue_date"
              name="drivers_license_issue_date"
              type="date"
              defaultValue={defaultValues?.drivers_license_issue_date ?? ""}
            />
          </Field>
          <Field id="drivers_license_expiry" label="License expiry" errors={errors.drivers_license_expiry}>
            <Input
              id="drivers_license_expiry"
              name="drivers_license_expiry"
              type="date"
              defaultValue={defaultValues?.drivers_license_expiry ?? ""}
            />
          </Field>
          <Field id="identification_type" label="ID type" errors={errors.identification_type}>
            <Input
              id="identification_type"
              name="identification_type"
              placeholder="e.g. National ID"
              defaultValue={defaultValues?.identification_type ?? ""}
              maxLength={50}
            />
          </Field>
          <Field id="identification_number" label="ID number" errors={errors.identification_number}>
            <Input
              id="identification_number"
              name="identification_number"
              defaultValue={defaultValues?.identification_number ?? ""}
              maxLength={50}
            />
          </Field>
          <Field id="passport_number" label="Passport number" errors={errors.passport_number}>
            <Input
              id="passport_number"
              name="passport_number"
              defaultValue={defaultValues?.passport_number ?? ""}
              maxLength={50}
            />
          </Field>
        </div>
      </section>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={defaultValues?.notes ?? ""} />
        <FieldError errors={errors.notes} />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
