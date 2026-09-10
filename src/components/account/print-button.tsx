"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Print-to-PDF stands in for a generated invoice download — no PDF-generation backend exists yet, and every browser's print dialog already offers "Save as PDF". */
export function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
      <Printer className="size-3.5" />
      {label}
    </Button>
  );
}
