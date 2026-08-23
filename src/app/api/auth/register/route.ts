import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";
import {
  createApiError,
  handleApiError,
} from "@/lib/server/api-helpers";
import { enforceRateLimit, getClientIp } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  try {
    // Throttle account creation per IP.
    enforceRateLimit(`register:${getClientIp(request)}`, 5, 10 * 60_000);

    const body: unknown = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      throw createApiError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid input",
        400
      );
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw createApiError(
        "EMAIL_TAKEN",
        "An account with this email already exists",
        409
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
      },
      select: { id: true },
    });

    await db.userSettings.create({
      data: { userId: user.id },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
