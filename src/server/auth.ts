import "server-only";
import { db } from "@/server/db";
import {
  hashPassword,
  getAdminSecret,
  getMasterAdminPassword,
  getDemoAdminPassword,
} from "./auth-edge";

export * from "./auth-edge";

/**
 * Auto-seeds the default Super Admin user in PostgreSQL if table is empty (Node.js runtime only)
 */
export async function ensureDefaultAdminUser() {
  try {
    const count = await db.adminUser.count();
    if (count === 0) {
      const defaultPassword = getMasterAdminPassword() || crypto.randomUUID();
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

    // Ensure dedicated sandbox demo reviewer user exists
    const demoUser = await db.adminUser.findFirst({
      where: { email: { equals: "demo@filayoruba.com", mode: "insensitive" } },
    });
    if (!demoUser) {
      const demoPass = getDemoAdminPassword();
      const salt = crypto.randomUUID();
      const passwordHash = await hashPassword(demoPass, salt);

      await db.adminUser.create({
        data: {
          email: "demo@filayoruba.com",
          name: "Portfolio Demo Reviewer",
          password: passwordHash,
          salt,
          role: "SUPER_ADMIN",
        },
      });
      console.log("🛡️ [SECURITY] Auto-seeded Portfolio Demo Reviewer (demo@filayoruba.com).");
    }
  } catch (error) {
    // Non-blocking in case of connection latency
    console.warn("Could not check admin users table:", error);
  }
}
