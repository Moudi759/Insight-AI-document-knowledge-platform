"use client";

import * as React from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  disabled,
  placeholder = "Ask anything about your documents…",
}: ChatInputProps) {
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
  }, [value]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-2 shadow-sm transition-all",
        isStreaming && "opacity-90"
      )}
    >
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          rows={1}
          disabled={disabled}
          placeholder={placeholder}
          aria-label="Chat message"
          className="max-h-[180px] min-h-[40px] w-full resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        {isStreaming ? (
          <Button
            size="icon"
            onClick={onStop}
            aria-label="Stop generating"
            className="mb-0.5 shrink-0"
            variant="secondary"
          >
            <Square className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={submit}
            disabled={!value.trim() || disabled}
            aria-label="Send message"
            className="mb-0.5 shrink-0"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="px-2 pb-1 pt-0.5 text-[10px] text-muted-foreground">
        Answers are grounded in your documents.
        <kbd className="ml-1 rounded border bg-muted px-1 font-mono text-[9px]">
          Shift+Enter
        </kbd>{" "}
        for a new line
      </p>
    </div>
  );
}
