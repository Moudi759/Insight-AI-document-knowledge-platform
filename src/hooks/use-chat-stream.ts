"use client";

import * as React from "react";
import { toast } from "sonner";
import type { MessageDTO, SourceReference } from "@/types";

type StreamEvent =
  | {
      type: "meta";
      conversationId: string;
      title: string;
      sources: SourceReference[];
    }
  | { type: "delta"; text: string }
  | { type: "done"; messageId?: string }
  | { type: "error"; message: string };

interface UseChatStreamOptions {
  initialMessages?: MessageDTO[];
  initialConversationId?: string | null;
  onConversationCreated?: (conversationId: string) => void;
}

export function useChatStream({
  initialMessages = [],
  initialConversationId = null,
  onConversationCreated,
}: UseChatStreamOptions = {}) {
  const [messages, setMessages] =
    React.useState<MessageDTO[]>(initialMessages);
  const [conversationId, setConversationId] = React.useState<string | null>(
    initialConversationId
  );
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamingText, setStreamingText] = React.useState("");
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => () => abortRef.current?.abort(), []);

  function stop() {
    abortRef.current?.abort();
  }

  async function send(
    content: string,
    options: { documentId?: string | null; regenerate?: boolean } = {}
  ) {
    if (isStreaming) return;

    const controller = new AbortController();
    abortRef.current = controller;
    setIsStreaming(true);

    if (!options.regenerate) {
      setMessages((current) => [
        ...current,
        {
          id: `local-${Date.now()}`,
          role: "USER",
          content,
          sources: null,
          createdAt: new Date().toISOString(),
        },
      ]);
    }

    try {
      const response = await fetch(
        options.regenerate ? "/api/chat?regenerate=1" : "/api/chat",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            conversationId: conversationId ?? undefined,
            documentId: options.documentId ?? undefined,
          }),
          signal: controller.signal,
        }
      );

      if (!response.ok || !response.body) {
        const data: { error?: string } = await response
          .json()
          .catch(() => ({}) as { error?: string });
        throw new Error(data.error ?? "The chat service is unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";
      let pendingSources: SourceReference[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let event: StreamEvent;
          try {
            event = JSON.parse(line) as StreamEvent;
          } catch {
            continue;
          }

          switch (event.type) {
            case "meta": {
              pendingSources = event.sources ?? [];
              if (!conversationId) {
                setConversationId(event.conversationId);
                onConversationCreated?.(event.conversationId);
              }
              break;
            }
            case "delta": {
              assembled += event.text;
              setStreamingText(assembled);
              break;
            }
            case "done": {
              setMessages((current) => [
                ...current,
                {
                  id: event.messageId ?? `assistant-${Date.now()}`,
                  role: "ASSISTANT",
                  content: assembled,
                  sources: pendingSources.length ? pendingSources : null,
                  createdAt: new Date().toISOString(),
                },
              ]);
              setStreamingText("");
              break;
            }
            case "error": {
              toast.error("Chat error", { description: event.message });
              if (assembled) {
                setMessages((current) => [
                  ...current,
                  {
                    id: `partial-${Date.now()}`,
                    role: "ASSISTANT",
                    content: assembled,
                    sources: null,
                    createdAt: new Date().toISOString(),
                  },
                ]);
              }
              setStreamingText("");
              break;
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        // Preserve partial content when the user stops generation.
        setStreamingText((current) => {
          if (current) {
            setMessages((prev) => [
              ...prev,
              {
                id: `partial-${Date.now()}`,
                role: "ASSISTANT",
                content: current,
                sources: null,
                createdAt: new Date().toISOString(),
              },
            ]);
          }
          return "";
        });
      } else {
        toast.error("Could not send message", {
          description:
            error instanceof Error
              ? error.message
              : "A network error occurred.",
        });
      }
    } finally {
      setIsStreaming(false);
      setStreamingText("");
      abortRef.current = null;
    }
  }

  function reset(newMessages: MessageDTO[] = []) {
    abortRef.current?.abort();
    setMessages(newMessages);
    setConversationId(null);
    setStreamingText("");
  }

  return {
    messages,
    setMessages,
    conversationId,
    setConversationId,
    isStreaming,
    streamingText,
    send,
    stop,
    reset,
  };
}
