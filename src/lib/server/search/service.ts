import { db } from "@/lib/db";
import { buildSnippet } from "@/lib/server/documents/chunking";
import type { SearchResult } from "@/types";

const MAX_PER_TYPE = 8;

/**
 * Global search across document titles, conversation titles and the
 * full extracted text of documents. All queries are scoped to the
 * requesting user.
 */
export async function globalSearch(
  userId: string,
  query: string
): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const [documents, conversations] = await Promise.all([
    db.document.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: trimmed, mode: "insensitive" } },
          { fileName: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: MAX_PER_TYPE,
      select: { id: true, title: true, createdAt: true },
    }),
    db.conversation.findMany({
      where: {
        userId,
        title: { contains: trimmed, mode: "insensitive" },
      },
      orderBy: { updatedAt: "desc" },
      take: MAX_PER_TYPE,
      select: {
        id: true,
        title: true,
        createdAt: true,
        documentId: true,
        messages: { take: 1, orderBy: { createdAt: "desc" }, select: { content: true } },
      },
    }),
  ]);

  const results: SearchResult[] = [];

  for (const document of documents) {
    results.push({
      type: "document",
      id: document.id,
      title: document.title,
      snippet: "Document match",
      documentId: document.id,
      date: document.createdAt.toISOString(),
    });
  }

  for (const conversation of conversations) {
    results.push({
      type: "conversation",
      id: conversation.id,
      title: conversation.title,
      snippet:
        conversation.messages[0]?.content != null
          ? buildSnippet(conversation.messages[0].content)
          : "Conversation",
      documentId: null,
      date: conversation.createdAt.toISOString(),
    });
  }

  // Full-text search inside extracted content.
  if (trimmed.length >= 2) {
    const documentsWithText = await db.document.findMany({
      where: {
        userId,
        processingStatus: "READY",
        extractedText: { contains: trimmed, mode: "insensitive" },
      },
      select: { id: true, title: true, extractedText: true, updatedAt: true },
      take: MAX_PER_TYPE,
    });

    for (const document of documentsWithText) {
      // Skip if already matched on title.
      if (results.some((r) => r.type === "document" && r.id === document.id)) {
        continue;
      }
      const snippet = extractSnippet(document.extractedText ?? "", trimmed);

      // Also index matching chunks as individual text hits.
      results.push({
        type: "text",
        id: `${document.id}-text`,
        title: document.title,
        snippet,
        documentId: document.id,
        date: document.updatedAt.toISOString(),
      });
    }

    const chunkMatches = await db.documentChunk.findMany({
      where: {
        document: { userId, processingStatus: "READY" },
        content: { contains: trimmed, mode: "insensitive" },
      },
      include: { document: { select: { id: true, title: true } } },
      take: MAX_PER_TYPE,
    });

    for (const chunk of chunkMatches.slice(0, 5)) {
      results.push({
        type: "text",
        id: chunk.id,
        title: chunk.document.title,
        snippet: buildSnippet(chunk.content),
        documentId: chunk.document.id,
        date: new Date().toISOString(),
      });
    }
  }

  return dedupeById(results).slice(0, 30);
}

function dedupeById(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.id)) return false;
    seen.add(result.id);
    return true;
  });
}

export function extractSnippet(text: string, query: string): string {
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(query.toLowerCase());

  if (index === -1) return buildSnippet(text);

  const start = Math.max(0, index - 80);
  const end = Math.min(text.length, index + query.length + 120);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";

  return `${prefix}${text.slice(start, end).replace(/\s+/g, " ").trim()}${suffix}`;
}
