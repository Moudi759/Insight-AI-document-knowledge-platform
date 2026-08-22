import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireUserId,
  handleApiError,
} from "@/lib/server/api-helpers";
import { createCollectionSchema } from "@/lib/validations/schemas";
import { getUserCollections } from "@/lib/server/documents/service";

export async function GET() {
  try {
    const userId = await requireUserId();
    const collections = await getUserCollections(userId);
    return NextResponse.json({ collections });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body: unknown = await request.json();

    const parsed = createCollectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const existing = await db.collection.findFirst({
      where: { userId, name: parsed.data.name },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A collection with this name already exists." },
        { status: 409 }
      );
    }

    const created = await db.collection.create({
      data: {
        userId,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        color: parsed.data.color ?? "#6366f1",
      },
      select: { id: true },
    });

    return NextResponse.json({ collection: created }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
