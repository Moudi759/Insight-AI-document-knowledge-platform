import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireUserId,
  handleApiError,
  createApiError,
} from "@/lib/server/api-helpers";
import {
  updateCollectionSchema,
  modifyCollectionDocumentsSchema,
} from "@/lib/validations/schemas";

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedCollection(userId: string, id: string) {
  const collection = await db.collection.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!collection) {
    throw createApiError("NOT_FOUND", "Collection not found", 404);
  }
  return collection;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    await getOwnedCollection(userId, id);

    const body: unknown = await request.json();
    const parsed = updateCollectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await db.collection.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  // Add documents to the collection.
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    await getOwnedCollection(userId, id);

    const body: unknown = await request.json();
    const parsed = modifyCollectionDocumentsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    // Only allow adding documents owned by the requesting user.
    const owned = await db.document.count({
      where: { userId, id: { in: parsed.data.documentIds } },
    });
    if (owned !== parsed.data.documentIds.length) {
      throw createApiError(
        "VALIDATION_ERROR",
        "One or more documents were not found in your library",
        400
      );
    }

    await db.collectionDocument.createMany({
      data: parsed.data.documentIds.map((documentId) => ({
        collectionId: id,
        documentId,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const userId = await requireUserId();
    const { id } = await context.params;
    const collection = await getOwnedCollection(userId, id);

    const url = new URL(request.url);
    const documentId = url.searchParams.get("documentId");

    if (documentId) {
      // Remove a single document from the collection.
      await db.collectionDocument.deleteMany({
        where: { collectionId: collection.id, documentId },
      });
    } else {
      await db.collection.delete({ where: { id: collection.id } });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
