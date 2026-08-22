import mammoth from "mammoth";

import pdfParse from "pdf-parse/lib/pdf-parse.js";
import type { FileType } from "@/types";
import { createApiError } from "@/lib/server/api-helpers";

export interface ExtractionResult {
  text: string;
  pageCount: number | null;
}

function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

export async function extractText(
  buffer: Buffer,
  fileType: FileType
): Promise<ExtractionResult> {
  switch (fileType) {
    case "PDF":
      return extractPdf(buffer);
    case "DOCX":
      return extractDocx(buffer);
    case "TXT":
    case "MD":
      return extractPlainText(buffer);
  }
}

async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const result = await pdfParse(buffer);
    const text = result.text.trim();
    if (!text) {
      throw createApiError(
        "EMPTY_DOCUMENT",
        "No readable text found in this PDF. It may be a scanned document.",
        422
      );
    }
    return { text: normalizeText(text), pageCount: result.numpages };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) throw error;
    throw createApiError(
      "EXTRACTION_FAILED",
      "This PDF could not be parsed. It may be corrupted or password-protected.",
      422
    );
  }
}

async function extractDocx(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const { value } = await mammoth.extractRawText({ buffer });
    const text = value.trim();
    if (!text) {
      throw createApiError(
        "EMPTY_DOCUMENT",
        "This document appears to be empty.",
        422
      );
    }
    return { text: normalizeText(text), pageCount: null };
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) throw error;
    throw createApiError(
      "EXTRACTION_FAILED",
      "This Word document could not be read. Please verify the file.",
      422
    );
  }
}

async function extractPlainText(buffer: Buffer): Promise<ExtractionResult> {
  const text = buffer.toString("utf8").trim();
  if (!text) {
    throw createApiError("EMPTY_DOCUMENT", "This file is empty.", 422);
  }
  return { text: normalizeText(text), pageCount: null };
}
