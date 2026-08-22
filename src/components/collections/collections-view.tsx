"use client";

import * as React from "react";
import {
  FolderKanban,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  FileStack,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import {
  CollectionDialog,
  DeleteCollectionDialog,
  ManageDocumentsDialog,
} from "@/components/collections/collection-dialogs";
import type { CollectionSummary, DocumentSummary } from "@/types";

interface CollectionsViewProps {
  collections: CollectionSummary[];
  documents: DocumentSummary[];
}

export function CollectionsView({
  collections,
  documents,
}: CollectionsViewProps) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CollectionSummary | null>(null);
  const [deleting, setDeleting] = React.useState<CollectionSummary | null>(null);
  const [managing, setManaging] = React.useState<CollectionSummary | null>(null);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Collections</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Organize documents into groups — University, Research, Projects…
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden="true" /> New collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={FolderKanban}
            title="No collections yet."
            description="Collections keep related documents together so you can find and chat with them faster."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus aria-hidden="true" /> Create your first collection
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="group relative rounded-xl border bg-card p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${collection.color}1f`, color: collection.color }}
                >
                  <FolderKanban className="h-5 w-5" aria-hidden="true" />
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${collection.name}`}
                      className="opacity-60 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onSelect={() => setManaging(collection)}>
                      <FileStack aria-hidden="true" /> Manage documents
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setEditing(collection)}>
                      <Pencil aria-hidden="true" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setDeleting(collection)}
                    >
                      <Trash2 aria-hidden="true" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="mt-3 truncate text-sm font-semibold">{collection.name}</h3>
              {collection.description ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {collection.description}
                </p>
              ) : null}

              <div className="mt-4 flex items-center justify-between border-t pt-3">
                <span className="text-xs text-muted-foreground">
                  {collection.documentCount} document
                  {collection.documentCount === 1 ? "" : "s"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-mr-2 text-primary hover:text-primary"
                  onClick={() => setManaging(collection)}
                >
                  Manage
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CollectionDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <CollectionDialog
        open={Boolean(editing)}
        editing={editing}
        onClose={() => setEditing(null)}
      />
      <DeleteCollectionDialog collection={deleting} onClose={() => setDeleting(null)} />
      <ManageDocumentsDialog
        collection={managing}
        documents={documents}
        memberIds={
          managing
            ? documents
                .filter((document) =>
                  document.collections.some((c) => c.id === managing.id)
                )
                .map((document) => document.id)
            : []
        }
        onClose={() => setManaging(null)}
      />
    </div>
  );
}

export function CollectionsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-48" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
