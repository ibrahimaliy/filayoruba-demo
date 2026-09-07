import "server-only";
import { redisSlidingRateLimit, redisDel } from "./redis";

interface RateLimitRecord {
  timestamps: number[];
}

declare global {
  // eslint-disable-next-line no-var
  var __filayoruba_rate_limits__: Map<string, RateLimitRecord> | undefined;
}

const rateLimitStore: Map<string, RateLimitRecord> =
  global.__filayoruba_rate_limits__ ?? new Map();

if (process.env.NODE_ENV !== "production") {
  global.__filayoruba_rate_limits__ = rateLimitStore;
}

// Clean up expired records every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 60 * 60 * 1000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Synchronous in-memory sliding-window rate limiter (fallback & fast path)
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { timestamps: [] };

  // Remove timestamps outside the sliding window
  const validTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= limit) {
    const oldestTimestamp = validTimestamps[0] || now;
    const resetTime = oldestTimestamp + windowMs;
    const resetSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));

    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds,
    };
  }

  validTimestamps.push(now);
  rateLimitStore.set(key, { timestamps: validTimestamps });

  return {
    success: true,
    limit,
    remaining: limit - validTimestamps.length,
    resetSeconds: Math.ceil(windowMs / 1000),
  };
}

/**
 * Distributed multi-instance asynchronous sliding-window rate limiter
 */
export async function checkRateLimitDistributed(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  return redisSlidingRateLimit(key, limit, windowMs);
}

/**
 * Resets/clears the rate limit for a given key upon successful authentication
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
  redisDel(`ratelimit:${key}`).catch(() => {});
}

/**
 * Extracts client IP address from incoming Next.js request headers
 * Prioritizes trusted edge headers (Cloudflare, reverse proxies) to prevent header spoofing.
 */
export function getClientIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) {
    return cfIp.trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return "127.0.0.1";
}
