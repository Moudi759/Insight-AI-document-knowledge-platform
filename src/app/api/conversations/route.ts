import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId, handleApiError } from "@/lib/server/api-helpers";
import type { ConversationSummary } from "@/types";

export async function GET() {
  try {
    const userId = await requireUserId();

    const conversations = await db.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        document: { select: { title: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          where: { role: { not: "SYSTEM" } },
          select: { content: true },
        },
        _count: { select: { messages: true } },
      },
    });

    const mapped: ConversationSummary[] = conversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      documentId: conversation.documentId,
      documentTitle: conversation.document?.title ?? null,
      messageCount: conversation._count.messages,
      lastMessage:
        conversation.messages[0]?.content != null
          ? conversation.messages[0].content.slice(0, 140)
          : null,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    }));

    return NextResponse.json({ conversations: mapped });
  } catch (error) {
    return handleApiError(error);
  }
}
