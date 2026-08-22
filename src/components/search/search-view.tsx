"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, MessagesSquare, Search, TextSearch } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatRelativeTime } from "@/lib/format";
import type { SearchResult } from "@/types";

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const parts = text.split(
    new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  );

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark
            key={index}
            className="rounded bg-primary/20 px-0.5 text-primary dark:text-primary-foreground"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

const TYPE_META: Record<
  SearchResult["type"],
  { label: string; icon: typeof FileText }
> = {
  document: { label: "Document", icon: FileText },
  conversation: { label: "Conversation", icon: MessagesSquare },
  text: { label: "Text match", icon: TextSearch },
};

export function SearchView() {
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  React.useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    (async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(debouncedQuery)}`,
          { signal: controller.signal }
        );
        if (response.ok) {
          const data: { results: SearchResult[] } = await response.json();
          setResults(data.results);
        }
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
        setSearched(true);
      }
    })();

    return () => controller.abort();
  }, [debouncedQuery]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Find documents, conversations and passages across your entire library.
      </p>

      <div className="relative mt-6">
        <Search
          className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search everything…"
          className="h-11 pl-10 text-base"
          autoFocus
          aria-label="Search your knowledge base"
        />
        {loading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2" role="status" aria-label="Searching">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-3">
        {!searched && debouncedQuery.length < 2 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Type at least two characters to start searching.
          </p>
        ) : null}

        {loading && results.length === 0 ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))
        ) : null}

        {searched && !loading && results.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching documents found."
            description={`Nothing matched “${debouncedQuery}”. Try different keywords or check the spelling.`}
          />
        ) : null}

        {results.map((result) => {
          const meta = TYPE_META[result.type];
          const Icon = meta.icon;
          const href =
            result.type === "conversation"
              ? `/chat/${result.id}`
              : result.documentId
                ? `/documents/${result.documentId}`
                : "/documents";

          return (
            <Link
              key={`${result.type}-${result.id}`}
              href={href}
              className="block rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    <Highlighted text={result.title} query={debouncedQuery} />
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    <Highlighted text={result.snippet} query={debouncedQuery} />
                  </p>
                </div>
                <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                  <Badge variant="outline">{meta.label}</Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelativeTime(result.date)}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
