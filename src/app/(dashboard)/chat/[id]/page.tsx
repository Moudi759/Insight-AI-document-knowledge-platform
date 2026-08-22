import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/server/auth";
import { getRecentConversations } from "@/lib/server/analytics/service";
import { ChatView } from "@/components/chat/chat-view";
import type { MessageDTO, SourceReference } from "@/types";

export const metadata: Metadata = {
  title: "Conversation",
  description: "Continue your conversation.",
};

export const dynamic = "force-dynamic";

interface ChatDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatDetailPage({ params }: ChatDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const { id } = await params;

  const conversation = await db.conversation.findFirst({
    where: { id, userId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  const [documents, conversations] = await Promise.all([
    db.document.findMany({
      where: { userId, processingStatus: "READY" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
    getRecentConversations(userId, 30),
  ]);

  if (!conversation) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-lg font-semibold">Conversation not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            It may have been deleted or belongs to another workspace.
          </p>
        </div>
      </div>
    );
  }

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

  return (
    <ChatView
      documents={documents}
      conversations={conversations}
      activeConversation={{
        id: conversation.id,
        documentId: conversation.documentId,
        messages,
      }}
    />
  );
}
