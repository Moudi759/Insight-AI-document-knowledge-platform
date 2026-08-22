import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/server/auth";
import { getRecentConversations } from "@/lib/server/analytics/service";
import {
  ChatView,
  ChatViewSkeleton,
} from "@/components/chat/chat-view";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "AI Chat",
  description: "Ask questions about your documents.",
};

export const dynamic = "force-dynamic";

interface ChatPageProps {
  searchParams: Promise<{ documentId?: string }>;
}

async function ChatContent({ documentId }: { documentId?: string }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [documents, conversations] = await Promise.all([
    db.document.findMany({
      where: { userId: session.user.id, processingStatus: "READY" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
    getRecentConversations(session.user.id, 30),
  ]);

  const preselected = documents.some((d) => d.id === documentId)
    ? documentId
    : null;

  return (
    <ChatView
      documents={documents}
      conversations={conversations}
      initialDocumentId={preselected}
      activeConversation={null}
    />
  );
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const { documentId } = await searchParams;

  return (
    <Suspense fallback={<ChatViewSkeleton />}>
      <ChatContent documentId={documentId} />
    </Suspense>
  );
}
