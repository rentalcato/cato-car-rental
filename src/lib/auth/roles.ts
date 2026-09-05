import type { UserRole } from "@/types/database.types";

export type Role = UserRole;

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  manager: "Manager",
  staff: "Staff",
  customer: "Customer (no dashboard access)",
};

/** Does `role` satisfy one of the `allowed` roles for a route/action? */
export function canAccess(role: Role | null | undefined, allowed: readonly Role[]): boolean {
  if (!role) return false;
  return allowed.includes(role);
}
