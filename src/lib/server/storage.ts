import { promises as fs } from "fs";
import path from "path";
import { db } from "@/lib/db";
import { STORAGE_DIR } from "@/lib/constants";
import { createApiError } from "@/lib/server/api-helpers";

/**
 * Object storage abstraction with two drivers:
 *
 * - "local"    — filesystem under .storage/ (development, VMs, containers
 *                with persistent disks)
 * - "database" — original bytes stored as BYTEA in PostgreSQL. Used
 *                automatically on serverless platforms (Vercel) where the
 *                filesystem is read-only/ephemeral.
 *
 * Call sites only depend on saveFile / readFile / deleteFile, so swapping
 * in S3/R2 later is a single-file change.
 */

export type StorageDriver = "local" | "database";

export function getStorageDriver(): StorageDriver {
  const configured = process.env.STORAGE_DRIVER?.trim().toLowerCase();
  if (configured === "db" || configured === "database") return "database";
  if (configured === "local") return "local";
  // Serverless platforms mount read-only, ephemeral disks.
  return process.env.VERCEL ? "database" : "local";
}

function resolveLocalPath(key: string): string {
  const normalized = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
  const absolute = path.join(process.cwd(), STORAGE_DIR, normalized);
  if (!absolute.startsWith(path.join(process.cwd(), STORAGE_DIR))) {
    throw createApiError("STORAGE_ERROR", "Invalid storage key", 400);
  }
  return absolute;
}

/** Prisma's Bytes field expects a plain ArrayBuffer-backed view. */
function toBytes(data: Buffer): Uint8Array<ArrayBuffer> {
  return new Uint8Array(data);
}

export async function saveFile(key: string, data: Buffer): Promise<string> {
  if (getStorageDriver() === "database") {
    await db.documentFile.upsert({
      where: { id: key },
      create: { id: key, data: toBytes(data) },
      update: { data: toBytes(data) },
    });
    return key;
  }

  const absolute = resolveLocalPath(key);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, data);
  return key;
}

export async function readFile(key: string): Promise<Buffer> {
  try {
    if (getStorageDriver() === "database") {
      const record = await db.documentFile.findUnique({ where: { id: key } });
      if (!record) {
        throw createApiError(
          "STORAGE_NOT_FOUND",
          "File not found in storage",
          404
        );
      }
      return Buffer.from(record.data);
    }

    return await fs.readFile(resolveLocalPath(key));
  } catch (error) {
    // Pass through intentional API errors untouched.
    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof (error as { status?: unknown }).status === "number"
    ) {
      throw error;
    }
    // Missing local file → friendly 404 (Node fs errors carry `code` too).
    const errno = (error as NodeJS.ErrnoException).code;
    if (errno === "ENOENT") {
      throw createApiError(
        "STORAGE_NOT_FOUND",
        "File not found in storage",
        404
      );
    }
    throw error;
  }
}

export async function deleteFile(key: string): Promise<void> {
  if (getStorageDriver() === "database") {
    await db.documentFile.deleteMany({ where: { id: key } });
    return;
  }
  try {
    await fs.unlink(resolveLocalPath(key));
  } catch {
    /* already removed or never written — deletion is idempotent */
  }
}

export function buildStorageKey(
  userId: string,
  documentId: string,
  extension: string
): string {
  return path.posix.join(userId, `${documentId}${extension}`);
}
