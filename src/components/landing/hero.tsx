import Link from "next/link";
import {
  ArrowRight,
  Bot,
  FileText,
  LayoutDashboard,
  MessagesSquare,
  Search,
  Sparkles,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_TAGLINE } from "@/lib/constants";

/** Stylized, static preview of the Insight dashboard. */
function AppPreview() {
  return (
    <div
      className="relative mx-auto mt-14 w-full max-w-5xl rounded-xl border bg-card shadow-2xl shadow-primary/10"
      role="img"
      aria-label="Preview of the Insight dashboard interface"
    >
      {/* Window chrome */}
      <div className="flex h-9 items-center gap-1.5 border-b px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        <span className="ml-3 hidden rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground sm:block">
          insight.app/dashboard
        </span>
      </div>

      <div className="grid grid-cols-[52px_1fr] sm:grid-cols-[160px_1fr]">
        {/* Sidebar mock */}
        <div className="space-y-2 border-r bg-sidebar p-3">
          <div className="mb-4 flex items-center gap-2 px-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-violet-500">
              <Sparkles className="h-3 w-3 text-white dark:text-primary-foreground" />
            </span>
            <span className="hidden text-xs font-semibold sm:block">Insight</span>
          </div>
          {[
            { icon: LayoutDashboard, label: "Overview", active: true },
            { icon: FileText, label: "Documents", active: false },
            { icon: MessagesSquare, label: "AI Chat", active: false },
            { icon: Search, label: "Search", active: false },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                item.active ? "bg-sidebar-accent" : ""
              }`}
            >
              <item.icon
                className={`h-3.5 w-3.5 ${item.active ? "text-primary" : "text-muted-foreground"}`}
                aria-hidden="true"
              />
              <span
                className={`hidden text-[11px] font-medium sm:block ${
                  item.active ? "" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Content mock */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold sm:text-sm">Good afternoon</p>
              <p className="hidden text-[10px] text-muted-foreground sm:block">
                Your knowledge workspace
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-primary">
              <Upload className="h-3 w-3" aria-hidden="true" /> Quick upload
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {[
              { label: "Documents", value: "24" },
              { label: "Questions", value: "182" },
              { label: "Storage", value: "310 MB" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border bg-card p-3">
                <p className="truncate text-[9px] text-muted-foreground">{stat.label}</p>
                <p className="mt-0.5 text-sm font-semibold sm:text-base">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            {[
              { name: "Quantum Computing Review.pdf", tag: "Ready" },
              { name: "Product Requirements.docx", tag: "Ready" },
              { name: "Lecture Notes — Neural Nets.md", tag: "Processing" },
            ].map((doc) => (
              <div
                key={doc.name}
                className="flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2"
              >
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                  {doc.name}
                </span>
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${
                    doc.tag === "Ready"
                      ? "bg-emerald-500/12 text-emerald-500"
                      : "bg-amber-500/12 text-amber-500"
                  }`}
                >
                  {doc.tag}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-lg border bg-card p-3">
            <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Based on <span className="font-medium text-foreground">Quantum Computing Review.pdf</span>
                , the main findings are error-correction gains of 34%…
                <span className="ml-1 inline-block h-3 w-[2px] translate-y-0.5 animate-pulse bg-primary" />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Glow */}
      <div
        className="pointer-events-none absolute -inset-x-8 bottom-0 h-16 bg-gradient-to-t from-background via-transparent"
        aria-hidden="true"
      />
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-20 pt-36 sm:pt-40">
      {/* Backdrop */}
      <div className="pointer-events-none absolute inset-0 grid-pattern [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl animate-aurora"
        aria-hidden="true"
      />

      <div className="container relative text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm animate-fade-up">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          AI-powered document intelligence
        </div>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl animate-fade-up [animation-delay:80ms]">
          Your documents. Your knowledge.{" "}
          <span className="text-gradient">One intelligent workspace.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg animate-fade-up [animation-delay:160ms]">
          Upload PDFs, notes and research. Insight reads them, indexes every
          idea, and answers your questions with cited sources — so knowledge is
          never more than one question away.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-up [animation-delay:240ms]">
          <Button size="xl" asChild className="w-full sm:w-auto">
            <Link href="/register">
              Get started free <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <Button size="xl" variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/login?demo=1">
              Explore demo <Sparkles aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted-foreground animate-fade-up [animation-delay:300ms]">
          No credit card required · Free plan included
        </p>

        <AppPreview />
      </div>

      <span className="sr-only">{APP_TAGLINE}</span>
    </section>
  );
}
