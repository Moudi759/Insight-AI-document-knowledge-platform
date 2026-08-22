"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, FolderPlus, Pencil, Trash2, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { CollectionSummary, DocumentSummary } from "@/types";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

interface CollectionDialogProps {
  open: boolean;
  onClose: () => void;
  editing?: CollectionSummary | null;
}

export function CollectionDialog({ open, onClose, editing }: CollectionDialogProps) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState(COLORS[0]!);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setDescription(editing?.description ?? "");
      setColor(editing?.color ?? COLORS[0]!);
    }
  }, [open, editing]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const url = editing ? `/api/collections/${editing.id}` : "/api/collections";
      const response = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        }),
      });

      if (!response.ok) {
        const data: { error?: string } = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not save the collection.");
      }

      toast.success(editing ? "Collection updated" : "Collection created");
      onClose();
      router.refresh();
    } catch (error) {
      toast.error("Save failed", {
        description: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit collection" : "New collection"}</DialogTitle>
          <DialogDescription>
            Group related documents — like &ldquo;University&rdquo; or
            &ldquo;Research&rdquo;.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="collection-name">Name</Label>
            <Input
              id="collection-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              autoFocus
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="collection-description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="collection-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={300}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2" role="radiogroup" aria-label="Collection color">
              {COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={color === option}
                  aria-label={`Color ${option}`}
                  onClick={() => setColor(option)}
                  className={`h-7 w-7 rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    color === option ? "scale-110 ring-2 ring-ring ring-offset-2 ring-offset-background" : ""
                  }`}
                  style={{ backgroundColor: option }}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? <Loader2 className="animate-spin" /> : <FolderPlus aria-hidden="true" />}
              {editing ? "Save changes" : "Create collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteCollectionDialog({
  collection,
  onClose,
}: {
  collection: CollectionSummary | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    if (!collection) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();

      toast.success("Collection deleted", {
        description: `Documents in “${collection.name}” were kept.`,
      });
      onClose();
      router.refresh();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={Boolean(collection)} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this collection?</DialogTitle>
          <DialogDescription>
            &ldquo;{collection?.name}&rdquo; will be removed. Documents inside
            are not deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="animate-spin" /> : <Trash2 aria-hidden="true" />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ManageDocumentsDialogProps {
  collection: CollectionSummary | null;
  documents: DocumentSummary[];
  memberIds: string[];
  onClose: () => void;
}

export function ManageDocumentsDialog({
  collection,
  documents,
  memberIds,
  onClose,
}: ManageDocumentsDialogProps) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (collection) setSelected(new Set(memberIds));
  }, [collection, memberIds]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!collection) return;

    setSaving(true);
    try {
      // Compute additions and removals.
      const toAdd = Array.from(selected).filter((id) => !memberIds.includes(id));
      const toRemove = memberIds.filter((id) => !selected.has(id));

      for (const documentId of toAdd) {
        await fetch(`/api/collections/${collection.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentIds: [documentId] }),
        });
      }
      for (const documentId of toRemove) {
        await fetch(
          `/api/collections/${collection.id}?documentId=${documentId}`,
          { method: "DELETE" }
        );
      }

      toast.success("Collection updated");
      onClose();
      router.refresh();
    } catch {
      toast.error("Could not update the collection");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(collection)} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage documents</DialogTitle>
          <DialogDescription>
            Choose which documents belong to &ldquo;{collection?.name}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 space-y-1.5 overflow-y-auto rounded-lg border p-3">
          {documents.length === 0 ? (
            <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <FolderKanban className="h-4 w-4" aria-hidden="true" />
              Upload documents first.
            </p>
          ) : (
            documents.map((document) => (
              <label
                key={document.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <Checkbox
                  checked={selected.has(document.id)}
                  onCheckedChange={() => toggle(document.id)}
                  aria-label={`Include ${document.title}`}
                />
                <span className="truncate">{document.title}</span>
              </label>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            Save selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditCollectionMenuItemIcon() {
  return <Pencil aria-hidden="true" />;
}
