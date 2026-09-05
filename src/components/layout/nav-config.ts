import {
  LayoutDashboard,
  Car,
  Users,
  FileText,
  CalendarClock,
  CreditCard,
  Wrench,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/auth/roles";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: readonly Role[];
}

/**
 * Single source of truth for sidebar navigation + route-level access.
 * Staff sees a reduced, read-only-in-practice set for now — "Staff
 * permissions configurable later" per the Phase 1 spec. To grant staff a
 * module, add 'staff' to its `roles` array here (the matching table's RLS
 * policy in supabase/migrations/0003_rls_policies.sql already allows staff
 * to SELECT everything; write access still requires a manager/super_admin
 * policy change).
 */
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["super_admin", "manager", "staff"],
  },
  {
    label: "Vehicles",
    href: "/dashboard/vehicles",
    icon: Car,
    roles: ["super_admin", "manager", "staff"],
  },
  {
    label: "Customers",
    href: "/dashboard/customers",
    icon: Users,
    roles: ["super_admin", "manager", "staff"],
  },
  {
    label: "Rentals",
    href: "/dashboard/rentals",
    icon: FileText,
    roles: ["super_admin", "manager", "staff"],
  },
  {
    label: "Reservations",
    href: "/dashboard/reservations",
    icon: CalendarClock,
    roles: ["super_admin", "manager", "staff"],
  },
  {
    label: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
    roles: ["super_admin", "manager"],
  },
  {
    label: "Maintenance",
    href: "/dashboard/maintenance",
    icon: Wrench,
    roles: ["super_admin", "manager"],
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["super_admin", "manager"],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["super_admin"],
  },
];
