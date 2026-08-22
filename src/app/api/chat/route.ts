import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  requireUserId,
  handleApiError,
  createApiError,
} from "@/lib/server/api-helpers";
import { chatRequestSchema } from "@/lib/validations/schemas";
import {
  retrieveRelevantChunks,
  buildContextBlock,
  toSourceReferences,
} from "@/lib/server/ai/rag";
import {
  streamChatAnswer,
  type ChatMessage,
} from "@/lib/server/ai/chat";

export const maxDuration = 120;

function generateTitle(content: string): string {
  const clean = content.replace(/\s+/g, " ").trim();
  if (clean.length <= 48) return clean || "New conversation";
  const cut = clean.slice(0, 48);
  const breakAt = cut.lastIndexOf(" ");
  return `${cut.slice(0, breakAt > 12 ? breakAt : 48)}…`;
}

const HISTORY_MESSAGE_LIMIT = 10;

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();

    const body: unknown = await request.json();
    const parsed = chatRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw createApiError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid request",
        400
      );
    }

    const { content, documentId, conversationId } = parsed.data;
    const isRegenerate =
      new URL(request.url).searchParams.get("regenerate") === "1";

    // ── Resolve or create the conversation (ownership-checked) ──
    let conversationIdResolved: string;
    let conversationTitle: string;

    if (conversationId) {
      const existing = await db.conversation.findFirst({
        where: { id: conversationId, userId },
        select: { id: true, title: true },
      });
      if (!existing) {
        throw createApiError("NOT_FOUND", "Conversation not found", 404);
      }
      conversationIdResolved = existing.id;
      conversationTitle = existing.title;
    } else {
      const created = await db.conversation.create({
        data: {
          userId,
          documentId: documentId ?? null,
          title: generateTitle(content),
        },
        select: { id: true, title: true },
      });
      conversationIdResolved = created.id;
      conversationTitle = created.title;
    }

    // ── Verify document ownership / processing state ──
    let documentTitle: string | undefined;
    if (documentId) {
      const document = await db.document.findFirst({
        where: { id: documentId, userId },
        select: { id: true, title: true, processingStatus: true },
      });
      if (!document) {
        throw createApiError("NOT_FOUND", "Document not found", 404);
      }
      if (document.processingStatus !== "READY") {
        throw createApiError(
          "DOCUMENT_NOT_READY",
          "This document is still being processed. Please try again in a moment.",
          409
        );
      }
      documentTitle = document.title;
    }

    // ── Regeneration support ──
    let question = content;
    if (isRegenerate) {
      const messages = await db.message.findMany({
        where: { conversationId: conversationIdResolved },
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true },
      });

      const lastUserIndex = findLastIndex(messages, (m) => m.role === "USER");
      if (lastUserIndex === -1) {
        throw createApiError("VALIDATION_ERROR", "Nothing to regenerate", 400);
      }

      question = messages[lastUserIndex]!.content;

      const trailing = messages.slice(lastUserIndex + 1);
      if (trailing.length > 0) {
        await db.message.deleteMany({
          where: { id: { in: trailing.map((m) => m.id) } },
        });
      }
    } else {
      await db.message.create({
        data: { conversationId: conversationIdResolved, role: "USER", content },
      });
    }

    // ── Retrieval-augmented context ──
    const chunks = await retrieveRelevantChunks(
      userId,
      question,
      documentId ?? null
    );
    const sources = toSourceReferences(chunks);

    // ── Build provider history from persisted messages ──
    const persisted = await db.message.findMany({
      where: { conversationId: conversationIdResolved },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });
    const recent = persisted.slice(-HISTORY_MESSAGE_LIMIT, -1);

    const history: ChatMessage[] = [
      {
        role: "system",
        content:
          chunks.length > 0
            ? `Document context for the user's question:\n\n${buildContextBlock(chunks)}`
            : "No relevant document context was found for this question. If the documents do not contain the answer, clearly say so instead of guessing.",
      },
      ...recent.map((message) => ({
        role: message.role === "USER" ? ("user" as const) : ("assistant" as const),
        content: message.content,
      })),
      { role: "user", content: question },
    ];

    // ── Stream response as NDJSON events ──
    const encoder = new TextEncoder();
    let assistantText = "";

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        };

        try {
          send({
            type: "meta",
            conversationId: conversationIdResolved,
            title: conversationTitle,
            sources,
          });

          for await (const delta of streamChatAnswer(history, {
            question,
            chunks: chunks.map((chunk) => chunk.content),
            documentTitle,
          })) {
            assistantText += delta;
            send({ type: "delta", text: delta });
          }

          const saved = await db.message.create({
            data: {
              conversationId: conversationIdResolved,
              role: "ASSISTANT",
              content: assistantText,
              sources: sources as unknown as Prisma.InputJsonValue,
            },
            select: { id: true },
          });

          await db.conversation.update({
            where: { id: conversationIdResolved },
            data: { updatedAt: new Date() },
          });

          send({ type: "done", messageId: saved.id });
        } catch (error) {
          console.error("[chat] stream failed:", error);
          send({
            type: "error",
            message:
              "The AI service could not complete this response. Please try again.",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function findLastIndex<T>(
  array: T[],
  predicate: (item: T) => boolean
): number {
  for (let i = array.length - 1; i >= 0; i--) {
    if (predicate(array[i]!)) return i;
  }
  return -1;
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
