"use client";

import { useState } from "react";
import Link from "next/link";
import { Car, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { label: "Home", href: "#top" },
  { label: "Vehicles", href: "#fleet" },
  { label: "About", href: "#about" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Contact", href: "#contact" },
];

/**
 * Single lg breakpoint, matching the dashboard shell's own convention
 * (SidebarNav/Topbar): everything collapses into one mobile Sheet menu
 * below lg, and expands into the full three-zone bar at lg+.
 */
export function MarketingNav({
  businessName,
  logoUrl,
}: {
  businessName: string;
  logoUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Top-left: Sign In / Sign Up, as requested */}
        <div className="hidden items-center gap-2 lg:flex">
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>
            Sign In
          </Button>
          <Button size="sm" render={<Link href="/signup" />}>
            Sign Up
          </Button>
        </div>

        {/* Brand — centered at lg+, left-aligned on mobile. The uploaded
            logo is a full wordmark lockup, so it replaces the text
            entirely rather than sitting beside a redundant repeat of it. */}
        <Link
          href="#top"
          className="flex items-center gap-2 text-lg font-semibold lg:absolute lg:left-1/2 lg:-translate-x-1/2"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={businessName} className="h-9 w-auto shrink-0 object-contain" />
          ) : (
            <>
              <Car className="size-6" />
              {businessName}
            </>
          )}
        </Link>

        {/* Nav links, right-aligned at lg+ */}
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Mobile: single hamburger menu holds everything below lg */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
            <Menu className="size-5" />
            <span className="sr-only">Open menu</span>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex flex-col gap-1 pt-6">
              <div className="mb-4 flex flex-col gap-2">
                <Button render={<Link href="/signup" />} onClick={() => setOpen(false)}>
                  Sign Up
                </Button>
                <Button
                  variant="outline"
                  render={<Link href="/login" />}
                  onClick={() => setOpen(false)}
                >
                  Sign In
                </Button>
              </div>
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
