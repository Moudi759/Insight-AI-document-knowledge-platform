import { Database, ExternalLink } from "lucide-react";

/**
 * Friendly full-screen notice shown when the dashboard cannot reach the
 * database — typically a fresh clone where DATABASE_URL / migrations
 * haven't been configured yet.
 */
export function DatabaseSetupNotice({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-card shadow-sm">
        <Database className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-xl font-semibold tracking-tight sm:text-2xl">
        Can&apos;t reach your database
      </h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {message ??
          "Insight connected to PostgreSQL but was refused. This usually means the credentials in .env.local don't match your database, or migrations haven't run yet."}
      </p>

      <ol className="mt-6 max-w-md space-y-2 text-left text-sm text-muted-foreground">
        <li>
          <span className="font-medium text-foreground">1.</span> Check{" "}
          <code className="rounded border bg-muted px-1 py-0.5 font-mono text-xs">
            DATABASE_URL
          </code>{" "}
          in{" "}
          <code className="rounded border bg-muted px-1 py-0.5 font-mono text-xs">
            .env.local
          </code>{" "}
          — format:{" "}
          <code className="rounded border bg-muted px-1 py-0.5 font-mono text-xs">
            postgresql://user:password@host:5432/insight
          </code>
        </li>
        <li>
          <span className="font-medium text-foreground">2.</span> Apply the schema:{" "}
          <code className="rounded border bg-muted px-1 py-0.5 font-mono text-xs">
            npx prisma migrate dev
          </code>
        </li>
        <li>
          <span className="font-medium text-foreground">3.</span> Add demo data:{" "}
          <code className="rounded border bg-muted px-1 py-0.5 font-mono text-xs">
            npm run db:seed
          </code>
        </li>
        <li>
          <span className="font-medium text-foreground">4.</span> Restart{" "}
          <code className="rounded border bg-muted px-1 py-0.5 font-mono text-xs">
            npm run dev
          </code>
        </li>
      </ol>

      <a
        href="https://github.com/Moudi759/Insight-AI-document-knowledge-platform#-getting-started"
        target="_blank"
        rel="noreferrer noopener"
        className="mt-6 inline-flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Setup guide <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </div>
  );
}
