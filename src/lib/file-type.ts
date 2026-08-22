import { FileText, FileCode2, FileType2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FileType as FileTypeValue, ProcessingStatus } from "@/types";

export interface FileTypeMeta {
  label: string;
  icon: LucideIcon;
  iconClassName: string;
}

const FILE_TYPE_META: Record<FileTypeValue, FileTypeMeta> = {
  PDF: {
    label: "PDF",
    icon: FileText,
    iconClassName: "bg-red-500/12 text-red-500 dark:text-red-400",
  },
  TXT: {
    label: "TXT",
    icon: FileType2,
    iconClassName: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
  },
  MD: {
    label: "MD",
    icon: FileCode2,
    iconClassName: "bg-violet-500/12 text-violet-500 dark:text-violet-400",
  },
  DOCX: {
    label: "DOCX",
    icon: FileText,
    iconClassName: "bg-blue-500/12 text-blue-600 dark:text-blue-400",
  },
};

export function fileTypeMeta(fileType: FileTypeValue): FileTypeMeta {
  return FILE_TYPE_META[fileType] ?? FILE_TYPE_META.TXT;
}

export const STATUS_META: Record<
  ProcessingStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "secondary" }
> = {
  READY: { label: "Ready", variant: "success" },
  PROCESSING: { label: "Processing", variant: "warning" },
  QUEUED: { label: "Queued", variant: "secondary" },
  FAILED: { label: "Failed", variant: "destructive" },
};
