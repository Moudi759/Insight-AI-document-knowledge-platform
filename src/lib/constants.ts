export const APP_NAME = "Insight";
export const APP_TAGLINE = "Turn your documents into knowledge.";
export const APP_DESCRIPTION =
  "Insight is an AI-powered document and knowledge platform. Upload documents, organize your library, and chat with your knowledge.";

export const MAX_FILE_SIZE_MB = 20;
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

export const STORAGE_DIR = ".storage";

export const DEMO_EMAIL = "demo@insight.app";
export const DEMO_PASSWORD = "demo1234";
