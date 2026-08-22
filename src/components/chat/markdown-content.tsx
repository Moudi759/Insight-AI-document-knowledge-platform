"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function MarkdownContent({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "space-y-3 text-sm leading-relaxed [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_hr]:border-border [&_li]:ml-4 [&_ol]:list-decimal [&_p]:m-0 [&_strong]:font-semibold [&_table]:w-full [&_table]:text-xs [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            return (
              <pre className="overflow-x-auto rounded-lg border bg-muted/60 p-3 font-mono text-xs leading-relaxed">
                {children}
              </pre>
            );
          },
          code({ className: codeClassName, children, ...props }) {
            const isInline = !String(className ?? "").includes("language-");
            return (
              <code
                className={cn(
                  !isInline &&
                    "font-mono text-xs",
                  isInline &&
                    "rounded border bg-muted px-1 py-0.5 font-mono text-[0.8em]",
                  codeClassName
                )}
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
