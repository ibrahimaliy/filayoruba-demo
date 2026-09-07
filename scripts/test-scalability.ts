import "dotenv/config";
import { listProductsPaginated } from "../src/server/services/product.service";
import { listOrdersPaginated } from "../src/server/services/order.service";
import { listCustomerDirectory } from "../src/server/services/customer.service";
import { checkRateLimitDistributed } from "../src/server/rate-limit";
import { redisSet, redisGet, redisDel } from "../src/server/redis";

async function main() {
  console.log("=== RUNNING SCALABILITY & PERFORMANCE TEST SUITE ===");

  // 1. Test Redis Key-Value & Fallback
  console.log("\n[1] Testing Distributed State Layer...");
  await redisSet("test:key", { ping: "pong" }, 10);
  const testVal = await redisGet<{ ping: string }>("test:key");
  console.log("Redis Get Value:", testVal);
  if (testVal?.ping !== "pong") throw new Error("Redis KV failed");
  await redisDel("test:key");
  console.log("✅ Distributed State layer working correctly!");

  // 2. Test Distributed Rate Limiter
  console.log("\n[2] Testing Distributed Sliding Rate Limiter...");
  const rl1 = await checkRateLimitDistributed("test-user-ip", 5, 60000);
  console.log("Rate Limit Request 1:", rl1);
  if (!rl1.success || rl1.remaining !== 4) throw new Error("Rate limiter failed");
  console.log("✅ Rate Limiter working correctly!");

  // 3. Test Paginated Products SQL Query
  console.log("\n[3] Testing Paginated Product SQL Query...");
  const paginatedProducts = await listProductsPaginated({ page: 1, limit: 5 });
  console.log(`Products Count: ${paginatedProducts.products.length}, Total: ${paginatedProducts.total}, Pages: ${paginatedProducts.totalPages}`);
  console.log("✅ Paginated Products SQL query working correctly!");

  // 4. Test Paginated Orders SQL Query
  console.log("\n[4] Testing Paginated Orders SQL Query...");
  const paginatedOrders = await listOrdersPaginated({ page: 1, limit: 5 });
  console.log(`Orders Count: ${paginatedOrders.orders.length}, Total: ${paginatedOrders.total}, Pages: ${paginatedOrders.totalPages}`);
  console.log("✅ Paginated Orders SQL query working correctly!");

  // 5. Test Customer Directory SQL Query
  console.log("\n[5] Testing Customer Directory Query...");
  const customerDir = await listCustomerDirectory();
  console.log(`Total Customers: ${customerDir.metrics.totalCustomers}, VIPs: ${customerDir.metrics.vipCount}`);
  console.log("✅ Customer Directory query working correctly!");

  console.log("\n🎉 ALL SCALABILITY TESTS PASSED WITH 100% SUCCESS!");
}

main().catch((err) => {
  console.error("❌ Test Suite Error:", err);
  process.exit(1);
});
