"use client";

import * as React from "react";
import Link from "next/link";
import {
  LayoutGrid,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { DocumentCard } from "@/components/documents/document-card";
import {
  RenameDialog,
  DeleteDocumentDialog,
} from "@/components/documents/document-dialogs";
import { cn } from "@/lib/utils";
import type { DocumentSummary } from "@/types";

interface DocumentsViewProps {
  initialDocuments: DocumentSummary[];
}

export function DocumentsView({ initialDocuments }: DocumentsViewProps) {
  const [documents, setDocuments] =
    React.useState<DocumentSummary[]>(initialDocuments);
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [typeFilter, setTypeFilter] = React.useState<string>("ALL");
  const [sort, setSort] = React.useState<string>("recent");
  const [view, setView] = React.useState<"grid" | "list">("grid");
  const [loading, setLoading] = React.useState(false);

  const [renameTarget, setRenameTarget] =
    React.useState<DocumentSummary | null>(null);
  const [deleteTarget, setDeleteTarget] =
    React.useState<DocumentSummary | null>(null);

  // Debounced server search.
  React.useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const hasPending = React.useMemo(
    () =>
      documents.some(
        (doc) =>
          doc.processingStatus === "QUEUED" ||
          doc.processingStatus === "PROCESSING"
      ),
    [documents]
  );

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (sort) params.set("sort", sort);

      const response = await fetch(`/api/documents?${params.toString()}`, {
        cache: "no-store",
      });
      if (response.ok) {
        const data: { documents: DocumentSummary[] } = await response.json();
        setDocuments(data.documents);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, statusFilter, typeFilter, sort]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  // Poll while documents are processing so statuses update live.
  React.useEffect(() => {
    if (!hasPending) return;
    const interval = setInterval(() => void refresh(), 3000);
    return () => clearInterval(interval);
  }, [hasPending, refresh]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your personal knowledge library —{" "}
            {documents.length.toLocaleString()} document
            {documents.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild>
          <Link href="/documents?upload=1">
            <Plus aria-hidden="true" /> Upload document
          </Link>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title…"
            className="pl-9"
            aria-label="Search documents by title"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="min-w-0 flex-1 sm:w-[130px] sm:flex-none" aria-label="Filter by file type">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="PDF">PDF</SelectItem>
              <SelectItem value="TXT">TXT</SelectItem>
              <SelectItem value="MD">Markdown</SelectItem>
              <SelectItem value="DOCX">DOCX</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="min-w-0 flex-1 sm:w-[140px] sm:flex-none" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All status</SelectItem>
              <SelectItem value="READY">Ready</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="min-w-0 flex-1 sm:w-[150px] sm:flex-none" aria-label="Sort documents">
              <SlidersHorizontal className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="largest">Largest first</SelectItem>
            </SelectContent>
          </Select>

          <div
            className="flex items-center rounded-lg border p-0.5"
            role="group"
            aria-label="Toggle view mode"
          >
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
              aria-label="Grid view"
              className={cn(view === "grid" && "bg-accent")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              aria-label="List view"
              className={cn(view === "list" && "bg-accent")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative mt-6">
        {loading ? (
          <div className="pointer-events-none absolute right-0 -top-10 text-xs text-muted-foreground">
            Updating…
          </div>
        ) : null}

        {documents.length === 0 ? (
          debouncedQuery || statusFilter !== "ALL" || typeFilter !== "ALL" ? (
            <EmptyState
              icon={Search}
              title="No matching documents found."
              description="Try adjusting your search terms or clearing the filters."
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("ALL");
                    setTypeFilter("ALL");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Upload}
              title="Your knowledge starts here."
              description="Upload your first document and start asking questions against it within seconds."
              action={
                <Button asChild>
                  <Link href="/documents?upload=1">
                    <Upload aria-hidden="true" /> Upload your first document
                  </Link>
                </Button>
              }
            />
          )
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                view="grid"
                onRename={setRenameTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((document) => (
              <DocumentCard
                key={document.id}
                document={document}
                view="list"
                onRename={setRenameTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      <RenameDialog document={renameTarget} onClose={() => setRenameTarget(null)} />
      <DeleteDocumentDialog
        document={deleteTarget}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export function DocumentsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-44" />
      <div className="mt-6 flex gap-3">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-[130px]" />
        <Skeleton className="h-9 w-[140px]" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
