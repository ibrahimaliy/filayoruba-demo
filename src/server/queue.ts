import "server-only";
import { Order, OrderStatus } from "@/types/order";
import {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendAdminNewOrderAlertEmail,
} from "./services/email.service";

/**
 * Enterprise Asynchronous Job Queue for Fìlà Yorùbá
 * Supports:
 * 1. Upstash QStash serverless queue dispatch (when QSTASH_TOKEN is configured)
 * 2. In-process resilient background worker with exponential backoff retries & dead-letter logging
 */

export interface Job<T = any> {
  id: string;
  name: string;
  payload: T;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
}

export type JobHandler<T = any> = (payload: T) => Promise<void>;

const jobHandlers = new Map<string, JobHandler>();

// In-memory idempotency deduplication cache (Job name + deduplicationKey -> timestamp)
const recentDispatches = new Map<string, number>();

function cleanRecentDispatches() {
  const now = Date.now();
  for (const [key, timestamp] of recentDispatches.entries()) {
    if (now - timestamp > 15 * 60 * 1000) { // 15-minute deduplication window
      recentDispatches.delete(key);
    }
  }
}

/**
 * Register a background job handler
 */
export function registerJobHandler<T = any>(jobName: string, handler: JobHandler<T>): void {
  jobHandlers.set(jobName, handler);
}

/**
 * Enqueues a job for background processing with automated retries and optional idempotency deduplication
 */
export async function enqueueJob<T = any>(
  jobName: string,
  payload: T,
  options?: { maxAttempts?: number; delayMs?: number; deduplicationKey?: string }
): Promise<string> {
  if (options?.deduplicationKey) {
    cleanRecentDispatches();
    const dedupKey = `${jobName}:${options.deduplicationKey}`;
    if (recentDispatches.has(dedupKey)) {
      console.log(`[Queue Deduplication] Suppressed duplicate enqueue for "${dedupKey}"`);
      return `dedup_${options.deduplicationKey}`;
    }
    recentDispatches.set(dedupKey, Date.now());
  }

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const maxAttempts = options?.maxAttempts ?? 3;
  const delayMs = options?.delayMs ?? 0;

  // 1. If Upstash QStash is configured in environment, dispatch to distributed queue
  const qstashToken = process.env.QSTASH_TOKEN || process.env.UPSTASH_QSTASH_TOKEN;
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (qstashToken && appUrl.startsWith("https://")) {
    try {
      const qstashUrl = `https://qstash.upstash.io/v2/publish/${appUrl}/api/webhooks/queue-worker`;
      const qstashRes = await fetch(qstashUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${qstashToken}`,
          "Content-Type": "application/json",
          "Upstash-Retries": maxAttempts.toString(),
          ...(delayMs > 0 && { "Upstash-Delay": `${Math.ceil(delayMs / 1000)}s` }),
        },
        body: JSON.stringify({ jobName, jobId, payload }),
      });

      if (qstashRes.ok) {
        return jobId;
      }
    } catch {
      // Fallback to internal worker
    }
  }

  // 2. Resilient In-Process Asynchronous Worker with Exponential Backoff Retries
  const execute = async (attempt = 1) => {
    if (delayMs > 0 && attempt === 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const handler = jobHandlers.get(jobName);
    if (!handler) {
      console.warn(`[Queue Worker] No registered handler for job "${jobName}"`);
      return;
    }

    try {
      await handler(payload);
    } catch (error) {
      console.error(`[Queue Worker] Job "${jobName}" (${jobId}) failed on attempt ${attempt}/${maxAttempts}:`, error);
      if (attempt < maxAttempts) {
        const nextDelay = Math.min(1000 * Math.pow(2, attempt), 10000); // 2s, 4s, 8s
        setTimeout(() => execute(attempt + 1), nextDelay);
      } else {
        console.error(`[Queue Dead-Letter] Job "${jobName}" (${jobId}) permanently failed after ${maxAttempts} attempts.`);
      }
    }
  };

  // Run asynchronously; leverage Next.js after() when in an active request context to prevent serverless freeze
  try {
    const { after } = require("next/server");
    if (typeof after === "function") {
      after(() => {
        execute().catch((err) => console.error(`[Queue Worker Error]`, err));
      });
      return jobId;
    }
  } catch {
    // Not within an active Next.js request context or after() unavailable
  }

  queueMicrotask(() => {
    execute().catch((err) => console.error(`[Queue Microtask Error]`, err));
  });

  return jobId;
}

// ==========================================
// REGISTER DEFAULT BACKGROUND JOB HANDLERS
// ==========================================

registerJobHandler<Order>("EMAIL_ORDER_CONFIRMATION", async (order) => {
  const result = await sendOrderConfirmationEmail(order);
  if (!result.success && result.provider === "resend") {
    throw new Error(result.error || "Failed to deliver order confirmation email");
  }
});

registerJobHandler<{ order: Order; status: OrderStatus }>("EMAIL_STATUS_UPDATE", async ({ order, status }) => {
  const result = await sendOrderStatusUpdateEmail(order, status);
  if (!result.success && result.provider === "resend") {
    throw new Error(result.error || `Failed to deliver ${status} status update email`);
  }
});

registerJobHandler<Order>("EMAIL_ADMIN_ALERT", async (order) => {
  const result = await sendAdminNewOrderAlertEmail(order);
  if (!result.success && result.provider === "resend") {
    throw new Error(result.error || "Failed to deliver admin order alert email");
  }
});

// ==========================================
// CONVENIENCE DISPATCH HELPERS
// ==========================================

export function queueOrderConfirmationEmail(order: Order) {
  return enqueueJob("EMAIL_ORDER_CONFIRMATION", order, { deduplicationKey: order.id });
}

export function queueOrderStatusUpdateEmail(order: Order, status: OrderStatus) {
  return enqueueJob("EMAIL_STATUS_UPDATE", { order, status }, { deduplicationKey: `${order.id}:${status}` });
}

export function queueAdminNewOrderAlertEmail(order: Order) {
  return enqueueJob("EMAIL_ADMIN_ALERT", order, { deduplicationKey: order.id });
}
