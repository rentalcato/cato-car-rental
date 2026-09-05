"use client";

import { useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { USER_ROLES } from "@/lib/constants";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { updateProfileRole, setProfileActive } from "@/lib/settings/actions";
import type { Profile, UserRole } from "@/types/database.types";

function StaffAccountRow({ profile, currentUserId }: { profile: Profile; currentUserId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isSelf = profile.id === currentUserId;

  function handleRoleChange(role: string | null) {
    if (!role) return;
    setError(null);
    startTransition(async () => {
      const result = await updateProfileRole(profile.id, role as UserRole);
      if (result.error) setError(result.error);
    });
  }

  function handleToggleActive() {
    setError(null);
    startTransition(async () => {
      const result = await setProfileActive(profile.id, !profile.is_active);
      if (result.error) setError(result.error);
    });
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        {profile.full_name || "—"}
        {isSelf ? (
          <Badge variant="outline" className="ml-2">
            You
          </Badge>
        ) : null}
      </TableCell>
      <TableCell className="text-muted-foreground">{profile.email || "—"}</TableCell>
      <TableCell>
        <Select
          value={profile.role}
          onValueChange={handleRoleChange}
          disabled={isPending || isSelf}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {USER_ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Badge variant={profile.is_active ? "secondary" : "outline"}>
          {profile.is_active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending || isSelf}
          onClick={handleToggleActive}
        >
          {profile.is_active ? "Deactivate" : "Reactivate"}
        </Button>
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </TableCell>
    </TableRow>
  );
}

export function StaffAccountsTable({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-1" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => (
            <StaffAccountRow key={profile.id} profile={profile} currentUserId={currentUserId} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
