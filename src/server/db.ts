import "server-only";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/**
 * Enterprise Database Connection Layer with Adaptive Pooling
 * Supports PgBouncer / Prisma Accelerate / AWS RDS Proxy / Direct PostgreSQL
 */

declare global {
  // eslint-disable-next-line no-var
  var __filayoruba_prisma_client__: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __filayoruba_pg_pool__: Pool | undefined;
  // eslint-disable-next-line no-var
  var __filayoruba_prisma_mtime__: number | undefined;
}

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  "postgresql://postgres:postgres@localhost:5432/filayoruba?sslmode=disable";

const maxPoolConnections = parseInt(process.env.PG_POOL_MAX || "20", 10);

const pool =
  global.__filayoruba_pg_pool__ ??
  new Pool({
    connectionString,
    max: maxPoolConnections,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
    ...((connectionString.includes('neon.tech') || connectionString.includes('sslmode=require') || connectionString.includes('sslmode=verify-full')) ? { ssl: { rejectUnauthorized: false } } : {}),
  });

function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === "development") {
    try {
      const nodeRequire = eval("require");
      const pathModule = nodeRequire("path");
      const fsModule = nodeRequire("fs");
      const diskPath = pathModule.join(process.cwd(), "node_modules/.prisma/client/index.js");
      if (fsModule.existsSync(diskPath)) {
        const stat = fsModule.statSync(diskPath);
        if (
          !global.__filayoruba_prisma_mtime__ ||
          stat.mtimeMs > global.__filayoruba_prisma_mtime__
        ) {
          global.__filayoruba_prisma_client__ = undefined;
          global.__filayoruba_prisma_mtime__ = stat.mtimeMs;
        }
      }
    } catch {
      // Fall back to existing cached client
    }
  }

  let client = global.__filayoruba_prisma_client__;
  if (!client) {
    let PrismaClientClass: typeof PrismaClient = PrismaClient;
    try {
      const nodeRequire = eval("require");
      const pathModule = nodeRequire("path");
      const diskPath = pathModule.join(process.cwd(), "node_modules/.prisma/client/index.js");
      delete nodeRequire.cache[diskPath];
      const freshPrisma = nodeRequire(diskPath);
      if (freshPrisma && freshPrisma.PrismaClient) {
        PrismaClientClass = freshPrisma.PrismaClient;
      }
    } catch {
      // Fall back to static import
    }

    const adapter = new PrismaPg(pool);
    client = new PrismaClientClass({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["error", "warn"]
          : ["error"],
    });
    global.__filayoruba_prisma_client__ = client;
    global.__filayoruba_pg_pool__ = pool;
  }
  return client;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const val = (client as any)[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});

export const prisma = db;
export default db;
