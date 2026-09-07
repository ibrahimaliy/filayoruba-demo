import "server-only";
import { db } from "@/server/db";
import {
  hashPassword,
  getAdminSecret,
  getMasterAdminPassword,
} from "./auth-edge";

export * from "./auth-edge";

/**
 * Auto-seeds the default Super Admin user in PostgreSQL if table is empty (Node.js runtime only)
 */
export async function ensureDefaultAdminUser() {
  try {
    const count = await db.adminUser.count();
    if (count === 0) {
      const defaultPassword = getMasterAdminPassword();
      const salt = crypto.randomUUID();
      const passwordHash = await hashPassword(defaultPassword, salt);

      await db.adminUser.create({
        data: {
          email: "admin@filayoruba.com",
          name: "Fìlà Yorùbá Master Artisan",
          password: passwordHash,
          salt,
          role: "SUPER_ADMIN",
        },
      });
      console.log("🛡️ [SECURITY] Auto-seeded default Super Admin (admin@filayoruba.com).");
    }
  } catch (error) {
    // Non-blocking in case of connection latency
    console.warn("Could not check admin users table:", error);
  }
}
