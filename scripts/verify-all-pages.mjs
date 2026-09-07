async function testAllPages() {
  const BASE_URL = "http://localhost:3000";
  console.log("=== COMPREHENSIVE SSR PAGE ROUTES VERIFICATION ===");

  const routes = [
    { name: "Homepage", path: "/" },
    { name: "Products Listing", path: "/products" },
    { name: "Collections Listing", path: "/collections" },
    { name: "Cart Page", path: "/cart" },
    { name: "Checkout Page", path: "/checkout" },
    { name: "Order Tracking", path: "/track-order" },
    { name: "Order Cancellation", path: "/cancel-order" },
    { name: "About Us", path: "/about" },
    { name: "Contact Page", path: "/contact" },
    { name: "Size Guide", path: "/size-guide" },
    { name: "Return Policy", path: "/return-policy" },
    { name: "Wishlist Page", path: "/wishlist" },
    { name: "Admin Portal", path: "/admin" },
  ];

  let passed = 0;
  let failed = 0;

  for (const r of routes) {
    try {
      const url = `${BASE_URL}${r.path}`;
      const res = await fetch(url);
      if (res.status === 200) {
        const text = await res.text();
        const hasHtml = text.includes("<html") || text.includes("<!DOCTYPE html") || text.length > 500;
        console.log(`✅ [HTTP 200] ${r.name} (${r.path}) - Length: ${text.length} chars`);
        passed++;
      } else {
        console.error(`❌ [HTTP ${res.status}] ${r.name} (${r.path})`);
        failed++;
      }
    } catch (err) {
      console.error(`❌ Error fetching ${r.path}:`, err.message);
      failed++;
    }
  }

  // Also test dynamic product detail page
  try {
    const prodRes = await fetch(`${BASE_URL}/api/products`);
    const prodData = await prodRes.json();
    const firstProd = Array.isArray(prodData) ? prodData[0] : prodData.products?.[0];
    if (firstProd && firstProd.slug) {
      const pdpRes = await fetch(`${BASE_URL}/products/${firstProd.slug}`);
      if (pdpRes.status === 200) {
        console.log(`✅ [HTTP 200] Product Detail Page (/products/${firstProd.slug})`);
        passed++;
      } else {
        console.error(`❌ [HTTP ${pdpRes.status}] Product Detail Page (/products/${firstProd.slug})`);
        failed++;
      }
    }
  } catch (err) {
    console.error(`❌ PDP Test Error:`, err.message);
  }

  console.log(`\nPage Testing Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

testAllPages();
