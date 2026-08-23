import type { NextRequest } from "next/server";
import { handlers } from "@/lib/server/auth";
import {
  enforceRateLimit,
  getClientIp,
} from "@/lib/server/rate-limit";
import { handleApiError } from "@/lib/server/api-helpers";

const { GET, POST: authPost } = handlers;

// Brute-force guard on credential sign-in attempts.
export async function POST(request: Request) {
  try {
    enforceRateLimit(`auth:${getClientIp(request)}`, 20, 60_000);
    return await authPost(request as NextRequest);
  } catch (error) {
    return handleApiError(error);
  }
}

export { GET };
