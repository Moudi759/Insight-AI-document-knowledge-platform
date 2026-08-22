import { requireUserId, handleApiError } from "@/lib/server/api-helpers";
import { getOwnedDocument } from "@/lib/server/documents/service";
import { readFile } from "@/lib/server/storage";

type RouteContext = { params: Promise<{ id: string }> };

const CONTENT_TYPES: Record<string, string> = {
  PDF: "application/pdf",
  TXT: "text/plain; charset=utf-8",
  MD: "text/markdown; charset=utf-8",
  DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;

    // Ownership is verified before any bytes leave storage.
    const document = await getOwnedDocument(userId, id);
    const buffer = await readFile(document.storageKey);

    const url = new URL(request.url);
    const disposition = url.searchParams.has("download")
      ? "attachment"
      : "inline";

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPES[document.fileType] ?? "application/octet-stream",
        "Content-Disposition": `${disposition}; filename="${encodeURIComponent(
          document.fileName
        )}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
