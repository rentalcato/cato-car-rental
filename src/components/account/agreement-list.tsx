"use client";

import { useState, useTransition } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { getMyDocumentAccessUrl } from "@/lib/account/actions";
import type { CustomerDocument } from "@/types/database.types";

/**
 * Read-only counterpart to MyDocumentsPanel — a rental agreement is
 * staff-generated (see CUSTOMER_UPLOADABLE_DOCUMENT_TYPES, which
 * excludes it), so there's no upload form here, just "View Agreement".
 */
export function AgreementList({ documents }: { documents: CustomerDocument[] }) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleView(doc: CustomerDocument) {
    setError(null);
    startTransition(async () => {
      const result = await getMyDocumentAccessUrl(doc.id);
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        setError(result.error ?? "Could not open this document.");
      }
    });
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Your rental agreement isn&apos;t available to view online yet — it&apos;s prepared by our team
        and will appear here once it&apos;s ready, usually at pickup.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {documents.map((doc) => (
        <Card key={doc.id}>
          <CardContent className="flex items-center justify-between gap-3 p-3">
            <div className="flex min-w-0 items-center gap-3">
              <FileText className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{doc.file_name}</p>
                <p className="truncate text-xs text-muted-foreground">Added {formatDate(doc.uploaded_at)}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleView(doc)}>
              <Download className="size-3.5" />
              View Agreement
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
