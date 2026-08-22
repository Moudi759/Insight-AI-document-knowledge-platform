import { NextResponse } from "next/server";
import {
  requireUserId,
  handleApiError,
} from "@/lib/server/api-helpers";
import {
  getDocument,
  renameDocument,
  deleteDocument,
  getOwnedDocument,
} from "@/lib/server/documents/service";
import { processDocument } from "@/lib/server/documents/processing";
import { renameDocumentSchema } from "@/lib/validations/schemas";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const document = await getDocument(userId, id);
    return NextResponse.json({ document });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;

    const body: unknown = await request.json();
    const parsed = renameDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid title" },
        { status: 400 }
      );
    }

    // Support both rename and reprocess actions.
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    if (action === "reprocess") {
      await getOwnedDocument(userId, id);
      void processDocument(id).catch(() => undefined);
      return NextResponse.json({ ok: true });
    }

    await renameDocument(userId, id, parsed.data.title);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    await deleteDocument(userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
