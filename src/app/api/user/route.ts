import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  requireUserId,
  handleApiError,
} from "@/lib/server/api-helpers";
import { profileSchema } from "@/lib/validations/auth";

export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId();
    const body: unknown = await request.json();

    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: userId },
      data: {
        name: parsed.data.name,
        // Only touch image when explicitly provided — never wipe it silently.
        ...(parsed.data.image !== undefined
          ? { image: parsed.data.image || null }
          : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  // Password change.
  try {
    const userId = await requireUserId();
    const body: unknown = await request.json();
    const { currentPassword, newPassword } = body as Record<string, unknown>;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string"
    ) {
      return NextResponse.json(
        { error: "Both passwords are required." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "Account has no password set." },
        { status: 400 }
      );
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      return NextResponse.json(
        { error: "Your current password is incorrect." },
        { status: 403 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
