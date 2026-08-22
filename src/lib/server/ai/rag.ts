import { db } from "@/lib/db";
import {
  cosineSimilarity,
  generateEmbedding,
} from "@/lib/server/ai/embeddings";
import { buildSnippet } from "@/lib/server/documents/chunking";
import type { SourceReference } from "@/types";

export interface RetrievedChunk {
  content: string;
  chunkIndex: number;
  documentId: string;
  documentTitle: string;
  page: number | null;
  score: number;
}

const TOP_K = 6;
const MIN_SCORE = 0.05;

/**
 * Retrieval pipeline: embed the question, rank the user's chunks by
 * cosine similarity and return the strongest context. Embeddings live
 * in PostgreSQL as JSON arrays — swap this module for pgvector or an
 * external vector store without touching callers.
 */
export async function retrieveRelevantChunks(
  userId: string,
  question: string,
  documentId?: string | null
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await generateEmbedding(question);

  const documents = await db.document.findMany({
    where: {
      userId,
      processingStatus: "READY",
      ...(documentId ? { id: documentId } : {}),
    },
    select: {
      id: true,
      title: true,
      chunks: {
        select: { id: true, content: true, chunkIndex: true, embedding: true, page: true },
      },
    },
  });

  const candidates: RetrievedChunk[] = [];

  for (const document of documents) {
    for (const chunk of document.chunks) {
      if (!chunk.embedding || !Array.isArray(chunk.embedding)) continue;

      const score = cosineSimilarity(
        queryEmbedding,
        chunk.embedding as number[]
      );
      if (score < MIN_SCORE) continue;

      candidates.push({
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        documentId: document.id,
        documentTitle: document.title,
        page: chunk.page,
        score,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, TOP_K);
}

export function toSourceReferences(
  chunks: RetrievedChunk[]
): SourceReference[] {
  return chunks.map((chunk) => ({
    documentId: chunk.documentId,
    documentTitle: chunk.documentTitle,
    chunkIndex: chunk.chunkIndex,
    page: chunk.page,
    snippet: buildSnippet(chunk.content),
  }));
}

export function buildContextBlock(chunks: RetrievedChunk[]): string {
  return chunks
    .map(
      (chunk, index) =>
        `[Source ${index + 1}] — "${chunk.documentTitle}"${
          chunk.page ? `, page ${chunk.page}` : ""
        }, section ${chunk.chunkIndex + 1}:\n${chunk.content}`
    )
    .join("\n\n---\n\n");
}
