"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  FileText,
  RefreshCw,
  Sparkles,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { MarkdownContent } from "@/components/chat/markdown-content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MessageDTO } from "@/types";

function SourceChips({ sources }: { sources: NonNullable<MessageDTO["sources"]> }) {
  if (sources.length === 0) return null;

  const unique = new Map<string, { label: string; href: string }>();
  for (const source of sources) {
    const key = `${source.documentId}-${source.page ?? "n"}-${source.chunkIndex}`;
    if (unique.has(key)) continue;
    unique.set(key, {
      label: `${source.documentTitle}${
        source.page ? ` · p.${source.page}` : ` · §${source.chunkIndex + 1}`
      }`,
      href: `/documents/${source.documentId}`,
    });
  }

  return (
    <div className="mt-3 border-t pt-2.5">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Sources
      </p>
      <div className="flex flex-wrap gap-1.5">
        {Array.from(unique.entries()).map(([key, source]) => (
          <Link
            key={key}
            href={source.href}
            className="inline-flex max-w-full items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <FileText className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{source.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ChatMessage({
  message,
  isStreaming,
  canRegenerate,
  onRegenerate,
}: {
  message: MessageDTO;
  isStreaming?: boolean;
  canRegenerate?: boolean;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === "USER";

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <div
      className={cn(
        "group flex gap-3 animate-fade-up",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser ? (
        <span
          className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-indigo-500 to-violet-500 shadow-sm"
          aria-hidden="true"
        >
          <Sparkles className="h-3.5 w-3.5 text-white dark:text-primary-foreground" />
        </span>
      ) : null}

      <div className={cn("min-w-0", isUser ? "max-w-[85%]" : "max-w-[calc(100%-2.5rem)] flex-1")}>
        <div
          className={cn(
            "rounded-xl px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground"
              : "border bg-card"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {message.content}
            </p>
          ) : (
            <>
              {message.content ? (
                <MarkdownContent content={message.content} />
              ) : isStreaming ? (
                <span className="flex items-center gap-1.5 py-1" aria-live="polite">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Thinking…</span>
                </span>
              ) : null}
              {isStreaming && message.content ? (
                <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-primary align-middle" aria-hidden="true" />
              ) : null}
            </>
          )}
        </div>

        {/* Actions */}
        <div
          className={cn(
            "mt-1 flex items-center gap-1 opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100",
            isStreaming && "opacity-0"
          )}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={copy}
            aria-label={copied ? "Copied" : "Copy response"}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <Check className="h-3 w-3 text-success" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          {canRegenerate && onRegenerate && !isUser ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="!size-3 h-3 w-3" aria-hidden="true" /> Regenerate
            </Button>
          ) : null}
        </div>

        {!isUser && message.sources && !isStreaming ? (
          <SourceChips sources={message.sources} />
        ) : null}
      </div>

      {isUser ? (
        <span
          className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary"
          aria-hidden="true"
        >
          <UserRound className="h-3.5 w-3.5 text-secondary-foreground" />
        </span>
      ) : null}
    </div>
  );
}
