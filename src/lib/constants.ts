export const APP_NAME = "Insight";
export const APP_TAGLINE = "Turn your documents into knowledge.";
export const APP_DESCRIPTION =
  "Insight is an AI-powered document and knowledge platform. Upload documents, organize your library, and chat with your knowledge.";

/** Public origin of the deployment — tolerant of empty/blank env values. */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
}

export const MAX_FILE_SIZE_MB = 20;
export const DEFAULT_MAX_FILE_SIZE_MB = MAX_FILE_SIZE_MB;
export const SERVERLESS_MAX_FILE_SIZE_MB = 4;

/**
 * Effective upload limit. Vercel (and most serverless hosts) reject
 * request bodies over ~4.5 MB before our code runs, so cap there when
 * hosted. Override locally via MAX_FILE_SIZE_MB.
 */
export function getMaxFileSizeMb(): number {
  const configured = Number(process.env.MAX_FILE_SIZE_MB);
  const base =
    Number.isFinite(configured) && configured > 0
      ? configured
      : MAX_FILE_SIZE_MB;
  if (process.env.VERCEL) {
    return Math.min(base, SERVERLESS_MAX_FILE_SIZE_MB);
  }
  return base;
}
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ACCEPTED_FILE_TYPES = [
  { mime: "application/pdf", extensions: [".pdf"], label: "PDF" },
  { mime: "text/plain", extensions: [".txt"], label: "TXT" },
  { mime: "text/markdown", extensions: [".md", ".markdown"], label: "Markdown" },
  {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extensions: [".docx"],
    label: "DOCX",
  },
] as const;

export const ACCEPTED_EXTENSIONS_FLAT = ACCEPTED_FILE_TYPES.flatMap(
  (t) => t.extensions,
);

export const FREE_PLAN_DOCUMENT_LIMIT = 50;
export const FREE_PLAN_MONTHLY_QUESTIONS = 200;

/** Plan limits, overridable per deployment via environment variables. */
export function getPlanLimits(): { documents: number; monthlyQuestions: number } {
  return {
    documents: Number(process.env.PLAN_DOCUMENT_LIMIT ?? FREE_PLAN_DOCUMENT_LIMIT),
    monthlyQuestions: Number(
      process.env.PLAN_MONTHLY_QUESTIONS ?? FREE_PLAN_MONTHLY_QUESTIONS
    ),
  };
}

export function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export const STORAGE_DIR = ".storage";

export const DEMO_EMAIL = "demo@insight.app";
export const DEMO_PASSWORD = "demo1234";
