import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId, handleApiError } from "@/lib/server/api-helpers";
import {
  validateFileExtension,
  validateFileSize,
} from "@/lib/validations/schemas";
import { saveFile, buildStorageKey } from "@/lib/server/storage";
import { processDocument } from "@/lib/server/documents/processing";
import { listDocuments } from "@/lib/server/documents/service";
import type { FileType } from "@prisma/client";
import type { DocumentSummary } from "@/types";

function detectFileType(fileName: string): FileType | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF";
  if (lower.endsWith(".txt")) return "TXT";
  if (lower.endsWith(".md") || lower.endsWith(".markdown")) return "MD";
  if (lower.endsWith(".docx")) return "DOCX";
  return null;
}

const MIME_FALLBACKS: Record<string, FileType> = {
  "application/pdf": "PDF",
  "text/plain": "TXT",
  "text/markdown": "MD",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
};

const VALID_STATUSES = new Set(["QUEUED", "PROCESSING", "READY", "FAILED"]);
const VALID_TYPES = new Set(["PDF", "TXT", "MD", "DOCX"]);
const VALID_SORTS = new Set(["recent", "oldest", "name", "largest"]);

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const url = new URL(request.url);

    const status = url.searchParams.get("status");
    const fileType = url.searchParams.get("type");
    const sort = url.searchParams.get("sort");

    if (status && !VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
    }
    if (fileType && !VALID_TYPES.has(fileType)) {
      return NextResponse.json({ error: "Invalid type filter." }, { status: 400 });
    }
    if (sort && !VALID_SORTS.has(sort)) {
      return NextResponse.json({ error: "Invalid sort option." }, { status: 400 });
    }

    const documents = await listDocuments(userId, {
      query: url.searchParams.get("q") ?? undefined,
      status: status as never,
      fileType: fileType as never,
      sort: sort as never,
    });

    return NextResponse.json({ documents });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file was provided in the upload." },
        { status: 400 }
      );
    }

    // Validate extension (never trust client-declared MIME alone).
    if (!validateFileExtension(file.name)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload a PDF, TXT, Markdown or DOCX file.",
        },
        { status: 415 }
      );
    }

    // Validate size.
    const sizeError = validateFileSize(file.size);
    if (sizeError) {
      return NextResponse.json({ error: sizeError }, { status: 413 });
    }

    const extensionMatch = /\.(pdf|txt|md|markdown|docx)$/i.exec(file.name);
    const extension =
      extensionMatch?.[1]?.toLowerCase() === "markdown"
        ? ".md"
        : `.${extensionMatch?.[1]?.toLowerCase() ?? "txt"}`;

    const fileType: FileType =
      detectFileType(file.name) ??
      MIME_FALLBACKS[file.type] ??
      "TXT";

    const titleFromFile = file.name.replace(/\.[^.]+$/, "").trim() || file.name;

    const created = await db.document.create({
      data: {
        userId,
        title: titleFromFile.slice(0, 200),
        fileName: file.name,
        fileType,
        fileSize: file.size,
        storageKey: "", // set after we know the id
        processingStatus: "QUEUED",
      },
      select: { id: true },
    });

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageKey = buildStorageKey(userId, created.id, extension);
    await saveFile(storageKey, buffer);

    await db.document.update({
      where: { id: created.id },
      data: { storageKey },
    });

    // Process in the background; the client polls for status updates.
    void processDocument(created.id).catch(() => undefined);

    const response: { document: Pick<DocumentSummary, "id" | "title"> } = {
      document: { id: created.id, title: titleFromFile },
    };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
