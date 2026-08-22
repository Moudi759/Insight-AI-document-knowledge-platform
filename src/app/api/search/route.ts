import { NextResponse } from "next/server";
import { requireUserId, handleApiError } from "@/lib/server/api-helpers";
import { globalSearch } from "@/lib/server/search/service";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";

    if (query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await globalSearch(userId, query);
    return NextResponse.json({ results });
  } catch (error) {
    return handleApiError(error);
  }
}
