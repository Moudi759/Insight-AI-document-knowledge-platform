"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileText,
  Info,
  MessageSquare,
  MessagesSquare,
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

export function DocumentViewer({ document }: { document: DocumentDetail }) {
  const meta = fileTypeMeta(document.fileType);
  const status = STATUS_META[document.processingStatus];
  const Icon = meta.icon;
  const isPdf = document.fileType === "PDF";

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
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
          {isPdf ? (
            <iframe
              src={`/api/documents/${document.id}/file#view=FitH`}
              title={document.title}
              className="h-full w-full border-0 bg-white"
            />
          ) : (
            <ExtractedTextViewer text={document.extractedText} status={document.processingStatus} />
          )}
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
                {isPdf ? (
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
                    status={document.processingStatus}
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

export function DocumentViewerSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
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
