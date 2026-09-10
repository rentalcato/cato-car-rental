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
import { createReward, deleteReward, setRewardActive, updateReward, type LoyaltyActionState } from "@/lib/loyalty/actions";
import { REWARD_TYPES } from "@/lib/loyalty/schema";
import { getRewardTypeLabel } from "@/lib/loyalty/labels";
import type { LoyaltyReward } from "@/types/database.types";

const initialState: LoyaltyActionState = {};

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p role="alert" className="text-xs text-destructive">
      {errors[0]}
    </p>
  );
}

function RewardFormDialog({ reward, trigger }: { reward?: LoyaltyReward; trigger: ReactElement }) {
  const [open, setOpen] = useState(false);
  const action = reward ? updateReward.bind(null, reward.id) : createReward;
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};

  // "Adjusting state during render" (not an effect) — see the matching
  // comment in loyalty-earning-rules-table.tsx.
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
          <DialogTitle>{reward ? "Edit Reward" : "Add Reward"}</DialogTitle>
          <DialogDescription>
            {reward
              ? "Change this reward's details or points requirement."
              : "Define a new reward customers can redeem points for."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">Reward name</Label>
            <Input id="name" name="name" defaultValue={reward?.name} required maxLength={120} />
            <FieldError errors={errors.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={reward?.description ?? ""} maxLength={500} />
            <FieldError errors={errors.description} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="points_required">Points required</Label>
              <Input
                id="points_required"
                name="points_required"
                type="number"
                min={1}
                defaultValue={reward?.points_required ?? 500}
                required
              />
              <FieldError errors={errors.points_required} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reward_type">Reward type</Label>
              <Select name="reward_type" defaultValue={reward?.reward_type ?? "custom"}>
                <SelectTrigger id="reward_type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REWARD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getRewardTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={errors.reward_type} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reward_value">
              Reward value{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (shown to customers, e.g. &ldquo;$10&rdquo;, &ldquo;15%&rdquo;, &ldquo;1 day&rdquo;)
              </span>
            </Label>
            <Input id="reward_value" name="reward_value" defaultValue={reward?.reward_value ?? ""} maxLength={100} />
            <FieldError errors={errors.reward_value} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              className="size-4 rounded border-input"
              defaultChecked={reward?.is_active ?? true}
            />
            Active — visible to customers
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

function DeleteRewardDialog({ reward }: { reward: LoyaltyReward }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteReward(reward.id);
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
        <span className="sr-only">Delete {reward.name}</span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &ldquo;{reward.name}&rdquo;?</AlertDialogTitle>
          <AlertDialogDescription>
            This can&apos;t be undone. Past redemptions of this reward stay in customers&apos; history —
            deleting it only removes it from what&apos;s offered going forward. Deactivating instead keeps
            it around to re-enable later.
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

function ActiveToggle({ reward }: { reward: LoyaltyReward }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded border-input"
          checked={reward.is_active}
          disabled={isPending}
          onChange={(e) => {
            setError(null);
            startTransition(async () => {
              const result = await setRewardActive(reward.id, e.target.checked);
              if (result.error) setError(result.error);
            });
          }}
        />
        {reward.is_active ? "Active" : "Inactive"}
      </label>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function LoyaltyRewardsTable({ rewards }: { rewards: LoyaltyReward[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          What customers can redeem their points for. Changes here reflect immediately on the customer
          Loyalty &amp; Rewards page.
        </p>
        <RewardFormDialog
          trigger={
            <Button size="sm" className="shrink-0">
              <Plus className="size-3.5" />
              Add Reward
            </Button>
          }
        />
      </div>

      {rewards.length === 0 ? (
        <p className="text-sm text-muted-foreground">No rewards yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reward</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-1" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rewards.map((reward) => (
                <TableRow key={reward.id}>
                  <TableCell>
                    <p className="font-medium">{reward.name}</p>
                    {reward.description ? (
                      <p className="text-xs text-muted-foreground">{reward.description}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{getRewardTypeLabel(reward.reward_type)}</TableCell>
                  <TableCell className="text-muted-foreground">{reward.reward_value || "—"}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {reward.points_required.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <ActiveToggle reward={reward} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <RewardFormDialog
                        reward={reward}
                        trigger={
                          <Button variant="outline" size="icon-sm">
                            <Pencil className="size-3.5" />
                            <span className="sr-only">Edit {reward.name}</span>
                          </Button>
                        }
                      />
                      <DeleteRewardDialog reward={reward} />
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
