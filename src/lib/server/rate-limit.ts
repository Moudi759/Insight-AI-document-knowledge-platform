import { createApiError } from "@/lib/server/api-helpers";

/**
 * Dependency-free fixed-window rate limiter.
 *
 * Counters live in process memory — appropriate for a single instance.
 * For multi-region deployments, back this interface with Redis/Upstash
 * (the call sites only depend on enforceRateLimit throwing or passing).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_BUCKETS = 10_000;

function pruneExpired(now: number) {
  if (buckets.size < MAX_TRACKED_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Throws a 429 ApiError when the caller exceeds `limit` requests
 * inside `windowMs`. Key by user id where available, otherwise IP.
 */
export function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number
): void {
  const now = Date.now();
  pruneExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    throw createApiError(
      "RATE_LIMITED",
      `Too many requests. Please try again in ${retryAfterSeconds}s.`,
      429
    );
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "local";
}
