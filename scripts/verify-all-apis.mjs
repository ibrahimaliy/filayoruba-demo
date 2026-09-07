
async function testAllApis() {
  const BASE_URL = "http://localhost:3000";
  console.log("=== COMPREHENSIVE API ENDPOINTS VERIFICATION ===");

  const tests = [
    { name: "Products List", url: `${BASE_URL}/api/products`, expectedStatus: 200 },
    { name: "Collections List", url: `${BASE_URL}/api/collections`, expectedStatus: 200 },
    { name: "Announcement Banner", url: `${BASE_URL}/api/announcement`, expectedStatus: 200 },
    { name: "Hero Slides", url: `${BASE_URL}/api/hero-slides`, expectedStatus: 200 },
    { name: "Admin Dashboard Metrics (Unauthenticated -> 401)", url: `${BASE_URL}/api/admin/metrics`, expectedStatus: 401 },
    { name: "Admin Orders (Unauthenticated -> 401)", url: `${BASE_URL}/api/admin/orders`, expectedStatus: 401 },
    { name: "Admin Inventory (Unauthenticated -> 401)", url: `${BASE_URL}/api/admin/inventory`, expectedStatus: 401 },
    { name: "Customer Orders (Without Auth/Session -> 401 or empty)", url: `${BASE_URL}/api/customer/orders`, expectedStatus: [401, 200] },
    { name: "Paystack Verification (Without Reference -> 400)", url: `${BASE_URL}/api/paystack/verify`, expectedStatus: 400 },
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      const res = await fetch(t.url);
      const isExpected = Array.isArray(t.expectedStatus) 
        ? t.expectedStatus.includes(res.status)
        : res.status === t.expectedStatus;

      if (isExpected) {
        console.log(`✅ [${res.status}] ${t.name}`);
        passed++;
      } else {
        console.error(`❌ [${res.status} != ${t.expectedStatus}] ${t.name}`);
        failed++;
      }
    } catch (err) {
      console.error(`❌ Error fetching ${t.url}:`, err.message);
      failed++;
    }
  }

  console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

testAllApis();
