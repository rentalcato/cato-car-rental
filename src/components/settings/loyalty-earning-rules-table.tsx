"use client";

import { useActionState, useState, useTransition, type ReactElement } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  createEarningRule,
  deleteEarningRule,
  setEarningRuleActive,
  updateEarningRule,
  type LoyaltyActionState,
} from "@/lib/loyalty/actions";
import type { LoyaltyEarningRule } from "@/types/database.types";

const initialState: LoyaltyActionState = {};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p role="alert" className="text-xs text-destructive">
      {errors[0]}
    </p>
  );
}

/** One dialog handles both Add (no `rule`) and Edit (`rule` passed) — action_key is only ever collected on create, see lib/loyalty/schema.ts. */
function EarningRuleFormDialog({ rule, trigger }: { rule?: LoyaltyEarningRule; trigger: ReactElement }) {
  const [open, setOpen] = useState(false);
  const action = rule ? updateEarningRule.bind(null, rule.id) : createEarningRule;
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};

  // "Adjusting state during render" (not an effect) for the one-shot
  // "close on success" reaction to a fresh action result — see
  // https://react.dev/learn/you-might-not-need-an-effect.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.success) setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Earning Rule" : "Add Earning Rule"}</DialogTitle>
          <DialogDescription>
            {rule
              ? "Change how this action is described or how many points it awards."
              : "Define a new action that awards loyalty points."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4" noValidate>
          {!rule ? (
            <div className="space-y-2">
              <Label htmlFor="action_key">
                Action key{" "}
                <span className="text-xs font-normal text-muted-foreground">(internal, can&apos;t be changed later)</span>
              </Label>
              <Input id="action_key" name="action_key" placeholder="e.g. birthday_bonus" required maxLength={60} />
              <FieldError errors={errors.action_key} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Action key</Label>
              <p className="rounded-md border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
                {rule.action_key}
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={rule?.name} required maxLength={120} />
            <FieldError errors={errors.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={rule?.description ?? ""} maxLength={500} />
            <FieldError errors={errors.description} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="points">Points awarded</Label>
            <Input id="points" name="points" type="number" defaultValue={rule?.points ?? 0} required />
            <FieldError errors={errors.points} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              className="size-4 rounded border-input"
              defaultChecked={rule?.is_active ?? true}
            />
            Active
          </label>
          {state.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteRuleDialog({ rule }: { rule: LoyaltyEarningRule }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteEarningRule(rule.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="outline" size="icon-sm" />}>
        <Trash2 className="size-3.5" />
        <span className="sr-only">Delete {rule.name}</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{rule.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            {rule.is_system
              ? "This is one of the rules a real system event awards automatically — deleting it just means that event stops earning points going forward. Past point history is unaffected."
              : "This can't be undone. Past point history awarded under this rule is unaffected."}
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
            {isPending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ActiveToggle({ rule }: { rule: LoyaltyEarningRule }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded border-input"
          checked={rule.is_active}
          disabled={isPending}
          onChange={(e) => {
            setError(null);
            startTransition(async () => {
              const result = await setEarningRuleActive(rule.id, e.target.checked);
              if (result.error) setError(result.error);
            });
          }}
        />
        {rule.is_active ? "Active" : "Inactive"}
      </label>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function LoyaltyEarningRulesTable({ rules }: { rules: LoyaltyEarningRule[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Actions that award loyalty points. Rules marked <Badge variant="outline">System</Badge> are also
          triggered automatically by real events (account linked, rental completed, payment received) — the
          rest are available for staff to award manually from a customer&apos;s profile.
        </p>
        <EarningRuleFormDialog
          trigger={
            <Button size="sm" className="shrink-0">
              <Plus className="size-3.5" />
              Add Rule
            </Button>
          }
        />
      </div>

      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground">No earning rules yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Action Key</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-1" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <p className="font-medium">{rule.name}</p>
                    {rule.description ? (
                      <p className="text-xs text-muted-foreground">{rule.description}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <code className="text-xs">{rule.action_key}</code>
                    {rule.is_system ? (
                      <Badge variant="outline" className="ml-1.5 align-middle">
                        System
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {rule.points.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <ActiveToggle rule={rule} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <EarningRuleFormDialog
                        rule={rule}
                        trigger={
                          <Button variant="outline" size="icon-sm">
                            <Pencil className="size-3.5" />
                            <span className="sr-only">Edit {rule.name}</span>
                          </Button>
                        }
                      />
                      <DeleteRuleDialog rule={rule} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
