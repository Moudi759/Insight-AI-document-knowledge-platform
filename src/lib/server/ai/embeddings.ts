/**
 * Embedding generation.
 *
 * When AI_API_KEY is configured, embeddings are produced by any
 * OpenAI-compatible /embeddings endpoint. Otherwise Insight falls back
 * to a deterministic local bag-of-words hashing embedding so retrieval
 * still works end-to-end in demo mode.
 */

const EMBEDDING_DIMENSIONS = 512;

export function isAiConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!isAiConfigured()) {
    return texts.map(localEmbed);
  }

  const baseUrl = process.env.AI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small";

  const response = await fetch(`${baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({ model, input: texts }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error(
      `Embedding request failed (${response.status}): ${await response.text()}`
    );
  }

  const data: { data: { embedding: number[] }[] } = await response.json();
  return data.data
    .map((item) => item.embedding)
    .filter((embedding): embedding is number[] => Array.isArray(embedding));
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddings = await generateEmbeddings([text]);
  return embeddings[0] ?? [];
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ── Local deterministic fallback ──────────────────────────────

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from",
  "has", "have", "how", "i", "in", "is", "it", "its", "of", "on", "or",
  "that", "the", "this", "to", "was", "we", "were", "what", "when",
  "where", "which", "who", "will", "with", "you", "your",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function hashToken(token: string): number {
  let hash = 2166136261;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % EMBEDDING_DIMENSIONS;
}

function localEmbed(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  const tokens = tokenize(text);

  for (let i = 0; i < tokens.length; i++) {
    vector[hashToken(tokens[i]!)]! += 1;
    // Light bigram signal for local ordering awareness.
    if (i + 1 < tokens.length) {
      vector[hashToken(`${tokens[i]}_${tokens[i + 1]}`)]! += 0.5;
    }
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (norm === 0) return vector;
  return vector.map((value) => value / norm);
}
