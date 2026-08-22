"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface SearchResultItem {
  type: string;
  id: string;
  title: string;
  snippet: string;
  documentId: string | null;
}

const NAVIGATION_ITEMS = [
  { label: "Overview", href: "/dashboard" },
  { label: "Documents", href: "/documents" },
  { label: "AI Chat", href: "/chat" },
  { label: "Collections", href: "/collections" },
  { label: "Search", href: "/search" },
  { label: "Analytics", href: "/analytics" },
  { label: "Settings", href: "/settings" },
];

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResultItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (response.ok) {
          const data: { results: SearchResultItem[] } = await response.json();
          setResults(data.results.slice(0, 6));
        }
      } catch {
        /* aborted or network error — palette simply shows no results */
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, open]);

  function run(href: string) {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <CommandPrimitive shouldFilter={false} className="outline-none">
          <div className="flex items-center gap-3 border-b px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <CommandPrimitive.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search documents, conversations…"
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
            />
          </div>
          <CommandPrimitive.List className="max-h-80 overflow-y-auto overflow-x-hidden p-2">
            <CommandPrimitive.Empty className="py-8 text-center text-sm text-muted-foreground">
              {loading
                ? "Searching…"
                : query.trim().length < 2
                  ? "Type to search your knowledge base."
                  : "No matching results found."}
            </CommandPrimitive.Empty>

            {NAVIGATION_ITEMS.filter((item) =>
              item.label.toLowerCase().includes(query.trim().toLowerCase())
            ).length > 0 ? (
              <CommandPrimitive.Group heading="Navigate" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                {NAVIGATION_ITEMS.map((item) => (
                  <CommandPrimitive.Item
                    key={item.href}
                    onSelect={() => run(item.href)}
                    className="cursor-pointer rounded-md px-2 py-2 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    {item.label}
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            ) : null}

            {results.length > 0 ? (
              <CommandPrimitive.Group heading="Results" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                {results.map((result) => (
                  <CommandPrimitive.Item
                    key={`${result.type}-${result.id}`}
                    value={`${result.title} ${result.snippet}`}
                    onSelect={() =>
                      run(
                        result.type === "conversation"
                          ? `/chat/${result.id}`
                          : result.documentId
                            ? `/documents/${result.documentId}`
                            : `/documents`
                      )
                    }
                    className="cursor-pointer rounded-md px-2 py-2 outline-none aria-selected:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{result.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{result.snippet}</p>
                    </div>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            ) : null}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}
