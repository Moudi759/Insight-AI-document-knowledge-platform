import { z } from "zod";
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";

export const renameDocumentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty")
    .max(200, "Title is too long"),
});

export const createCollectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name cannot be empty")
    .max(80, "Name is too long"),
  description: z.string().trim().max(300, "Description is too long").optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a hex value")
    .default("#6366f1"),
});

export const updateCollectionSchema = createCollectionSchema.partial();

export const modifyCollectionDocumentsSchema = z.object({
  documentIds: z.array(z.string().cuid()).min(1, "Select at least one document"),
});

export const chatRequestSchema = z.object({
  conversationId: z.string().cuid().optional(),
  documentId: z.string().cuid().optional().nullable(),
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(4000, "Message is too long"),
});

export const searchRequestSchema = z.object({
  q: z.string().trim().min(1).max(200),
});

export type RenameDocumentInput = z.infer<typeof renameDocumentSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type ChatRequestInput = z.infer<typeof chatRequestSchema>;

export function validateFileSize(size: number): string | null {
  if (size === 0) return "File is empty";
  if (size > MAX_FILE_SIZE_BYTES) return "File exceeds the 20 MB size limit";
  return null;
}

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".md", ".markdown", ".docx"] as const;

export function validateFileExtension(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}
