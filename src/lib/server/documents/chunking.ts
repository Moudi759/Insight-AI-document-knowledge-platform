/**
 * Splits extracted text into overlapping, semantically-bounded chunks.
 * Strategy: paragraph → sentence packing into ~chunkSize character
 * windows with overlap, so retrieval keeps local context.
 */

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 180;

export interface TextChunk {
  content: string;
  index: number;
}

function splitSentences(paragraph: string): string[] {
  const sentences = paragraph.split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/g);
  return sentences.filter((s) => s.trim().length > 0);
}

export function chunkText(text: string): TextChunk[] {
  if (!text.trim()) return [];

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // Very short documents: single chunk.
  if (text.length <= CHUNK_SIZE) {
    return [{ content: text.replace(/\s+/g, " ").trim(), index: 0 }];
  }

  const chunks: TextChunk[] = [];
  let current = "";

  const flush = () => {
    const trimmed = current.trim();
    if (trimmed) {
      chunks.push({ content: trimmed, index: chunks.length });
      current = trimmed.slice(Math.max(0, trimmed.length - CHUNK_OVERLAP));
    }
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length > CHUNK_SIZE) {
      // Oversized paragraph: pack sentence by sentence.
      for (const sentence of splitSentences(paragraph)) {
        if (current.length + sentence.length + 1 > CHUNK_SIZE) flush();
        current += (current ? " " : "") + sentence;
      }
    } else {
      if (current.length + paragraph.length + 2 > CHUNK_SIZE) flush();
      current += (current ? "\n\n" : "") + paragraph;
    }
  }
  flush();

  return chunks.map((chunk, index) => ({ ...chunk, index }));
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function buildSnippet(text: string, maxLength = 220): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength)}…` : clean;
}
