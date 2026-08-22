import { isAiConfigured } from "@/lib/server/ai/embeddings";

/**
 * Chat completion provider.
 *
 * With AI_API_KEY: streams from an OpenAI-compatible /chat/completions
 * endpoint. Without it: a grounded demo engine composes extractive
 * answers from retrieved chunks and streams them token by token, so
 * the full product experience works with zero external services.
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroundedAnswerOptions {
  question: string;
  chunks: string[];
  documentTitle?: string;
}

const SYSTEM_PROMPT = `You are Insight, a precise document assistant.

Rules:
1. Answer ONLY using the provided document context.
2. Cite sources inline like [Source 1], [Source 2] matching the numbered context blocks.
3. If the context does not contain enough information to answer, say so clearly and briefly. Never invent facts.
4. Be concise and structured. Use markdown (short paragraphs, bullet points) where it helps readability.`;

export async function* streamChatAnswer(
  history: ChatMessage[],
  options?: GroundedAnswerOptions
): AsyncGenerator<string> {
  if (!isAiConfigured()) {
    yield* streamDemoAnswer(options);
    return;
  }

  const baseUrl = process.env.AI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.AI_CHAT_MODEL ?? "gpt-4o-mini";

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
  ];

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      temperature: 0.2,
      max_tokens: 1024,
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok || !response.body) {
    throw new Error(
      `AI request failed (${response.status}): ${await response
        .text()
        .catch(() => "no details")}`
    );
  }

  yield* parseSseStream(response.body);
}

async function* parseSseStream(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") return;

        try {
          const parsed: {
            choices?: { delta?: { content?: string } }[];
          } = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          /* partial JSON — wait for more data */
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ── Demo engine ───────────────────────────────────────────────

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
}

function keywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
  );
}

export function composeDemoAnswer(options: GroundedAnswerOptions): string {
  const { question, chunks } = options;
  const queryTerms = keywords(question);
  const title = options.documentTitle ?? "the document";

  if (chunks.length === 0) {
    return `I couldn't find anything related to **"${question}"** in ${title}. The document may not have been processed yet — please wait for processing to complete and try again.`;
  }

  // Score sentences across the top chunks by keyword overlap.
  const scored: { sentence: string; score: number; source: number }[] = [];
  chunks.forEach((chunk, chunkIdx) => {
    for (const sentence of splitSentences(chunk)) {
      const terms = keywords(sentence);
      let overlap = 0;
      for (const term of queryTerms) {
        if (terms.has(term)) overlap += 1;
      }
      if (overlap > 0) {
        scored.push({ sentence, score: overlap, source: chunkIdx + 1 });
      }
    }
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored.slice(0, 5);

  if (best.length === 0) {
    return `I reviewed ${title}, but I couldn't find information that answers **"${question}"**.\n\nThe document doesn't appear to cover this topic. Could you rephrase your question or ask about something else covered in the document?`;
  }

  const bullets = best
    .map(
      (item) =>
        `- ${item.sentence} [Source ${item.source}]`
    )
    .join("\n");

  return `Here is what **${title}** says about "${question.replace(/\*/g, "")}":\n\n${bullets}\n\nThese passages are the most relevant sections I found. Ask a follow-up question if you'd like me to go deeper on any point.`;
}

async function* streamDemoAnswer(
  options?: GroundedAnswerOptions
): AsyncGenerator<string> {
  const answer = composeDemoAnswer(
    options ?? { question: "", chunks: [] }
  );

  // Stream in small word groups so the UI feels live.
  const tokens = answer.match(/\S+\s*/g) ?? [answer];
  let batch = "";
  for (let i = 0; i < tokens.length; i++) {
    batch += tokens[i];
    if (i % 3 === 2 || i === tokens.length - 1) {
      yield batch;
      batch = "";
      await new Promise((resolve) => setTimeout(resolve, 24));
    }
  }
}
