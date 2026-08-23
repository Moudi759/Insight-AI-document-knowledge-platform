"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  FileText,
  Info,
  Loader2,
  MessageSquare,
  MessagesSquare,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentChatPanel } from "@/components/documents/document-chat-panel";
import { fileTypeMeta, STATUS_META } from "@/lib/file-type";
import { formatBytes, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DocumentDetail } from "@/types";

export function DocumentViewer({ document: initialDocument }: { document: DocumentDetail }) {
  const router = useRouter();
  const [document, setDocument] = React.useState(initialDocument);
  const [retrying, setRetrying] = React.useState(false);
  const meta = fileTypeMeta(document.fileType);
  const status = STATUS_META[document.processingStatus];
  const Icon = meta.icon;
  const isPdf = document.fileType === "PDF";
  const isFailed = document.processingStatus === "FAILED";
  const isPending =
    document.processingStatus === "QUEUED" ||
    document.processingStatus === "PROCESSING";

  // While a retry is in flight (or the doc arrived mid-processing),
  // poll until it reaches a terminal state, then refresh server data.
  React.useEffect(() => {
    if (!retrying && !isPending) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/documents/${initialDocument.id}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data: { document: DocumentDetail } = await response.json();
        if (
          data.document.processingStatus === "READY" ||
          data.document.processingStatus === "FAILED"
        ) {
          setDocument(data.document);
          setRetrying(false);
          if (data.document.processingStatus === "READY") {
            toast.success("Document ready");
            router.refresh();
          }
        }
      } catch {
        /* transient errors — keep polling */
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [retrying, isPending, initialDocument.id, router]);

  async function handleRetry() {
    setRetrying(true);
    setDocument((current) => ({
      ...current,
      processingStatus: "PROCESSING",
      errorMessage: null,
    }));
    try {
      const response = await fetch(
        `/api/documents/${initialDocument.id}?action=reprocess`,
        { method: "PATCH" }
      );
      if (!response.ok) throw new Error();
    } catch {
      toast.error("Could not start reprocessing", {
        description: "Please try again.",
      });
      setRetrying(false);
    }
  }

  function renderContentPane() {
    if (isFailed) {
      return <FailedPane document={document} onRetry={() => void handleRetry()} retrying={retrying} />;
    }
    if (isPdf) {
      if (isPending || retrying) return <ProcessingPane />;
      return (
        <iframe
          src={`/api/documents/${document.id}/file#view=FitH`}
          title={document.title}
          className="h-full w-full border-0 bg-white"
        />
      );
    }
    return (
      <ExtractedTextViewer
        text={document.extractedText}
        status={retrying ? "PROCESSING" : document.processingStatus}
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] supports-[height:100dvh]:h-[calc(100dvh-4rem)] flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
        <Button asChild variant="ghost" size="icon-sm" aria-label="Back to documents">
          <Link href="/documents">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <span
          className={cn(
            "hidden h-8 w-8 items-center justify-center rounded-lg sm:flex",
            meta.iconClassName
          )}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{document.title}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {meta.label} · {formatBytes(document.fileSize)} ·{" "}
            {formatDate(document.createdAt)}
          </p>
        </div>
        <Badge variant={status.variant} className="shrink-0">
          {status.label}
        </Badge>
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <a href={`/api/documents/${document.id}/file?download=1`}>
            <Download aria-hidden="true" />
            <span className="hidden sm:inline">Download</span>
          </a>
        </Button>
      </header>

      {/* Desktop: 3 panes */}
      <div className="hidden min-h-0 flex-1 xl:grid xl:grid-cols-[280px_1fr_400px]">
        <aside className="overflow-y-auto border-r bg-sidebar p-5" aria-label="Document information">
          <InfoPanel document={document} />
        </aside>

        <section className="min-h-0 overflow-hidden" aria-label="Document content">
          {renderContentPane()}
        </section>

        <aside className="border-l" aria-label="AI assistant panel">
          <DocumentChatPanel
            documentId={document.id}
            documentTitle={document.title}
          />
        </aside>
      </div>

      {/* Mobile/tablet: tabbed */}
      <div className="min-h-0 flex-1 xl:hidden">
        <Tabs defaultValue="read" className="flex h-full flex-col gap-0">
          <TabsList className="mx-auto mt-2 shrink-0">
            <TabsTrigger value="read">
              <FileText aria-hidden="true" /> Document
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare aria-hidden="true" /> AI Assistant
            </TabsTrigger>
          </TabsList>

          <TabsContent value="read" className="mt-0 min-h-0 flex-1 overflow-hidden">
            <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] overflow-y-auto lg:grid-cols-[240px_minmax(0,1fr)] lg:overflow-hidden">
              <aside className="border-b bg-sidebar p-4 lg:overflow-y-auto lg:border-b-0 lg:border-r">
                <InfoPanel document={document} compact />
              </aside>
              <section className="min-h-0 overflow-y-auto" aria-label="Document content">
                {isFailed ? (
                  <FailedPane
                    document={document}
                    onRetry={() => void handleRetry()}
                    retrying={retrying}
                  />
                ) : isPdf && (isPending || retrying) ? (
                  <ProcessingPane />
                ) : isPdf ? (
                  <object
                    data={`/api/documents/${document.id}/file`}
                    type="application/pdf"
                    className="h-[70vh] w-full"
                    aria-label={`PDF preview of ${document.title}`}
                  >
                    <p className="p-6 text-center text-sm text-muted-foreground">
                      Inline PDF preview isn&apos;t supported on this device.{" "}
                      <a
                        className="text-primary underline"
                        href={`/api/documents/${document.id}/file?download=1`}
                      >
                        Download the file
                      </a>{" "}
                      instead.
                    </p>
                  </object>
                ) : (
                  <ExtractedTextViewer
                    text={document.extractedText}
                    status={retrying ? "PROCESSING" : document.processingStatus}
                  />
                )}
              </section>
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-0 min-h-0 flex-1">
            <div className="h-full">
              <DocumentChatPanel
                documentId={document.id}
                documentTitle={document.title}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function InfoPanel({
  document,
  compact,
}: {
  document: DocumentDetail;
  compact?: boolean;
}) {
  const rows = [
    { label: "File name", value: document.fileName },
    { label: "Type", value: fileTypeMeta(document.fileType).label },
    { label: "Size", value: formatBytes(document.fileSize) },
    {
      label: "Words",
      value:
        document.wordCount > 0 ? formatNumber(document.wordCount) : "—",
    },
    {
      label: "Pages",
      value: document.pageCount ? String(document.pageCount) : "—",
    },
    { label: "Uploaded", value: formatDate(document.createdAt) },
  ];

  return (
    <div className={cn(compact ? "space-y-4" : "space-y-5")}>
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Info className="h-3 w-3" aria-hidden="true" /> Details
        </p>
        <dl className="mt-3 space-y-2.5">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-[11px] text-muted-foreground">{row.label}</dt>
              <dd className="break-words text-sm font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {document.collections.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Collections
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {document.collections.map((collection) => (
              <Badge key={collection.id} variant="outline">
                <span
                  className="mr-1 h-2 w-2 rounded-full"
                  style={{ backgroundColor: collection.color }}
                  aria-hidden="true"
                />
                {collection.name}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <Button asChild className="w-full" size="sm">
        <Link href="/collections">
          <MessagesSquare aria-hidden="true" /> Organize into collections
        </Link>
      </Button>

      {document.errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-xs font-semibold text-destructive">Processing error</p>
          <p className="mt-1 break-words text-xs text-destructive/90">
            {document.errorMessage}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ExtractedTextViewer({
  text,
  status,
}: {
  text: string | null;
  status: string;
}) {
  if (!text && (status === "QUEUED" || status === "PROCESSING")) {
    return (
      <div className="space-y-4 p-6 sm:p-10">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
      </div>
    );
  }

  if (!text) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <FileText className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
        <p className="text-sm font-medium">No extracted text available</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          The document may have failed processing or contains no readable
          content.
        </p>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-8 sm:px-10" tabIndex={0}>
      <div className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground/90">
        {text}
      </div>
    </article>
  );
}

function FailedPane({
  document,
  onRetry,
  retrying,
}: {
  document: DocumentDetail;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border bg-destructive/10">
        <TriangleAlert className="h-5 w-5 text-destructive" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold">This document failed to process</p>
        <p className="mx-auto mt-1 max-w-sm break-words text-xs leading-relaxed text-muted-foreground">
          {document.errorMessage ??
            "The content could not be extracted from this file."}
        </p>
      </div>
      <Button size="sm" onClick={onRetry} disabled={retrying} className="mt-1">
        {retrying ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCw aria-hidden="true" />
        )}
        Try processing again
      </Button>
    </div>
  );
}

function ProcessingPane() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium">Processing document…</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
          Text is being extracted, chunked and indexed. This usually takes a
          few seconds.
        </p>
      </div>
    </div>
  );
}

export function DocumentViewerSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)] supports-[height:100dvh]:h-[calc(100dvh-4rem)] flex-col">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4 sm:px-6">
        <Skeleton className="h-8 w-8 rounded-md" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr_400px] max-xl:hidden">
        <div className="space-y-4 border-r bg-sidebar p-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
        <div className="space-y-3 p-10">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="border-l p-4">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
