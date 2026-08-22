import { db } from "@/lib/db";
import { extractText } from "@/lib/server/documents/extraction";
import { chunkText, estimateTokens } from "@/lib/server/documents/chunking";
import { generateEmbeddings, isAiConfigured } from "@/lib/server/ai/embeddings";
import { readFile } from "@/lib/server/storage";
import { createApiError } from "@/lib/server/api-helpers";

const EMBEDDING_BATCH_SIZE = 64;

/**
 * Full document processing pipeline:
 * read file → extract text → persist → chunk → embed → store chunks.
 * Status transitions are persisted so the UI can poll progress.
 */
export async function processDocument(documentId: string): Promise<void> {
  const document = await db.document.findUnique({
    where: { id: documentId },
  });

  if (!document) {
    throw createApiError("NOT_FOUND", "Document not found", 404);
  }

  try {
    await db.document.update({
      where: { id: documentId },
      data: { processingStatus: "PROCESSING", errorMessage: null },
    });

    // 1. Read the stored file.
    const buffer = await readFile(document.storageKey);

    // 2. Extract text.
    const extraction = await extractText(buffer, document.fileType);

    await db.document.update({
      where: { id: documentId },
      data: {
        extractedText: extraction.text,
        pageCount: extraction.pageCount,
        wordCount: extraction.text.split(/\s+/).filter(Boolean).length,
      },
    });

    // 3. Chunk.
    const chunks = chunkText(extraction.text);
    if (chunks.length === 0) {
      throw createApiError(
        "EMPTY_DOCUMENT",
        "No readable content could be extracted from this file.",
        422
      );
    }

    // 4. Embed + store in batches.
    for (let offset = 0; offset < chunks.length; offset += EMBEDDING_BATCH_SIZE) {
      const batch = chunks.slice(offset, offset + EMBEDDING_BATCH_SIZE);
      let embeddings: number[][] | null = null;

      try {
        embeddings = await generateEmbeddings(batch.map((chunk) => chunk.content));
      } catch (error) {
        console.error(
          `[processing] embedding failed for ${documentId} batch at ${offset}:`,
          error
        );
        // Chunks are still stored without vectors; retrieval falls back
        // gracefully. Only a total failure marks the document FAILED.
      }

      await db.documentChunk.createMany({
        data: batch.map((chunk, index) => ({
          documentId,
          chunkIndex: chunk.index,
          content: chunk.content,
          embedding: embeddings?.[index] ?? undefined,
          tokenCount: estimateTokens(chunk.content),
          page: null,
        })),
        skipDuplicates: true,
      });
    }

    await db.document.update({
      where: { id: documentId },
      data: { processingStatus: "READY" },
    });

    await db.activityEvent.create({
      data: {
        userId: document.userId,
        type: "document.ready",
        message: `"${document.title}" finished processing and is ready to chat`,
        metadata: { documentId },
      },
    });
  } catch (error) {
    const message =
      error && typeof error === "object" && "code" in error
        ? String((error as { message?: string }).message)
        : "Processing failed unexpectedly";

    console.error(`[processing] failed for ${documentId}:`, error);

    await db.document
      .update({
        where: { id: documentId },
        data: {
          processingStatus: "FAILED",
          errorMessage: isAiConfigured()
            ? message
            : message.slice(0, 300),
        },
      })
      .catch(() => undefined);

    throw error;
  }
}
