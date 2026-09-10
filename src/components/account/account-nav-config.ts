import {
  Bell,
  Car,
  CalendarClock,
  CreditCard,
  Gift,
  Heart,
  LayoutDashboard,
  LifeBuoy,
  User,
  type LucideIcon,
} from "lucide-react";

export interface AccountNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Shows the live unread-notifications count as a badge next to this item. */
  showUnreadBadge?: boolean;
}

/**
 * Primary nav for the customer dashboard (/account) — mirrors
 * src/components/layout/nav-config.ts's role as the single source of
 * truth for the staff sidebar. "Upcoming Booking" and "Rental History"
 * (spec'd separately) live as tabs on My Rentals rather than their own
 * entries — same content, one less item competing for space in the
 * sidebar. "Rental Agreement" lives on each booking's detail page
 * ("View Agreement") rather than the top-level nav, per the same
 * don't-overcrowd principle.
 */
export const ACCOUNT_NAV_ITEMS: AccountNavItem[] = [
  { label: "Dashboard", href: "/account", icon: LayoutDashboard },
  { label: "Book a Car", href: "/account/fleet", icon: Car },
  { label: "My Rentals", href: "/account/rentals", icon: CalendarClock },
  { label: "Favorites", href: "/account/favorites", icon: Heart },
  { label: "Payments & Invoices", href: "/account/payments", icon: CreditCard },
  { label: "Notifications", href: "/account/notifications", icon: Bell, showUnreadBadge: true },
  { label: "Profile", href: "/account/profile", icon: User },
  { label: "Support", href: "/account/support", icon: LifeBuoy },
];

/** Kept visually secondary (see account-sidebar-nav.tsx) — optional per the feature spec, easy to promote later. */
export const ACCOUNT_SECONDARY_NAV_ITEMS: AccountNavItem[] = [
  { label: "Loyalty & Rewards", href: "/account/loyalty", icon: Gift },
];
