"use client";

import Link from "next/link";
import { MoreVertical, MessageSquare, Eye, Pencil, Trash2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fileTypeMeta, STATUS_META } from "@/lib/file-type";
import { formatBytes, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DocumentSummary } from "@/types";

interface DocumentCardProps {
  document: DocumentSummary;
  view?: "grid" | "list";
  onRename: (document: DocumentSummary) => void;
  onDelete: (document: DocumentSummary) => void;
}

export function DocumentCard({
  document,
  view = "grid",
  onRename,
  onDelete,
}: DocumentCardProps) {
  const meta = fileTypeMeta(document.fileType);
  const status = STATUS_META[document.processingStatus];
  const Icon = meta.icon;
  const isReady = document.processingStatus === "READY";

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md",
        view === "grid" ? "flex flex-col p-5" : "flex items-center gap-4 p-4"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3",
          view === "list" && "min-w-0 flex-1"
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg",
            meta.iconClassName,
            view === "grid" ? "h-11 w-11" : "h-10 w-10"
          )}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <Link
            href={`/documents/${document.id}`}
            className="block truncate text-sm font-semibold transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            title={document.title}
          >
            {document.title}
          </Link>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {meta.label} · {formatBytes(document.fileSize)} ·{" "}
            {formatDate(document.createdAt)}
          </p>
        </div>

        {view === "list" ? (
          <div className="hidden items-center gap-2 md:flex">
            <Badge variant={status.variant}>{status.label}</Badge>
            {document.collections.slice(0, 2).map((collection) => (
              <Badge key={collection.id} variant="outline">
                {collection.name}
              </Badge>
            ))}
          </div>
        ) : null}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Actions for ${document.title}`}
              className="opacity-60 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild disabled={!isReady}>
              <Link href={`/documents/${document.id}`}>
                <Eye aria-hidden="true" /> Open document
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild disabled={!isReady}>
              <Link href={`/chat?documentId=${document.id}`}>
                <MessageSquare aria-hidden="true" /> Start AI chat
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`/api/documents/${document.id}/file?download=1`}>
                <Download aria-hidden="true" /> Download
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onRename(document)}>
              <Pencil aria-hidden="true" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => onDelete(document)}
            >
              <Trash2 aria-hidden="true" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {view === "grid" ? (
        <>
          <p className="mt-3 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
            {document.wordCount > 0
              ? `${document.wordCount.toLocaleString()} words${
                  document.pageCount ? ` · ${document.pageCount} pages` : ""
                }`
              : "Not yet processed"}
          </p>
          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <Badge variant={status.variant}>{status.label}</Badge>
            {isReady ? (
              <Button asChild variant="ghost" size="sm" className="-mr-2 text-primary hover:text-primary">
                <Link href={`/chat?documentId=${document.id}`}>
                  <MessageSquare aria-hidden="true" /> Chat
                </Link>
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
