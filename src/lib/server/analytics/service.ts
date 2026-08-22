import { db } from "@/lib/db";
import type {
  ConversationSummary,
  DashboardStats,
} from "@/types";

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function startOfDaysAgo(days: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

export async function getDashboardStats(
  userId: string
): Promise<DashboardStats> {
  const [totalDocuments, documentsThisMonth, questionsAsked, storage] =
    await Promise.all([
      db.document.count({ where: { userId } }),
      db.document.count({
        where: { userId, createdAt: { gte: startOfMonth() } },
      }),
      db.message.count({
        where: {
          role: "USER",
          conversation: { userId },
        },
      }),
      db.document.aggregate({
        where: { userId },
        _sum: { fileSize: true },
      }),
    ]);

  const [readyDocuments, processingDocuments] = await Promise.all([
    db.document.count({ where: { userId, processingStatus: "READY" } }),
    db.document.count({
      where: { userId, processingStatus: { in: ["QUEUED", "PROCESSING"] } },
    }),
  ]);

  return {
    totalDocuments,
    documentsThisMonth,
    questionsAsked,
    storageUsedBytes: storage._sum.fileSize ?? 0,
    readyDocuments,
    processingDocuments,
  };
}

export async function getRecentDocuments(
  userId: string,
  take = 5
) {
  return db.document.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      title: true,
      fileType: true,
      fileSize: true,
      processingStatus: true,
      wordCount: true,
      pageCount: true,
      fileName: true,
      createdAt: true,
      updatedAt: true,
      collections: { include: { collection: true } },
    },
  });
}

export async function getRecentConversations(
  userId: string,
  take = 5
): Promise<ConversationSummary[]> {
  const conversations = await db.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take,
    include: {
      document: { select: { title: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true },
        where: { role: { not: "SYSTEM" } },
      },
      _count: { select: { messages: true } },
    },
  });

  return conversations.map((conversation) => ({
    id: conversation.id,
    title: conversation.title,
    documentId: conversation.documentId,
    documentTitle: conversation.document?.title ?? null,
    messageCount: conversation._count.messages,
    lastMessage:
      conversation.messages[0]?.content != null
        ? conversation.messages[0].content.slice(0, 140)
        : null,
    createdAt: conversation.createdAt.toISOString(),
    updatedAt: conversation.updatedAt.toISOString(),
  }));
}

export interface TimelineEvent {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export async function getActivityTimeline(
  userId: string,
  take = 12
): Promise<TimelineEvent[]> {
  const events = await db.activityEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, type: true, message: true, createdAt: true },
  });

  return events.map((event) => ({
    id: event.id,
    type: event.type,
    message: event.message,
    createdAt: event.createdAt.toISOString(),
  }));
}

export interface UploadsOverTimePoint {
  date: string;
  label: string;
  uploads: number;
  questions: number;
}

export interface AnalyticsData {
  series: UploadsOverTimePoint[];
  mostUsedDocument: { id: string; title: string; count: number } | null;
  storageBytes: number;
  totalQuestions: number;
  totalDocuments: number;
}

export async function getAnalyticsData(
  userId: string,
  days = 30
): Promise<AnalyticsData> {
  const since = startOfDaysAgo(days - 1);

  const [documents, userMessages, perDocumentCounts, storage, totalQuestions, totalDocuments] =
    await Promise.all([
      db.document.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      db.message.findMany({
        where: {
          role: "USER",
          conversation: { userId },
          createdAt: { gte: since },
        },
        select: { createdAt: true },
      }),
      db.conversation.groupBy({
        by: ["documentId"],
        where: { userId, documentId: { not: null } },
        _count: { _all: true },
      }),
      db.document.aggregate({ where: { userId }, _sum: { fileSize: true } }),
      db.message.count({
        where: { role: "USER", conversation: { userId } },
      }),
      db.document.count({ where: { userId } }),
    ]);

  // Build day buckets.
  const buckets = new Map<string, { uploads: number; questions: number }>();
  for (let i = 0; i < days; i++) {
    const date = new Date(since);
    date.setDate(date.getDate() + i);
    buckets.set(date.toISOString().slice(0, 10), { uploads: 0, questions: 0 });
  }

  for (const doc of documents) {
    const key = doc.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) bucket.uploads += 1;
  }
  for (const message of userMessages) {
    const key = message.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) bucket.questions += 1;
  }

  const series: UploadsOverTimePoint[] = Array.from(buckets.entries()).map(
    ([date, value]) => ({
      date,
      label: new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      ...value,
    })
  );

  let mostUsedDocument: AnalyticsData["mostUsedDocument"] = null;
  if (perDocumentCounts.length > 0) {
    const top = perDocumentCounts.reduce((best, current) =>
      current._count._all > best._count._all ? current : best
    );
    if (top.documentId) {
      const document = await db.document.findFirst({
        where: { id: top.documentId, userId },
        select: { id: true, title: true },
      });
      if (document) {
        mostUsedDocument = {
          id: document.id,
          title: document.title,
          count: top._count._all,
        };
      }
    }
  }

  return {
    series,
    mostUsedDocument,
    storageBytes: storage._sum.fileSize ?? 0,
    totalQuestions,
    totalDocuments,
  };
}
