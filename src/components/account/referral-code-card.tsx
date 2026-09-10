"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ReferralCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (older browser, insecure context) — the code is still visible to copy by hand.
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3">
      <code className="flex-1 font-mono text-sm font-semibold tracking-wide">{code}</code>
      <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
