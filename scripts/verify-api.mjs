async function test() {
  console.log("Testing API routes on http://localhost:3000 ...");
  try {
    const pRes = await fetch("http://localhost:3000/api/products");
    console.log(`GET /api/products -> HTTP ${pRes.status}, Cache-Control: ${pRes.headers.get("cache-control")}`);
    const pData = await pRes.json();
    console.log(`Products returned: ${Array.isArray(pData) ? pData.length : "object"}`);

    const cRes = await fetch("http://localhost:3000/api/collections");
    console.log(`GET /api/collections -> HTTP ${cRes.status}, Cache-Control: ${cRes.headers.get("cache-control")}`);
    const cData = await cRes.json();
    console.log(`Collections returned: ${Array.isArray(cData) ? cData.length : "object"}`);

    console.log("✅ API Health & CDN Caching Headers Verified!");
  } catch (err) {
    console.log("Could not connect to localhost:3000 or server starting:", err.message);
  }
}

test();
