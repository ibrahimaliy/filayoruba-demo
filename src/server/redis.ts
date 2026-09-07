import "server-only";
import { EventEmitter } from "events";

/**
 * Enterprise Distributed State & Caching Layer for Fìlà Yorùbá
 * Supports Upstash Redis REST API (zero native build dependencies, edge/serverless ready)
 * with seamless local in-memory fallback for development and environments without Redis.
 */

declare global {
  // In-memory fallback stores
  // eslint-disable-next-line no-var
  var __filayoruba_mem_store__: Map<string, { value: any; expiresAt?: number }> | undefined;
  // eslint-disable-next-line no-var
  var __filayoruba_pubsub_bus__: EventEmitter | undefined;
}

const memStore: Map<string, { value: any; expiresAt?: number }> =
  global.__filayoruba_mem_store__ ?? new Map();

const pubsubBus: EventEmitter =
  global.__filayoruba_pubsub_bus__ ?? new EventEmitter();
pubsubBus.setMaxListeners(200);

if (process.env.NODE_ENV !== "production") {
  global.__filayoruba_mem_store__ = memStore;
  global.__filayoruba_pubsub_bus__ = pubsubBus;
}

// Periodic cleanup for expired memory keys every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memStore.entries()) {
      if (record.expiresAt && now > record.expiresAt) {
        memStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

function getUpstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    return { url: url.replace(/\/$/, ""), token };
  }
  return null;
}

async function upstashCommand<T = any>(command: any[]): Promise<T | null> {
  const config = getUpstashConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([command]),
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn(`[Redis Upstash] Command failed HTTP ${response.status}`);
      return null;
    }

    const json = await response.json();
    if (Array.isArray(json) && json[0]) {
      if (json[0].error) {
        console.warn(`[Redis Upstash Error]:`, json[0].error);
        return null;
      }
      return json[0].result as T;
    }
    return null;
  } catch (err) {
    console.warn(`[Redis Upstash Network Error]:`, err);
    return null;
  }
}

/**
 * Get item from distributed Redis or local memory fallback
 */
export async function redisGet<T = any>(key: string): Promise<T | null> {
  const config = getUpstashConfig();
  if (config) {
    const raw = await upstashCommand<string | null>(["GET", key]);
    if (raw === null || raw === undefined) return null;
    try {
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return raw as unknown as T;
    }
  }

  const record = memStore.get(key);
  if (!record) return null;
  if (record.expiresAt && Date.now() > record.expiresAt) {
    memStore.delete(key);
    return null;
  }
  return record.value as T;
}

/**
 * Set key with optional TTL in seconds
 */
export async function redisSet(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  const config = getUpstashConfig();

  if (config) {
    const cmd = ttlSeconds && ttlSeconds > 0
      ? ["SET", key, serialized, "EX", ttlSeconds]
      : ["SET", key, serialized];
    const res = await upstashCommand(cmd);
    return res !== null;
  }

  memStore.set(key, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
  });
  return true;
}

/**
 * Delete key from distributed Redis or memory
 */
export async function redisDel(key: string): Promise<boolean> {
  const config = getUpstashConfig();
  if (config) {
    const res = await upstashCommand(["DEL", key]);
    return res !== null;
  }
  return memStore.delete(key);
}

/**
 * Distributed Sliding Window Rate Limiting
 */
export async function redisSlidingRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}> {
  const now = Date.now();
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const fullKey = `ratelimit:${key}`;

  const config = getUpstashConfig();
  if (config) {
    // Pipeline: Remove old entries, add current timestamp, count members in window, set TTL
    const minTimestamp = now - windowMs;
    const member = `${now}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      const response = await fetch(`${config.url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["ZREMRANGEBYSCORE", fullKey, "-inf", minTimestamp],
          ["ZADD", fullKey, now, member],
          ["ZCARD", fullKey],
          ["EXPIRE", fullKey, windowSeconds + 1],
        ]),
        cache: "no-store",
      });

      if (response.ok) {
        const json = await response.json();
        const currentCount = json[2]?.result ?? 1;
        const success = currentCount <= limit;
        return {
          success,
          limit,
          remaining: Math.max(0, limit - currentCount),
          resetSeconds: windowSeconds,
        };
      }
    } catch {
      // Fallback to memory limiter if Upstash times out
    }
  }

  // In-memory sliding window fallback
  const record = memStore.get(fullKey) || { value: [] as number[] };
  let timestamps: number[] = Array.isArray(record.value) ? record.value : [];
  timestamps = timestamps.filter((ts) => now - ts < windowMs);

  if (timestamps.length >= limit) {
    const oldest = timestamps[0] || now;
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds,
    };
  }

  timestamps.push(now);
  memStore.set(fullKey, {
    value: timestamps,
    expiresAt: now + windowMs + 1000,
  });

  return {
    success: true,
    limit,
    remaining: limit - timestamps.length,
    resetSeconds: windowSeconds,
  };
}

/**
 * Publish message across instances via Redis or local pub/sub
 */
export async function redisPublish(channel: string, message: any): Promise<void> {
  const config = getUpstashConfig();
  const serialized = typeof message === "string" ? message : JSON.stringify(message);

  if (config) {
    await upstashCommand(["PUBLISH", channel, serialized]);
  }

  // Always emit on local bus so current process listeners fire immediately
  pubsubBus.emit(channel, message);
}

/**
 * Subscribe to channel updates
 */
export function redisSubscribe(channel: string, callback: (message: any) => void): () => void {
  pubsubBus.on(channel, callback);
  return () => {
    pubsubBus.off(channel, callback);
  };
}
