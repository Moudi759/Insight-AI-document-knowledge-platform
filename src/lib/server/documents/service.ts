import { db } from "@/lib/db";
import type {
  CollectionSummary,
  DocumentDetail,
  DocumentSummary,
} from "@/types";
import { deleteFile } from "@/lib/server/storage";
import { createApiError } from "@/lib/server/api-helpers";
import type { FileType, ProcessingStatus } from "@prisma/client";

export interface DocumentFilters {
  query?: string;
  status?: ProcessingStatus | "ALL";
  fileType?: FileType | "ALL";
  sort?: "recent" | "oldest" | "name" | "largest";
}

function mapSort(sort: DocumentFilters["sort"]): Record<string, "asc" | "desc"> {
  switch (sort) {
    case "oldest":
      return { createdAt: "asc" };
    case "name":
      return { title: "asc" };
    case "largest":
      return { fileSize: "desc" };
    default:
      return { createdAt: "desc" };
  }
}

export async function listDocuments(
  userId: string,
  filters: DocumentFilters = {}
): Promise<DocumentSummary[]> {
  const documents = await db.document.findMany({
    where: {
      userId,
      ...(filters.query
        ? { title: { contains: filters.query, mode: "insensitive" } }
        : {}),
      ...(filters.status && filters.status !== "ALL"
        ? { processingStatus: filters.status }
        : {}),
      ...(filters.fileType && filters.fileType !== "ALL"
        ? { fileType: filters.fileType }
        : {}),
    },
    orderBy: mapSort(filters.sort),
    include: {
      collections: { include: { collection: true } },
    },
  });

  return documents.map(toDocumentSummary);
}

export function toDocumentSummary(document: {
  id: string;
  title: string;
  fileName: string;
  fileType: FileType;
  fileSize: number;
  processingStatus: ProcessingStatus;
  wordCount: number;
  pageCount: number | null;
  createdAt: Date;
  updatedAt: Date;
  collections: { collection: { id: string; name: string; color: string } }[];
}): DocumentSummary {
  return {
    id: document.id,
    title: document.title,
    fileName: document.fileName,
    fileType: document.fileType,
    fileSize: document.fileSize,
    processingStatus: document.processingStatus,
    wordCount: document.wordCount,
    pageCount: document.pageCount,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    collections: document.collections.map((entry) => ({
      id: entry.collection.id,
      name: entry.collection.name,
      color: entry.collection.color,
    })),
  };
}

export async function getDocument(
  userId: string,
  documentId: string
): Promise<DocumentDetail> {
  const document = await db.document.findFirst({
    where: { id: documentId, userId },
    include: {
      collections: { include: { collection: true } },
    },
  });

  if (!document) {
    throw createApiError("NOT_FOUND", "Document not found", 404);
  }

  return {
    ...toDocumentSummary(document),
    extractedText: document.extractedText,
    errorMessage: document.errorMessage,
  };
}

/** Ownership-verified raw record for internal use. */
export async function getOwnedDocument(
  userId: string,
  documentId: string
) {
  const document = await db.document.findFirst({
    where: { id: documentId, userId },
  });
  if (!document) {
    throw createApiError("NOT_FOUND", "Document not found", 404);
  }
  return document;
}

export async function renameDocument(
  userId: string,
  documentId: string,
  title: string
): Promise<void> {
  await getOwnedDocument(userId, documentId);
  await db.document.update({
    where: { id: documentId },
    data: { title },
  });
}

export async function deleteDocument(
  userId: string,
  documentId: string
): Promise<void> {
  const document = await getOwnedDocument(userId, documentId);

  await db.document.delete({ where: { id: documentId } });
  await deleteFile(document.storageKey);

  await db.activityEvent.create({
    data: {
      userId,
      type: "document.deleted",
      message: `Deleted "${document.title}"`,
    },
  });
}

export async function getUserCollections(
  userId: string
): Promise<CollectionSummary[]> {
  const collections = await db.collection.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { documents: true } } },
  });

  return collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    description: collection.description,
    color: collection.color,
    documentCount: collection._count.documents,
    createdAt: collection.createdAt.toISOString(),
  }));
}
