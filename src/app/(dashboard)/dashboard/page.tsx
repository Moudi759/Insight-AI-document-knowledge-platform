import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileText,
  MessagesSquare,
  HardDrive,
  CalendarPlus,
  ArrowRight,
  Sparkles,
  Activity,
} from "lucide-react";
import { auth } from "@/lib/server/auth";
import {
  getDashboardStats,
  getRecentConversations,
  getRecentDocuments,
  getActivityTimeline,
} from "@/lib/server/analytics/service";
import { toDocumentSummary } from "@/lib/server/documents/service";
import { StatCard } from "@/components/shared/stat-card";
import { QuickUploadButton } from "@/components/documents/quick-upload-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBytes, formatRelativeTime } from "@/lib/format";
import { fileTypeMeta } from "@/lib/file-type";

export const metadata: Metadata = {
  title: "Overview",
  description: "Your Insight workspace at a glance.",
};

export const dynamic = "force-dynamic";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [stats, recentDocs, recentConversations, timeline] = await Promise.all([
    getDashboardStats(session.user.id),
    getRecentDocuments(session.user.id),
    getRecentConversations(session.user.id),
    getActivityTimeline(session.user.id, 8),
  ]);

  const documents = recentDocs.map(toDocumentSummary);
  const firstName = (session.user.name ?? "").split(" ")[0] || "there";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">
            {greeting()}, {firstName}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Your knowledge workspace
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            {stats.totalDocuments === 0
              ? "Upload your first document to unlock AI-powered answers grounded in your own files."
              : `You have ${stats.readyDocuments} document${stats.readyDocuments === 1 ? "" : "s"} ready to chat with.`}
          </p>
        </div>
        <div className="flex gap-2">
          <QuickUploadButton />
          <Button variant="outline" asChild>
            <Link href="/chat">
              <Sparkles aria-hidden="true" /> Ask AI
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total documents"
          value={stats.totalDocuments.toLocaleString()}
          change={`${stats.documentsThisMonth} added this month`}
          icon={FileText}
        />
        <StatCard
          title="Questions asked"
          value={stats.questionsAsked.toLocaleString()}
          icon={MessagesSquare}
        />
        <StatCard
          title="Storage used"
          value={formatBytes(stats.storageUsedBytes)}
          change={`${stats.processingDocuments} processing now`}
          icon={HardDrive}
        />
        <StatCard
          title="This month"
          value={`+${stats.documentsThisMonth}`}
          change="documents uploaded"
          icon={CalendarPlus}
        />
      </div>

      {/* Main grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent documents */}
        <section className="lg:col-span-2" aria-labelledby="recent-documents-heading">
          <div className="flex items-center justify-between">
            <h2 id="recent-documents-heading" className="text-base font-semibold">
              Recent documents
            </h2>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link href="/documents">
                View all <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {documents.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed bg-card/40 px-6 py-10 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium">No documents yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload a PDF or note and it will appear here.
              </p>
              <div className="mt-4">
                <QuickUploadButton variant="outline" />
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {documents.slice(0, 5).map((document) => {
                const meta = fileTypeMeta(document.fileType);
                const Icon = meta.icon;
                return (
                  <Link
                    key={document.id}
                    href={`/documents/${document.id}`}
                    className="group flex items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.iconClassName}`}
                      aria-hidden="true"
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-primary">
                        {document.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {formatRelativeTime(document.createdAt)} ·{" "}
                        {formatBytes(document.fileSize)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        document.processingStatus === "READY"
                          ? "success"
                          : document.processingStatus === "FAILED"
                            ? "destructive"
                            : "warning"
                      }
                    >
                      {document.processingStatus.toLowerCase()}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Continue learning */}
        <section aria-labelledby="continue-learning-heading">
          <div className="flex items-center justify-between">
            <h2 id="continue-learning-heading" className="text-base font-semibold">
              Continue learning
            </h2>
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link href="/chat">
                All chats <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {recentConversations.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed bg-card/40 px-6 py-10 text-center">
              <MessagesSquare className="mx-auto h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
              <p className="mt-3 text-sm font-medium">No conversations yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Start asking questions about your documents.
              </p>
              <div className="mt-4">
                <Button variant="outline" asChild>
                  <Link href="/chat">Start a conversation</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {recentConversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/chat/${conversation.id}`}
                  className="block rounded-lg border bg-card px-4 py-3 transition-all hover:border-primary/30 hover:shadow-sm"
                >
                  <p className="truncate text-sm font-medium">{conversation.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {conversation.documentTitle ?? "General"} ·{" "}
                    {formatRelativeTime(conversation.updatedAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Activity */}
      <section id="activity" className="mt-10 scroll-mt-20" aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="flex items-center gap-2 text-base font-semibold">
          <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
          Recent activity
        </h2>

        {timeline.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed bg-card/40 px-6 py-6 text-sm text-muted-foreground">
            Activity from your uploads, questions and collections will appear here.
          </p>
        ) : (
          <ol className="mt-4 space-y-0 border-l pl-5">
            {timeline.map((event) => (
              <li key={event.id} className="relative pb-5 last:pb-0">
                <span
                  className="absolute -left-[26.5px] top-1 h-3 w-3 rounded-full border-2 border-background bg-primary/70"
                  aria-hidden="true"
                />
                <p className="text-sm">{event.message}</p>
                <time className="text-xs text-muted-foreground">
                  {formatRelativeTime(event.createdAt)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

