import "server-only";
import { db } from "@/server/db";
import { AnnouncementBarConfig, UpdateAnnouncementBarInput } from "@/types/announcement";
import {
  DEFAULT_ANNOUNCEMENT_CONFIG,
  DEFAULT_ANNOUNCEMENT_MESSAGES,
} from "@/data/default-announcements";
import { revalidateTag } from "next/cache";

function safeRevalidateAnnouncementBar() {
  try {
    revalidateTag("announcement-bar", "max-age=0");
  } catch {
    // Non-fatal in edge/test runtimes
  }
}

/**
 * Get the current top announcement bar configuration.
 * Always returns a valid AnnouncementBarConfig with safe defaults even if database is unseeded.
 */
export async function getAnnouncementBar(): Promise<AnnouncementBarConfig> {
  try {
    if (!db?.announcementBar || typeof db.announcementBar.findUnique !== "function") {
      return DEFAULT_ANNOUNCEMENT_CONFIG;
    }

    const record = await db.announcementBar.findUnique({
      where: { id: "default" },
    });

    if (!record) {
      // Auto-seed default configuration
      try {
        const created = await db.announcementBar.create({
          data: {
            id: "default",
            isEnabled: DEFAULT_ANNOUNCEMENT_CONFIG.isEnabled,
            speed: DEFAULT_ANNOUNCEMENT_CONFIG.speed,
            messages: DEFAULT_ANNOUNCEMENT_MESSAGES,
          },
        });
        return {
          id: created.id,
          isEnabled: created.isEnabled,
          speed: created.speed,
          messages: created.messages.length > 0 ? created.messages : DEFAULT_ANNOUNCEMENT_MESSAGES,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      } catch {
        return DEFAULT_ANNOUNCEMENT_CONFIG;
      }
    }

    return {
      id: record.id,
      isEnabled: record.isEnabled,
      speed: record.speed || 25,
      messages:
        Array.isArray(record.messages) && record.messages.length > 0
          ? record.messages
          : DEFAULT_ANNOUNCEMENT_MESSAGES,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  } catch (error) {
    console.error("Failed to retrieve announcement bar from database, using fallback:", error);
    return DEFAULT_ANNOUNCEMENT_CONFIG;
  }
}

/**
 * Update the top announcement bar configuration.
 */
export async function updateAnnouncementBar(
  input: UpdateAnnouncementBarInput
): Promise<AnnouncementBarConfig> {
  try {
    if (!db?.announcementBar || typeof db.announcementBar.upsert !== "function") {
      throw new Error("Database client for announcementBar is unavailable");
    }

    // Clean and validate messages
    let sanitizedMessages = DEFAULT_ANNOUNCEMENT_MESSAGES;
    if (Array.isArray(input.messages)) {
      sanitizedMessages = input.messages
        .map((m) => (typeof m === "string" ? m.trim() : ""))
        .filter((m) => m.length > 0);

      if (sanitizedMessages.length === 0) {
        sanitizedMessages = DEFAULT_ANNOUNCEMENT_MESSAGES;
      }
    }

    // Validate speed (clamp between 5s and 120s)
    let speed = 25;
    if (typeof input.speed === "number" && !isNaN(input.speed)) {
      speed = Math.min(Math.max(Math.round(input.speed), 5), 120);
    }

    const isEnabled = input.isEnabled !== undefined ? Boolean(input.isEnabled) : true;

    const updated = await db.announcementBar.upsert({
      where: { id: "default" },
      update: {
        isEnabled,
        speed,
        messages: sanitizedMessages,
      },
      create: {
        id: "default",
        isEnabled,
        speed,
        messages: sanitizedMessages,
      },
    });

    safeRevalidateAnnouncementBar();

    return {
      id: updated.id,
      isEnabled: updated.isEnabled,
      speed: updated.speed,
      messages: updated.messages,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  } catch (error) {
    console.error("Failed to update announcement bar:", error);
    throw error;
  }
}
