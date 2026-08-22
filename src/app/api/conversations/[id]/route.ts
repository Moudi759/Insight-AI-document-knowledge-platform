import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireUserId,
  handleApiError,
  createApiError,
} from "@/lib/server/api-helpers";
import type { ConversationSummary, MessageDTO, SourceReference } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;

    const conversation = await db.conversation.findFirst({
      where: { id, userId },
      include: {
        document: { select: { id: true, title: true, processingStatus: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!conversation) {
      throw createApiError("NOT_FOUND", "Conversation not found", 404);
    }

    const summary: ConversationSummary = {
      id: conversation.id,
      title: conversation.title,
      documentId: conversation.documentId,
      documentTitle: conversation.document?.title ?? null,
      messageCount: conversation.messages.length,
      lastMessage: null,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    };

    const messages: MessageDTO[] = conversation.messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      sources:
        message.sources && Array.isArray(message.sources)
          ? (message.sources as unknown as SourceReference[])
          : null,
      createdAt: message.createdAt.toISOString(),
    }));

    return NextResponse.json({
      conversation: summary,
      document: conversation.document
        ? {
            id: conversation.document.id,
            title: conversation.document.title,
            processingStatus: conversation.document.processingStatus,
          }
        : null,
      messages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;

    const conversation = await db.conversation.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!conversation) {
      throw createApiError("NOT_FOUND", "Conversation not found", 404);
    }

    await db.conversation.delete({ where: { id: conversation.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
