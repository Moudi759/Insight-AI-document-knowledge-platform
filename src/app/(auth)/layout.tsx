import Link from "next/link";
import { Sparkles, ShieldCheck, FileText, MessagesSquare } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const highlights = [
  {
    icon: FileText,
    title: "Unified knowledge",
    text: "Bring PDFs, notes, and research into one searchable library.",
  },
  {
    icon: MessagesSquare,
    title: "Chat with documents",
    text: "Ask questions and get grounded answers with cited sources.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    text: "Your workspace is yours alone — documents stay personal.",
  },
];

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Form panel */}
      <div className="relative flex flex-col px-6 py-8 sm:px-10 lg:px-14">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary via-indigo-500 to-violet-500 shadow-md shadow-primary/25">
              <Sparkles className="h-4 w-4 text-white dark:text-primary-foreground" />
            </span>
            <span className="text-[17px] font-semibold tracking-tight">
              Insight
            </span>
          </Link>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm animate-fade-up">{children}</div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      {/* Brand panel */}
      <div className="relative hidden overflow-hidden border-l bg-sidebar lg:block">
        <div className="pointer-events-none absolute inset-0 grid-pattern" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-primary/20 blur-3xl animate-aurora"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 h-[320px] w-[320px] rounded-full bg-violet-600/15 blur-3xl animate-aurora"
          aria-hidden="true"
        />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <p className="max-w-md text-2xl font-medium leading-relaxed tracking-tight">
            &ldquo;Turn your documents into knowledge. Ask anything, get answers
            grounded in your own library.&rdquo;
          </p>

          <ul className="space-y-7">
            {highlights.map((item) => (
              <li key={item.title} className="flex gap-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-card shadow-sm">
                  <item.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Encrypted sessions · Personal workspace · Full data ownership
          </div>
        </div>
      </div>
    </div>
  );
}
