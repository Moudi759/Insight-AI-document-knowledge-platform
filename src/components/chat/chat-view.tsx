"use client";

import * as React from "react";
import Link from "next/link";
import { FilePlus2, History, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/shared/empty-state";
import { useChatStream } from "@/hooks/use-chat-stream";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format";
import type { ConversationSummary, MessageDTO } from "@/types";

export interface DocumentOption {
  id: string;
  title: string;
}

interface ChatViewProps {
  documents: DocumentOption[];
  conversations: ConversationSummary[];
  initialDocumentId?: string | null;
  activeConversation: {
    id: string;
    documentId: string | null;
    messages: MessageDTO[];
  } | null;
}

const SUGGESTIONS = [
  "Summarize the key points of this document",
  "What are the main findings or conclusions?",
  "List the important names, dates and figures",
  "What topics does this document cover?",
];

export function ChatView({
  documents,
  conversations: initialConversations,
  initialDocumentId,
  activeConversation,
}: ChatViewProps) {
  const [conversations, setConversations] =
    React.useState<ConversationSummary[]>(initialConversations);
  const [documentId, setDocumentId] = React.useState<string>(
    activeConversation?.documentId ?? initialDocumentId ?? "all"
  );
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const lastSentRef = React.useRef<string>("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const {
    messages,
    setMessages,
    isStreaming,
    streamingText,
    conversationId,
    setConversationId,
    send,
    stop,
  } = useChatStream({
    initialMessages: activeConversation?.messages ?? [],
    initialConversationId: activeConversation?.id ?? null,
    onConversationCreated: (newId) => {
      window.history.replaceState(null, "", `/chat/${newId}`);
      setConversations((current) => [
        {
          id: newId,
          title:
            lastSentRef.current.replace(/\s+/g, " ").trim().slice(0, 48) ||
            "New conversation",
          documentId: documentId === "all" ? null : documentId || null,
          documentTitle:
            documentId === "all"
              ? null
              : (documents.find((d) => d.id === documentId)?.title ?? null),
          messageCount: 2,
          lastMessage: lastSentRef.current.slice(0, 140),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...current.filter((c) => c.id !== newId),
      ]);
    },
  });

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingText]);

  function sendMessage(content: string) {
    lastSentRef.current = content;
    void send(content, {
      documentId: documentId === "all" ? null : documentId || null,
    });
  }

  function regenerate() {
    const lastUser = [...messages].reverse().find((m) => m.role === "USER");
    if (!lastUser) return;

    setMessages((current) => {
      const lastAssistant = current.findLastIndex((m) => m.role === "ASSISTANT");
      if (
        lastAssistant !== -1 &&
        current[current.length - 1]?.role === "ASSISTANT"
      ) {
        return current.slice(0, lastAssistant);
      }
      return current;
    });

    void send(lastUser.content, {
      documentId: documentId === "all" ? null : documentId || null,
      regenerate: true,
    });
  }

  function startNewConversation() {
    stop();
    setMessages([]);
    setConversationId(null);
    window.history.replaceState(null, "", "/chat");
  }

  async function deleteConversation(id: string) {
    const previous = conversations;
    setConversations((current) => current.filter((c) => c.id !== id));
    if (id === conversationId) startNewConversation();

    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
    } catch {
      setConversations(previous);
      toast.error("Could not delete conversation");
    }
  }

  const hasDocuments = documents.length > 0;
  const isEmpty = messages.length === 0 && !isStreaming;

  const rail = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button className="w-full" onClick={startNewConversation}>
          <Plus aria-hidden="true" /> New conversation
        </Button>
      </div>
      <nav
        aria-label="Conversation history"
        className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3"
      >
        <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Recent
        </p>
        {conversations.length === 0 ? (
          <p className="px-2 py-4 text-xs leading-relaxed text-muted-foreground">
            Your conversations will appear here. Ask your first question to get
            started.
          </p>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "group flex items-center gap-1 rounded-lg pr-1 transition-colors",
                conversation.id === conversationId
                  ? "bg-accent"
                  : "hover:bg-accent/60"
              )}
            >
              <Link
                href={`/chat/${conversation.id}`}
                onClick={onNavigate}
                className="min-w-0 flex-1 rounded-lg px-2.5 py-2 focus-visible:outline-none"
              >
                <p className="truncate text-sm font-medium">{conversation.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {conversation.documentTitle ?? "All documents"} ·{" "}
                  {formatRelativeTime(conversation.updatedAt)}
                </p>
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${conversation.title}`}
                onClick={() => void deleteConversation(conversation.id)}
                className="h-7 w-7 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          ))
        )}
        <Button asChild variant="ghost" size="sm" className="mt-3 w-full justify-start text-muted-foreground">
          <Link href="/conversations">View all conversations</Link>
        </Button>
      </nav>
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-4rem)]">
      {/* Conversations rail — desktop */}
      <aside className="hidden w-72 shrink-0 border-r bg-sidebar lg:block">
        {rail()}
      </aside>

      {/* Chat column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                aria-label="Open conversation history"
              >
                <History aria-hidden="true" />
                History
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-sidebar p-0">
              <SheetHeader className="border-b p-4 text-left">
                <SheetTitle>Conversations</SheetTitle>
              </SheetHeader>
              {rail(() => setHistoryOpen(false))}
            </SheetContent>
          </Sheet>

          <span className="hidden items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
            <Sparkles className="h-3 w-3 text-primary" aria-hidden="true" />
            Answers grounded in your library
          </span>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Context</span>
            <Select value={documentId} onValueChange={setDocumentId}>
              <SelectTrigger
                className="w-[170px] sm:w-[220px]"
                aria-label="Choose document context"
              >
                <SelectValue placeholder="Select context" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All documents</SelectItem>
                {documents.map((document) => (
                  <SelectItem key={document.id} value={document.id}>
                    {document.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto"
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          <div className="mx-auto max-w-3xl space-y-5 px-4 py-6">
            {!hasDocuments && isEmpty ? (
              <EmptyState
                icon={FilePlus2}
                title="No documents to chat with yet."
                description="Upload a document first — then ask questions and get answers grounded in its contents."
                action={
                  <Button asChild>
                    <Link href="/documents?upload=1">
                      <FilePlus2 aria-hidden="true" /> Upload a document
                    </Link>
                  </Button>
                }
              />
            ) : isEmpty ? (
              <div className="pt-10 text-center animate-fade-up">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-indigo-500 to-violet-500 shadow-md shadow-primary/25">
                  <Sparkles
                    className="h-5 w-5 text-white dark:text-primary-foreground"
                    aria-hidden="true"
                  />
                </div>
                <h2 className="mt-4 text-lg font-semibold tracking-tight">
                  Start a conversation with your documents.
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Ask anything — responses cite the exact passages they come from.
                </p>

                <div className="mx-auto mt-6 grid max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => sendMessage(suggestion)}
                      className="rounded-lg border bg-card px-4 py-3 text-left text-sm transition-all hover:border-primary/40 hover:bg-primary/[0.04] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                canRegenerate={
                  !isStreaming &&
                  index === messages.length - 1 &&
                  message.role === "ASSISTANT"
                }
                onRegenerate={regenerate}
              />
            ))}

            {isStreaming ? (
              <ChatMessage
                message={{
                  id: "streaming",
                  role: "ASSISTANT",
                  content: streamingText,
                  sources: null,
                  createdAt: new Date().toISOString(),
                }}
                isStreaming
              />
            ) : null}

            <div ref={bottomRef} aria-hidden="true" />
          </div>
        </div>

        {/* Input */}
        <div className="shrink-0 border-t bg-background/80 px-4 py-3 backdrop-blur">
          <div className="mx-auto max-w-3xl">
            <ChatInput
              onSend={sendMessage}
              onStop={stop}
              isStreaming={isStreaming}
              disabled={!hasDocuments}
              placeholder={
                hasDocuments
                  ? documentId === "all"
                    ? "Ask about all of your documents…"
                    : `Ask about "${
                        documents.find((d) => d.id === documentId)?.title ??
                        "this document"
                      }"…`
                  : "Upload a document first…"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatViewSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-4rem)]">
      <div className="hidden w-72 border-r bg-sidebar p-3 lg:block">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="mt-4 h-14 w-full rounded-lg" />
        <Skeleton className="mt-2 h-14 w-full rounded-lg" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-4 w-80" />
        <div className="mt-4 grid w-full max-w-xl grid-cols-2 gap-2">
          <Skeleton className="h-14 rounded-lg" />
          <Skeleton className="h-14 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
