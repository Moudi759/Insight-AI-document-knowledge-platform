import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FileText, HardDrive, MessagesSquare, Flame } from "lucide-react";
import { auth } from "@/lib/server/auth";
import {
  getAnalyticsData,
  getActivityTimeline,
} from "@/lib/server/analytics/service";
import { StatCard } from "@/components/shared/stat-card";
import { ActivityChart, QuestionsChart } from "@/components/analytics/charts";
import { formatBytes, formatRelativeTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Usage insights across your knowledge workspace.",
};

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [analytics, timeline] = await Promise.all([
    getAnalyticsData(userId),
    getActivityTimeline(userId, 10),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        How your knowledge workspace grows — last 30 days.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total documents"
          value={analytics.totalDocuments.toLocaleString()}
          icon={FileText}
        />
        <StatCard
          title="Questions asked"
          value={analytics.totalQuestions.toLocaleString()}
          icon={MessagesSquare}
        />
        <StatCard
          title="Storage used"
          value={formatBytes(analytics.storageBytes)}
          icon={HardDrive}
        />
        <StatCard
          title="Most used document"
          value={
            analytics.mostUsedDocument
              ? `${analytics.mostUsedDocument.count} chats`
              : "—"
          }
          change={analytics.mostUsedDocument?.title}
          icon={Flame}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section
          aria-labelledby="uploads-chart-heading"
          className="rounded-xl border bg-card p-5 shadow-sm lg:col-span-2"
        >
          <h2 id="uploads-chart-heading" className="text-sm font-semibold">
            Documents uploaded over time
          </h2>
          <div className="mt-4">
            {analytics.series.every((point) => point.uploads === 0) ? (
              <p className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                No uploads in the last 30 days.
              </p>
            ) : (
              <ActivityChart data={analytics.series} />
            )}
          </div>
        </section>

        <aside
          id="activity"
          aria-labelledby="timeline-heading"
          className="rounded-xl border bg-card p-5 shadow-sm scroll-mt-20"
        >
          <h2 id="timeline-heading" className="text-sm font-semibold">
            Activity timeline
          </h2>
          {timeline.length === 0 ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Uploads, questions and edits will show up here as you use Insight.
            </p>
          ) : (
            <ol className="mt-4 space-y-0 border-l pl-4">
              {timeline.map((event) => (
                <li key={event.id} className="relative pb-4 last:pb-0">
                  <span
                    className="absolute -left-[21.5px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary/70"
                    aria-hidden="true"
                  />
                  <p className="text-xs leading-snug">{event.message}</p>
                  <time className="text-[11px] text-muted-foreground">
                    {formatRelativeTime(event.createdAt)}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>

      <section
        aria-labelledby="questions-chart-heading"
        className="mt-6 rounded-xl border bg-card p-5 shadow-sm"
      >
        <h2 id="questions-chart-heading" className="text-sm font-semibold">
          AI questions asked
        </h2>
        <div className="mt-4">
          {analytics.series.every((point) => point.questions === 0) ? (
            <p className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              No questions asked yet —{" "}
              <Link href="/chat" className="ml-1 text-primary underline-offset-2 hover:underline">
                start a conversation
              </Link>
              .
            </p>
          ) : (
            <QuestionsChart data={analytics.series} />
          )}
        </div>
      </section>
    </div>
  );
}
