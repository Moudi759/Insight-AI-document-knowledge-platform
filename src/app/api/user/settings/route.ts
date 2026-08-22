import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  requireUserId,
  handleApiError,
} from "@/lib/server/api-helpers";

const THEMES = ["SYSTEM", "LIGHT", "DARK"] as const;

export async function PATCH(request: Request) {
  try {
    const userId = await requireUserId();
    const body: unknown = await request.json();
    const {
      theme,
      aiTemperature,
      aiCitationsEnabled,
      notificationsEnabled,
      emailDigest,
    } = body as Record<string, unknown>;

    await db.userSettings.upsert({
      where: { userId },
      update: {
        ...(typeof theme === "string" && THEMES.includes(theme as never)
          ? { theme: theme as (typeof THEMES)[number] }
          : {}),
        ...(typeof aiTemperature === "number" &&
        aiTemperature >= 0 &&
        aiTemperature <= 1
          ? { aiTemperature }
          : {}),
        ...(typeof aiCitationsEnabled === "boolean"
          ? { aiCitationsEnabled }
          : {}),
        ...(typeof notificationsEnabled === "boolean"
          ? { notificationsEnabled }
          : {}),
        ...(typeof emailDigest === "boolean" ? { emailDigest } : {}),
      },
      create: { userId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
