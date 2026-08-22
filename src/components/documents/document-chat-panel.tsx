"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, ExternalLink } from "lucide-react";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatStream } from "@/hooks/use-chat-stream";
import type { ConversationSummary, MessageDTO } from "@/types";

interface DocumentChatPanelProps {
  documentId: string;
  documentTitle: string;
}

const SUGGESTIONS = [
  "Summarize this document",
  "What are the key takeaways?",
  "List important facts and figures",
];

export function DocumentChatPanel({
  documentId,
  documentTitle,
}: DocumentChatPanelProps) {
  const [loadingHistory, setLoadingHistory] = React.useState(true);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const {
    messages,
    setMessages,
    isStreaming,
    streamingText,
    send,
    stop,
    conversationId,
    setConversationId,
  } = useChatStream();

  // Resume the most recent conversation for this document.
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/conversations", { cache: "no-store" });
        if (!response.ok) return;
        const data: { conversations: ConversationSummary[] } =
          await response.json();
        const latest = data.conversations.find(
          (conversation) => conversation.documentId === documentId
        );
        if (!latest || cancelled) return;

        const detail = await fetch(`/api/conversations/${latest.id}`, {
          cache: "no-store",
        });
        if (!detail.ok) return;
        const detailData: { messages: MessageDTO[] } = await detail.json();
        if (!cancelled && detailData.messages.length > 0) {
          setMessages(detailData.messages);
          setConversationId(latest.id);
        }
      } catch {
        /* history is best-effort */
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [documentId, setMessages, setConversationId]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingText]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b bg-card px-4">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        <p className="text-sm font-semibold">AI Assistant</p>
        {conversationId ? (
          <Button asChild variant="ghost" size="sm" className="ml-auto text-xs text-muted-foreground">
            <Link href={`/chat/${conversationId}`}>
              Full view <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
      </div>

      <div
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
        role="log"
        aria-live="polite"
      >
        {loadingHistory ? (
          <>
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="ml-8 h-12 w-[85%] rounded-xl" />
          </>
        ) : messages.length === 0 ? (
          <div className="pt-6 text-center animate-fade-up">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-indigo-500 to-violet-500 shadow-sm">
              <Sparkles className="h-4 w-4 text-white dark:text-primary-foreground" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-semibold">Ask about this document</p>
            <p className="mt-1 px-2 text-xs leading-relaxed text-muted-foreground">
              Answers come from &ldquo;{documentTitle}&rdquo; and cite their sources.
            </p>
            <div className="mt-5 space-y-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void send(suggestion, { documentId })}
                  className="w-full rounded-lg border bg-card px-3 py-2.5 text-left text-xs font-medium transition-all hover:border-primary/40 hover:bg-primary/[0.04] hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            onRegenerate={() => {
              const lastUser = [...messages].reverse().find((m) => m.role === "USER");
              if (!lastUser) return;
              setMessages((current) => {
                const lastAssistant = current.findLastIndex(
                  (m) => m.role === "ASSISTANT"
                );
                if (
                  lastAssistant !== -1 &&
                  current[current.length - 1]?.role === "ASSISTANT"
                ) {
                  return current.slice(0, lastAssistant);
                }
                return current;
              });
              void send(lastUser.content, { documentId, regenerate: true });
            }}
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

      <div className="shrink-0 border-t p-3">
        <ChatInput
          onSend={(content) => void send(content, { documentId })}
          onStop={stop}
          isStreaming={isStreaming}
          placeholder={`Ask about "${documentTitle}"…`}
        />
      </div>
    </div>
  );
}
