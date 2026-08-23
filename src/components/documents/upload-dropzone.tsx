"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CloudUpload,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ACCEPTED_EXTENSIONS_FLAT, MAX_FILE_SIZE_MB } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format";

type UploadItemStatus = "uploading" | "processing" | "success" | "error";

interface UploadItem {
  id: string;
  fileName: string;
  size: number;
  progress: number;
  status: UploadItemStatus;
  error?: string;
}

interface UploadDropzoneProps {
  onUploaded?: () => void;
  compact?: boolean;
}

export function UploadDropzone({ onUploaded, compact }: UploadDropzoneProps) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const pollIntervalsRef = React.useRef<Set<ReturnType<typeof setInterval>>>(
    new Set()
  );
  const [dragActive, setDragActive] = React.useState(false);
  const [items, setItems] = React.useState<UploadItem[]>([]);

  // Clear any in-flight status polls when the dropzone unmounts.
  React.useEffect(
    () => () => {
      pollIntervalsRef.current.forEach((intervalId) => clearInterval(intervalId));
    },
    []
  );

  const updateItem = React.useCallback(
    (id: string, patch: Partial<UploadItem>) => {
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    []
  );

  /** Poll the document until processing finishes, then refresh lists. */
  const pollProcessing = React.useCallback(
    (documentId: string, itemId: string) => {
      updateItem(itemId, { status: "processing", progress: 100 });
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/documents/${documentId}`, {
            cache: "no-store",
          });
          if (!response.ok) throw new Error("poll failed");
          const data: { document: { processingStatus: string } } =
            await response.json();

          if (
            data.document.processingStatus === "READY" ||
            data.document.processingStatus === "FAILED"
          ) {
            clearInterval(interval);
            pollIntervalsRef.current.delete(interval);
          }

          if (data.document.processingStatus === "READY") {
            updateItem(itemId, { status: "success" });
            toast.success("Document ready", {
              description: "Your document was processed and indexed.",
            });
            onUploaded?.();
            router.refresh();
          } else if (data.document.processingStatus === "FAILED") {
            updateItem(itemId, {
              status: "error",
              error: "Processing failed — unsupported or unreadable content.",
            });
            router.refresh();
          }
        } catch {
          /* transient network errors — keep polling */
        }
      }, 1500);
      pollIntervalsRef.current.add(interval);
    },
    [onUploaded, router, updateItem]
  );

  const uploadFile = React.useCallback(
    (file: File, itemId: string) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          updateItem(itemId, {
            progress: Math.round((event.loaded / event.total) * 90),
          });
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText) as {
            document?: { id: string };
            error?: string;
          };
          if (xhr.status === 201 && data.document) {
            pollProcessing(data.document.id, itemId);
          } else {
            updateItem(itemId, {
              status: "error",
              error: data.error ?? "Upload failed. Please try again.",
            });
          }
        } catch {
          updateItem(itemId, { status: "error", error: "Unexpected server response." });
        }
      };

      xhr.onerror = () =>
        updateItem(itemId, {
          status: "error",
          error: "Network error during upload.",
        });

      xhr.open("POST", "/api/documents");
      xhr.send(formData);
    },
    [pollProcessing, updateItem]
  );

  const handleFiles = React.useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files);

      for (const file of incoming) {
        const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
        const validType = ACCEPTED_EXTENSIONS_FLAT.includes(
          extension as (typeof ACCEPTED_EXTENSIONS_FLAT)[number]
        );
        const validSize =
          file.size > 0 && file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;

        const itemId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        if (!validType) {
          setItems((current) => [
            ...current,
            {
              id: itemId,
              fileName: file.name,
              size: file.size,
              progress: 0,
              status: "error",
              error: "Unsupported file type (PDF, TXT, MD, DOCX only)",
            },
          ]);
          continue;
        }

        if (!validSize) {
          setItems((current) => [
            ...current,
            {
              id: itemId,
              fileName: file.name,
              size: file.size,
              progress: 0,
              status: "error",
              error: `File exceeds ${MAX_FILE_SIZE_MB} MB limit`,
            },
          ]);
          continue;
        }

        setItems((current) => [
          ...current,
          {
            id: itemId,
            fileName: file.name,
            size: file.size,
            progress: 0,
            status: "uploading",
          },
        ]);
        uploadFile(file, itemId);
      }
    },
    [uploadFile]
  );

  const onDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragActive(false);
      if (event.dataTransfer.files?.length) handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload documents: drag and drop or press Enter to browse"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={cn(
          "group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50 text-center transition-all duration-200 hover:border-primary/50 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          compact ? "gap-2 px-6 py-8" : "gap-3 px-6 py-12",
          dragActive && "border-primary bg-primary/[0.06] scale-[1.01]"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-110",
            compact ? "h-10 w-10" : "h-14 w-14"
          )}
        >
          <CloudUpload className={compact ? "h-5 w-5" : "h-7 w-7"} aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold sm:text-base">
            Drop files here or <span className="text-primary">browse</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF, TXT, Markdown, DOCX · up to {MAX_FILE_SIZE_MB} MB each
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          multiple
          accept={ACCEPTED_EXTENSIONS_FLAT.join(",")}
          onChange={(event) => {
            if (event.target.files?.length) handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {items.length > 0 ? (
        <ul className="space-y-2" aria-live="polite">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 animate-fade-up"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                {item.status === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                ) : item.status === "error" ? (
                  <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-medium">{item.fileName}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatBytes(item.size)}
                  </span>
                </div>

                {item.status === "uploading" ? (
                  <Progress value={item.progress} className="mt-1.5 h-1.5" />
                ) : null}

                <p
                  className={cn(
                    "mt-0.5 truncate text-xs",
                    item.status === "error" ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  {item.status === "uploading" && `Uploading… ${item.progress}%`}
                  {item.status === "processing" && (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                      Processing & indexing…
                    </span>
                  )}
                  {item.status === "success" && "Ready to chat"}
                  {item.status === "error" && item.error}
                </p>
              </div>

              {(item.status === "success" || item.status === "error") && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Dismiss ${item.fileName}`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
