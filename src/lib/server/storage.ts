import { promises as fs } from "fs";
import path from "path";
import { STORAGE_DIR } from "@/lib/constants";
import { createApiError } from "@/lib/server/api-helpers";

/**
 * Local filesystem object storage.
 * Files live under .storage/<userId>/<documentId><ext> and are served
 * through the authenticated /api/documents/[id]/file route — never
 * exposed as static assets. The interface mirrors an S3 client so the
 * driver can be swapped without touching callers.
 */

function resolveKey(key: string): string {
  const normalized = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
  const absolute = path.join(process.cwd(), STORAGE_DIR, normalized);
  if (!absolute.startsWith(path.join(process.cwd(), STORAGE_DIR))) {
    throw createApiError("STORAGE_ERROR", "Invalid storage key", 400);
  }
  return absolute;
}

export async function saveFile(
  key: string,
  data: Buffer
): Promise<string> {
  const absolute = resolveKey(key);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, data);
  return key;
}

export async function readFile(key: string): Promise<Buffer> {
  try {
    return await fs.readFile(resolveKey(key));
  } catch {
    throw createApiError("STORAGE_NOT_FOUND", "File not found in storage", 404);
  }
}

export async function deleteFile(key: string): Promise<void> {
  try {
    await fs.unlink(resolveKey(key));
  } catch {
    /* already removed or never written — deletion is idempotent */
  }
}

export function buildStorageKey(userId: string, documentId: string, extension: string): string {
  return path.posix.join(userId, `${documentId}${extension}`);
}
