"use client";

import { useActionState } from "react";
import Link from "next/link";
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
import { DuplicateWarning } from "@/components/customers/duplicate-warning";
import { DOCUMENT_TYPE_LABELS } from "@/components/customers/customer-documents-panel";
import type { CustomerActionState } from "@/lib/customers/actions";
import type { Customer } from "@/types/database.types";

const initialState: CustomerActionState = {};

/** Restricted to what a walk-in usually brings — the full type list (rental
 *  agreements, signed docs, etc.) is staff-generated paperwork that belongs
 *  in the Documents tab, not this quick-attach section. */
const ID_DOCUMENT_TYPES = ["national_id", "passport", "other"] as const;

const fileInputClassName =
  "flex h-8 w-full rounded-lg border border-input bg-transparent text-sm file:mr-3 file:h-full file:border-0 file:bg-secondary file:px-2.5 file:text-sm file:font-medium file:text-secondary-foreground";

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
  canManageAccountLink,
  linkedAccountEmail,
  customerId,
}: {
  action: (prevState: CustomerActionState, formData: FormData) => Promise<CustomerActionState>;
  defaultValues?: Partial<Customer>;
  submitLabel: string;
  /** Website Account field only shows for manager+ — matches customers_write RLS (super_admin/manager only). */
  canManageAccountLink?: boolean;
  /** Pre-fills the field on Edit when already linked; irrelevant (and omitted) on Add. */
  linkedAccountEmail?: string | null;
  /** Editing an existing customer — shows a link to their full Documents tab instead of just the quick-attach note. */
  customerId?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};
  // Whatever was just submitted (and rejected) wins over the original
  // defaultValues, so a failed attempt redisplays what you typed instead
  // of resetting the form.
  const values = state.values;
  function field(name: keyof Customer): string {
    if (values?.[name] !== undefined) return values[name];
    const dv = defaultValues?.[name];
    return dv === null || dv === undefined ? "" : String(dv);
  }
  const accountEmailValue = values?.website_account_email ?? linkedAccountEmail ?? "";

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
              defaultValue={field("first_name")}
              required
              maxLength={60}
            />
          </Field>
          <Field id="middle_name" label="Middle name" errors={errors.middle_name}>
            <Input id="middle_name" name="middle_name" defaultValue={field("middle_name")} />
          </Field>
          <Field id="last_name" label="Last name" required errors={errors.last_name}>
            <Input
              id="last_name"
              name="last_name"
              defaultValue={field("last_name")}
              required
              maxLength={60}
            />
          </Field>
          <Field id="date_of_birth" label="Date of birth" errors={errors.date_of_birth}>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              defaultValue={field("date_of_birth")}
            />
          </Field>
          <Field id="gender" label="Gender" errors={errors.gender}>
            <Input id="gender" name="gender" defaultValue={field("gender")} maxLength={30} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Contact Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Field id="email" label="Email" errors={errors.email}>
            <Input id="email" name="email" type="email" defaultValue={field("email")} maxLength={255} />
          </Field>
          <Field id="primary_phone" label="Primary phone" required errors={errors.primary_phone}>
            <Input
              id="primary_phone"
              name="primary_phone"
              defaultValue={field("primary_phone")}
              required
              maxLength={30}
            />
          </Field>
          <Field id="secondary_phone" label="Secondary phone" errors={errors.secondary_phone}>
            <Input
              id="secondary_phone"
              name="secondary_phone"
              defaultValue={field("secondary_phone")}
              maxLength={30}
            />
          </Field>
          <Field id="address" label="Home address" errors={errors.address}>
            <Input id="address" name="address" defaultValue={field("address")} maxLength={300} />
          </Field>
          <Field id="city_parish" label="City / Parish" errors={errors.city_parish}>
            <Input id="city_parish" name="city_parish" defaultValue={field("city_parish")} maxLength={100} />
          </Field>
          <Field id="country" label="Country" errors={errors.country}>
            <Input id="country" name="country" defaultValue={field("country")} maxLength={100} />
          </Field>
          <Field id="emergency_contact_name" label="Emergency contact name" errors={errors.emergency_contact_name}>
            <Input
              id="emergency_contact_name"
              name="emergency_contact_name"
              defaultValue={field("emergency_contact_name")}
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
              defaultValue={field("emergency_contact_phone")}
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
              defaultValue={field("drivers_license_number")}
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
              defaultValue={field("drivers_license_issuing_country")}
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
              defaultValue={field("drivers_license_issue_date")}
            />
          </Field>
          <Field id="drivers_license_expiry" label="License expiry" errors={errors.drivers_license_expiry}>
            <Input
              id="drivers_license_expiry"
              name="drivers_license_expiry"
              type="date"
              defaultValue={field("drivers_license_expiry")}
            />
          </Field>
          <Field id="identification_type" label="ID type" errors={errors.identification_type}>
            <Input
              id="identification_type"
              name="identification_type"
              placeholder="e.g. National ID"
              defaultValue={field("identification_type")}
              maxLength={50}
            />
          </Field>
          <Field id="identification_number" label="ID number" errors={errors.identification_number}>
            <Input
              id="identification_number"
              name="identification_number"
              defaultValue={field("identification_number")}
              maxLength={50}
            />
          </Field>
          <Field id="passport_number" label="Passport number" errors={errors.passport_number}>
            <Input
              id="passport_number"
              name="passport_number"
              defaultValue={field("passport_number")}
              maxLength={50}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Identification Documents</h3>
          <p className="text-xs text-muted-foreground">
            Optional — attach a photo or scan now, or skip and do it later from{" "}
            {customerId ? (
              <Link href={`/customers/${customerId}`} className="underline">
                this customer&apos;s Documents tab
              </Link>
            ) : (
              "the customer's Documents tab"
            )}
            . JPG, PNG or PDF, up to 10MB each.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="doc_license_front">Driver&apos;s License (Front)</Label>
            <input
              id="doc_license_front"
              name="doc_license_front"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className={fileInputClassName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc_license_back">Driver&apos;s License (Back)</Label>
            <input
              id="doc_license_back"
              name="doc_license_back"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className={fileInputClassName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc_id_file">National ID / Passport</Label>
            <div className="flex gap-2">
              <Select name="doc_id_type" defaultValue="national_id">
                <SelectTrigger className="w-32 shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ID_DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {DOCUMENT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                id="doc_id_file"
                name="doc_id_file"
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className={fileInputClassName}
              />
            </div>
          </div>
        </div>
      </section>

      {canManageAccountLink ? (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Website Account</h3>
          <div className="space-y-2">
            <Label htmlFor="website_account_email">
              Connect to their online account (optional)
            </Label>
            <Input
              id="website_account_email"
              name="website_account_email"
              type="email"
              placeholder="the email they signed up with"
              defaultValue={accountEmailValue}
            />
            <p className="text-xs text-muted-foreground">
              If they&apos;ve signed up on the website with this email, this connects their login
              to this customer record so they can see their bookings and book online. Leave blank
              if they don&apos;t have an account yet, or clear it to disconnect one already linked.
            </p>
          </div>
        </section>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={4} defaultValue={field("notes")} />
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
