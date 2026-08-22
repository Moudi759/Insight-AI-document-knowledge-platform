import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessagesSquare, FileText, ArrowRight } from "lucide-react";
import { auth } from "@/lib/server/auth";
import { getRecentConversations } from "@/lib/server/analytics/service";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Conversation history",
  description: "Reopen past conversations with your documents.",
};

export const dynamic = "force-dynamic";

export default async function ConversationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const conversations = await getRecentConversations(session.user.id, 100);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Conversation history
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every question you&apos;ve asked, ready to reopen.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/chat">New conversation</Link>
        </Button>
      </div>

      {conversations.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={MessagesSquare}
            title="Start a conversation with your documents."
            description="Ask your first question and the full transcript will live here."
            action={
              <Button asChild>
                <Link href="/chat">Open AI chat</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link
                href={`/chat/${conversation.id}`}
                className="group flex items-start gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MessagesSquare className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <p className="truncate text-sm font-semibold group-hover:text-primary">
                      {conversation.title}
                    </p>
                    <time className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeTime(conversation.updatedAt)}
                    </time>
                  </div>
                  {conversation.documentTitle ? (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {conversation.documentTitle}
                    </p>
                  ) : null}
                  {conversation.lastMessage ? (
                    <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                      {conversation.lastMessage}
                    </p>
                  ) : null}
                </div>
                <ArrowRight
                  className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
