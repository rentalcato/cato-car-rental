"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Download, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CUSTOMER_UPLOADABLE_DOCUMENT_TYPES } from "@/lib/constants";
import { DOCUMENT_TYPE_LABELS } from "@/components/customers/customer-documents-panel";
import { formatDate } from "@/lib/format";
import {
  getMyDocumentAccessUrl,
  uploadMyDocument,
  type DocumentActionState,
} from "@/lib/account/actions";
import type { CustomerDocument } from "@/types/database.types";

const initialState: DocumentActionState = {};

function isExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate).getTime() < Date.now();
}

/**
 * Self-service counterpart to CustomerDocumentsPanel (staff-side): a
 * linked customer can add their own ID/license documents, but not
 * delete one already on file — that stays a staff-only action, same as
 * the document types offered here (no rental_agreement/signed_document,
 * those are staff-generated).
 */
export function MyDocumentsPanel({ documents }: { documents: CustomerDocument[] }) {
  const [state, formAction, pending] = useActionState(uploadMyDocument, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  function handleView(doc: CustomerDocument) {
    setAccessError(null);
    startTransition(async () => {
      const result = await getMyDocumentAccessUrl(doc.id);
      if (result.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      } else {
        setAccessError(result.error ?? "Could not open this document.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <form
        ref={formRef}
        action={formAction}
        className="grid grid-cols-1 gap-3 rounded-md border p-4 sm:grid-cols-2 md:grid-cols-3"
      >
        <div className="space-y-2">
          <Label htmlFor="document_type">Document type</Label>
          <Select name="document_type" defaultValue={CUSTOMER_UPLOADABLE_DOCUMENT_TYPES[0]}>
            <SelectTrigger id="document_type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CUSTOMER_UPLOADABLE_DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {DOCUMENT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="file">File (JPG, PNG or PDF)</Label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            required
            className="flex h-8 w-full rounded-lg border border-input bg-transparent text-sm file:mr-3 file:h-full file:border-0 file:bg-secondary file:px-2.5 file:text-sm file:font-medium file:text-secondary-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiry_date">Expiry date (if any)</Label>
          <input
            id="expiry_date"
            name="expiry_date"
            type="date"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        {state.error ? (
          <p role="alert" className="text-sm text-destructive sm:col-span-2 md:col-span-3">
            {state.error}
          </p>
        ) : null}
        <div className="sm:col-span-2 md:col-span-3">
          <Button type="submit" size="sm" disabled={pending}>
            <Upload className="size-3.5" />
            {pending ? "Uploading…" : "Upload document"}
          </Button>
        </div>
      </form>

      {accessError ? (
        <p role="alert" className="text-sm text-destructive">
          {accessError}
        </p>
      ) : null}

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between gap-3 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {DOCUMENT_TYPE_LABELS[doc.document_type]}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {doc.file_name} · Uploaded {formatDate(doc.uploaded_at)}
                      {doc.expiry_date ? (
                        <>
                          {" "}
                          · Expires {formatDate(doc.expiry_date)}
                          {isExpired(doc.expiry_date) ? (
                            <Badge variant="destructive" className="ml-1.5 align-middle">
                              Expired
                            </Badge>
                          ) : null}
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="icon-sm" onClick={() => handleView(doc)}>
                  <Download className="size-3.5" />
                  <span className="sr-only">View {doc.file_name}</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
