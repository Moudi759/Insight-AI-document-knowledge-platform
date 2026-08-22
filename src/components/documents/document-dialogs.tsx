"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DocumentSummary } from "@/types";

export function RenameDialog({
  document,
  onClose,
}: {
  document: DocumentSummary | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (document) setTitle(document.title);
  }, [document]);

  async function handleRename(event: React.FormEvent) {
    event.preventDefault();
    if (!document || !title.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });

      if (!response.ok) {
        const data: { error?: string } = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not rename the document.");
      }

      toast.success("Document renamed");
      onClose();
      router.refresh();
    } catch (error) {
      toast.error("Rename failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(document)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename document</DialogTitle>
          <DialogDescription>
            Choose a clear name so you can find it later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleRename} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="document-title">Title</Label>
            <Input
              id="document-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteDocumentDialog({
  document,
  onClose,
}: {
  document: DocumentSummary | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    if (!document) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();

      toast.success("Document deleted", {
        description: `"${document.title}" was permanently removed.`,
      });
      onClose();
      router.refresh();
    } catch {
      toast.error("Delete failed", {
        description: "The document could not be removed. Please try again.",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={Boolean(document)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this document?</DialogTitle>
          <DialogDescription>
            &ldquo;{document?.title}&rdquo; and its conversations will be
            permanently deleted. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="animate-spin" /> : null}
            Delete permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
