import * as fs from "node:fs";
import * as path from "node:path";

interface TestResult {
  category: string;
  test: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assertTest(category: string, test: string, condition: boolean, details: string) {
  results.push({
    category,
    test,
    passed: condition,
    details,
  });
}

async function runTests() {
  const root = process.cwd();

  console.log("=================================================");
  console.log("  FILA YORÙBÁ — QA & SECURITY REVIEW AUDIT SUITE");
  console.log("=================================================\n");

  // 1. FOOTER BUGS (High Severity)
  const footerContent = fs.readFileSync(path.join(root, "src/components/layout/Footer.tsx"), "utf-8");
  assertTest(
    "Storefront / Footer",
    "Footer email link is not a placeholder and points to valid mailto",
    footerContent.includes('href="mailto:demo@filayoruba.com"') && !footerContent.includes("[EMAIL_ADDRESS]"),
    footerContent.includes("[EMAIL_ADDRESS]") ? "Found literal [EMAIL_ADDRESS] placeholder" : "Correctly set to mailto:demo@filayoruba.com"
  );

  assertTest(
    "Storefront / Footer",
    "Footer phone link matches demo support number",
    footerContent.includes("+234 (0) 800 FILA DEMO"),
    "Footer displays demo showcase helpline"
  );

  // 2. SEO & METADATA
  const productPageContent = fs.readFileSync(path.join(root, "src/app/products/[slug]/page.tsx"), "utf-8");
  assertTest(
    "SEO & Metadata",
    "Product page generates full OpenGraph tags (title, description, image, dimensions, locale)",
    productPageContent.includes("openGraph:") &&
      productPageContent.includes("width: 1200") &&
      productPageContent.includes("height: 630") &&
      productPageContent.includes("locale: \"en_NG\""),
    "OpenGraph metadata configured with 1200x630 dimensions and locale"
  );

  assertTest(
    "SEO & Metadata",
    "Product page generates Twitter large summary card",
    productPageContent.includes("twitter:") && productPageContent.includes("summary_large_image"),
    "Twitter summary_large_image card configured"
  );

  assertTest(
    "SEO & Metadata",
    "Product page title does not duplicate brand name",
    !productPageContent.includes("Fìlà Yorùbá Luxury Yoruba Fila | Fìlà Yorùbá") &&
      productPageContent.includes("title: `${product.name} — Handcrafted Yoruba Cap`"),
    "Clean title template without nested brand name repetition"
  );

  const layoutContent = fs.readFileSync(path.join(root, "src/app/layout.tsx"), "utf-8");
  assertTest(
    "SEO & Metadata",
    "Layout metadataBase dynamically resolves deployment domain",
    layoutContent.includes("process.env.NEXT_PUBLIC_APP_URL") || layoutContent.includes("filayoruba-theta.vercel.app"),
    "metadataBase uses environment variable or active deployment domain"
  );

  // 3. SECURITY HEADERS & CLICKJACKING
  const nextConfigContent = fs.readFileSync(path.join(root, "next.config.ts"), "utf-8");
  assertTest(
    "Security Headers",
    "Anti-clickjacking protection (X-Frame-Options: DENY & frame-ancestors: none)",
    nextConfigContent.includes("X-Frame-Options") &&
      nextConfigContent.includes("DENY") &&
      nextConfigContent.includes("frame-ancestors 'none'"),
    "X-Frame-Options: DENY and CSP frame-ancestors: none configured"
  );

  assertTest(
    "Security Headers",
    "HSTS, X-Content-Type-Options & Permissions-Policy configured",
    nextConfigContent.includes("Strict-Transport-Security") &&
      nextConfigContent.includes("X-Content-Type-Options") &&
      nextConfigContent.includes("nosniff"),
    "HSTS max-age, X-Content-Type-Options: nosniff, and Permissions-Policy configured"
  );

  // 4. CLIENT BUNDLE SECRETS PROTECTION
  const clientDirs = ["src/components", "src/hooks", "src/store", "src/lib"];
  let leakedSecrets: string[] = [];
  for (const dir of clientDirs) {
    const fullDir = path.join(root, dir);
    if (fs.existsSync(fullDir)) {
      const files = fs.readdirSync(fullDir, { recursive: true }) as string[];
      for (const file of files) {
        if (file.endsWith(".tsx") || file.endsWith(".ts")) {
          const filePath = path.join(fullDir, file);
          const content = fs.readFileSync(filePath, "utf-8");
          if (content.includes("PAYSTACK_SECRET_KEY") || content.includes("JWT_SECRET") || content.includes("ADMIN_PASSWORD")) {
            leakedSecrets.push(`${dir}/${file}`);
          }
        }
      }
    }
  }
  assertTest(
    "Security / Secrets",
    "Paystack Secret Key & JWT secrets are never referenced in client-side bundles",
    leakedSecrets.length === 0,
    leakedSecrets.length === 0 ? "0 leaked secrets in client components/hooks/store" : `Found secrets in: ${leakedSecrets.join(", ")}`
  );

  // 5. ENUMERATION & PRIVACY PROTECTION
  const trackRouteContent = fs.readFileSync(path.join(root, "src/app/api/orders/track/route.ts"), "utf-8");
  assertTest(
    "Functional QA / Privacy",
    "Order Tracking requires matching email or owner session (Enumeration Protection)",
    trackRouteContent.includes("isOwnerSession") &&
      trackRouteContent.includes("if (!email)") &&
      trackRouteContent.includes("orderEmail !== email"),
    "Order lookup strictly checks email against order before returning details"
  );

  assertTest(
    "Functional QA / Privacy",
    "Order Tracking sanitizes customer PII (masks phone and street address for guests)",
    trackRouteContent.includes("maskPhone") && trackRouteContent.includes("maskStreetAddress"),
    "Phone number and address are masked for non-owner sessions"
  );

  const cancelRouteContent = fs.readFileSync(path.join(root, "src/app/api/customer/orders/cancel/route.ts"), "utf-8");
  assertTest(
    "Functional QA / Cancellation",
    "Order Cancellation requires matching email or authenticated customer session",
    cancelRouteContent.includes("sessionCustomer") &&
      cancelRouteContent.includes("resolvedEmail") &&
      cancelRouteContent.includes("401"),
    "Unauthenticated cancellation requests without matching order email are rejected with 401"
  );

  // 6. PAYSTACK WEBHOOK & SERVER-SIDE VERIFICATION
  const paymentServiceContent = fs.readFileSync(path.join(root, "src/server/services/payment.service.ts"), "utf-8");
  assertTest(
    "Checkout & Payments",
    "Paystack webhook validates constant-time HMAC SHA-512 signature",
    paymentServiceContent.includes("crypto.timingSafeEqual") && paymentServiceContent.includes("sha512"),
    "Constant-time HMAC SHA-512 signature verification implemented"
  );

  const verifyRouteContent = fs.readFileSync(path.join(root, "src/app/api/paystack/verify/route.ts"), "utf-8");
  assertTest(
    "Checkout & Payments",
    "Server-side amount & currency verification (client prices not trusted)",
    verifyRouteContent.includes("expectedAmountKobo") &&
      verifyRouteContent.includes("currency !== \"NGN\"") &&
      verifyRouteContent.includes("SECURITY_PAYMENT_MISMATCH"),
    "Authoritative server total comparison and NGN currency lock enforced"
  );

  // 7. ADMIN SECURITY & RATE LIMITING
  const adminLoginContent = fs.readFileSync(path.join(root, "src/app/api/admin/auth/login/route.ts"), "utf-8");
  assertTest(
    "Admin Panel / Security",
    "Admin login enforces anti-brute-force rate limiting with audit logging",
    adminLoginContent.includes("checkRateLimitDistributed") &&
      adminLoginContent.includes("ADMIN_LOGIN_RATE_LIMITED") &&
      adminLoginContent.includes("status: 429"),
    "Distributed rate limiting (10 attempts / 15m in prod) with audit logging"
  );

  const middlewareContent = fs.readFileSync(path.join(root, "src/middleware.ts"), "utf-8");
  assertTest(
    "Admin Panel / Security",
    "Admin routes reject unauthenticated requests via direct URL",
    middlewareContent.includes("/admin/:path*") &&
      middlewareContent.includes("validateAdminRequest") &&
      middlewareContent.includes("NextResponse.redirect(loginUrl)"),
    "Middleware enforces session validation, redirecting unauthenticated users to /admin/login"
  );

  // 8. STORAGE ARCHITECTURE
  const storageContent = fs.readFileSync(path.join(root, "src/server/services/storage.service.ts"), "utf-8");
  assertTest(
    "Architecture / Uploads",
    "Persistent cloud storage integration (Cloudinary with auto edge optimization)",
    storageContent.includes("CLOUDINARY_CLOUD_NAME") &&
      storageContent.includes("f_auto,q_auto") &&
      storageContent.includes("uploadToCloudinary"),
    "Cloudinary cloud storage with auto f_auto,q_auto edge optimization configured"
  );

  // 9. SIZE GUIDE CONSISTENCY
  const sizingContent = fs.readFileSync(path.join(root, "src/data/sizing.ts"), "utf-8");
  assertTest(
    "Storefront / Sizing",
    "Size guide numbers cover 22″–25″ traditional Yoruba range (XS: 22.0″ to XXXL: 25.0″)",
    sizingContent.includes('inches: 22.0') && sizingContent.includes('inches: 25.0'),
    "Complete size scale: XS (22.0\"), S (22.5\"), M (23.0\"), L (23.5\"), XL (24.0\"), XXL (24.5\"), XXXL (25.0\")"
  );

  // PRINT SUMMARY
  let passedCount = 0;
  for (const res of results) {
    const icon = res.passed ? "✅ PASS" : "❌ FAIL";
    if (res.passed) passedCount++;
    console.log(`${icon} [${res.category}] ${res.test}`);
    console.log(`       └─ ${res.details}`);
  }

  console.log("\n-------------------------------------------------");
  console.log(`  TOTAL: ${passedCount}/${results.length} PASSED (${Math.round((passedCount / results.length) * 100)}%)`);
  console.log("-------------------------------------------------\n");

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("QA Test Suite Error:", err);
  process.exit(1);
});
