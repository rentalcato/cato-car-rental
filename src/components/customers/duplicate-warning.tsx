import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Customer } from "@/types/database.types";

/**
 * Rendered inside `CustomerForm` when `createCustomer` finds possible
 * matches on license/ID/phone/email. The "Create anyway" button is a
 * second submit button in the *same* form — HTML only includes a submit
 * button's name/value in FormData when that button was the one clicked,
 * so no extra client state is needed to set `confirm_duplicate`.
 */
export function DuplicateWarning({ duplicates }: { duplicates: Customer[] }) {
  return (
    <div
      role="alert"
      className="space-y-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p>
          Found {duplicates.length === 1 ? "a possible match" : "possible matches"} on license,
          ID, phone or email — review before creating a duplicate profile:
        </p>
      </div>
      <ul className="space-y-1 pl-6">
        {duplicates.map((customer) => (
          <li key={customer.id}>
            <Link
              href={`/customers/${customer.id}`}
              target="_blank"
              className="font-medium underline underline-offset-2"
            >
              {customer.first_name} {customer.last_name}
            </Link>{" "}
            <span className="text-muted-foreground">({customer.customer_number})</span>
          </li>
        ))}
      </ul>
      <Button type="submit" name="confirm_duplicate" value="1" variant="outline" size="sm">
        Create anyway
      </Button>
    </div>
  );
}
