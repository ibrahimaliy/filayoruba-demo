import "./mock-server-only.cjs";
import "dotenv/config";
import { getAdminSecret, getMasterAdminPassword, getDemoAdminPassword, timingSafeEqualStrings } from "../src/server/auth-edge";
import { POST as demoLoginPost } from "../src/app/api/admin/auth/demo-login/route";
import { register } from "../src/instrumentation";

async function runSecurityTests() {
  console.log("🔒 Running Comprehensive Auth Security Verification Suite...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  // Preserve original environment
  const originalEnv = { ...process.env };

  try {
    // =========================================================================
    // SUITE 1: Production Fail-Closed Secrets (Issue 2)
    // =========================================================================
    console.log("--- 1. Testing getAdminSecret() & getMasterAdminPassword() Fail-Closed Behavior ---");

    // Case 1.1: Production with unset ADMIN_SECRET_KEY
    (process.env as any).NODE_ENV = "production";
    delete process.env.ADMIN_SECRET_KEY;
    try {
      getAdminSecret();
      assert(false, "Throws when ADMIN_SECRET_KEY is missing in production");
    } catch (e: any) {
      assert(e.message.includes("[SECURITY CRITICAL]"), "Throws [SECURITY CRITICAL] when ADMIN_SECRET_KEY is missing in production");
    }

    // Case 1.2: Production with short ADMIN_SECRET_KEY (<16 chars)
    process.env.ADMIN_SECRET_KEY = "short_secret_12";
    try {
      getAdminSecret();
      assert(false, "Throws when ADMIN_SECRET_KEY is < 16 chars in production");
    } catch (e: any) {
      assert(e.message.includes("[SECURITY CRITICAL]"), "Throws [SECURITY CRITICAL] when ADMIN_SECRET_KEY is < 16 chars in production");
    }

    // Case 1.3: Production with known insecure ADMIN_SECRET_KEY from blocklist
    process.env.ADMIN_SECRET_KEY = "filayoruba_admin_secret_key_2026";
    try {
      getAdminSecret();
      assert(false, "Throws when ADMIN_SECRET_KEY is in INSECURE_DEV_SECRETS in production");
    } catch (e: any) {
      assert(e.message.includes("[SECURITY CRITICAL]"), "Throws [SECURITY CRITICAL] when ADMIN_SECRET_KEY is in blocklist in production");
    }

    // Case 1.4: Production with unset ADMIN_PASSWORD
    delete process.env.ADMIN_PASSWORD;
    try {
      getMasterAdminPassword();
      assert(false, "Throws when ADMIN_PASSWORD is unset in production");
    } catch (e: any) {
      assert(e.message.includes("[SECURITY CRITICAL]"), "Throws [SECURITY CRITICAL] when ADMIN_PASSWORD is unset in production");
    }

    // Case 1.5: Production with insecure ADMIN_PASSWORD
    process.env.ADMIN_PASSWORD = "filayoruba_admin_secret_key_2026";
    try {
      getMasterAdminPassword();
      assert(false, "Throws when ADMIN_PASSWORD is in INSECURE_DEV_SECRETS in production");
    } catch (e: any) {
      assert(e.message.includes("[SECURITY CRITICAL]"), "Throws [SECURITY CRITICAL] when ADMIN_PASSWORD is in blocklist in production");
    }

    // Case 1.6: Development fallback behavior
    (process.env as any).NODE_ENV = "development";
    process.env.ADMIN_SECRET_KEY = "filayoruba_admin_secret_key_2026"; // insecure
    const devFallbackSecret = getAdminSecret();
    assert(
      devFallbackSecret === "dev_filayoruba_signing_secret_do_not_use_in_prod",
      "In development, returns DEFAULT_DEV_ADMIN_SECRET instead of insecure secret",
      `Got: ${devFallbackSecret}`
    );

    // Case 1.7: Valid key in production returns actual key
    (process.env as any).NODE_ENV = "production";
    const validSecret = "81b284e1ca5505838e82ac52a0fac860d3de3fa117c6d635dcc5c149fd5370ef";
    const validPassword = "Fila_VIMku7EnmyiosYcl89a8MA!2026";
    process.env.ADMIN_SECRET_KEY = validSecret;
    process.env.ADMIN_PASSWORD = validPassword;
    assert(getAdminSecret() === validSecret, "In production with valid key, getAdminSecret() returns key");
    assert(getMasterAdminPassword() === validPassword, "In production with valid password, getMasterAdminPassword() returns password");

    // Case 1.8: Boot test with register() in production
    console.log("\n--- 2. Testing Boot Instrumentation Hook (instrumentation.ts) ---");
    delete process.env.ADMIN_SECRET_KEY;
    try {
      await register();
      assert(false, "Boot hook register() throws in production when secrets are missing");
    } catch (e: any) {
      assert(e.message.includes("[SECURITY CRITICAL]"), "Boot hook register() fails loudly at boot with [SECURITY CRITICAL]");
    }

    process.env.ADMIN_SECRET_KEY = validSecret;
    process.env.ADMIN_PASSWORD = validPassword;
    await register();
    assert(true, "Boot hook register() completes successfully when valid secrets are configured");

    // =========================================================================
    // SUITE 2: Demo Login Backdoor Protection (Issue 1)
    // =========================================================================
    console.log("\n--- 3. Testing POST /api/admin/auth/demo-login Gating & Authentication ---");
    (process.env as any).NODE_ENV = "development";
    process.env.ADMIN_SECRET_KEY = validSecret;
    process.env.ADMIN_PASSWORD = validPassword;
    process.env.DEMO_ADMIN_PASSWORD = "fila_demo_reviewer_2026";

    // Case 2.1: Gated route when ENABLE_DEMO_LOGIN is unset (default disabled)
    delete process.env.ENABLE_DEMO_LOGIN;
    const reqDisabledNoBody = new Request("http://localhost:3000/api/admin/auth/demo-login", {
      method: "POST",
    });
    const resDisabledNoBody = await demoLoginPost(reqDisabledNoBody);
    assert(resDisabledNoBody.status === 403, "Default disabled: returns 403 when ENABLE_DEMO_LOGIN is unset");
    assert(!resDisabledNoBody.headers.get("set-cookie"), "Sets no cookie when ENABLE_DEMO_LOGIN is unset");

    // Case 2.2: Gated route when ENABLE_DEMO_LOGIN="false"
    process.env.ENABLE_DEMO_LOGIN = "false";
    const reqDisabledWithPass = new Request("http://localhost:3000/api/admin/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "fila_demo_reviewer_2026" }),
    });
    const resDisabledWithPass = await demoLoginPost(reqDisabledWithPass);
    assert(resDisabledWithPass.status === 403, "Returns 403 when ENABLE_DEMO_LOGIN='false' even with correct password");
    assert(!resDisabledWithPass.headers.get("set-cookie"), "Sets no cookie when ENABLE_DEMO_LOGIN='false'");

    // Case 2.3: Route enabled (ENABLE_DEMO_LOGIN="true"), but called with no body
    process.env.ENABLE_DEMO_LOGIN = "true";
    const reqEnabledNoBody = new Request("http://localhost:3000/api/admin/auth/demo-login", {
      method: "POST",
    });
    const resEnabledNoBody = await demoLoginPost(reqEnabledNoBody);
    assert(resEnabledNoBody.status === 401, "Enabled: returns 401 when called with no body");
    assert(!resEnabledNoBody.headers.get("set-cookie"), "Sets no cookie on missing body");

    // Case 2.4: Route enabled, called with wrong password
    const reqEnabledWrongPass = new Request("http://localhost:3000/api/admin/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wrong_password_123" }),
    });
    const resEnabledWrongPass = await demoLoginPost(reqEnabledWrongPass);
    assert(resEnabledWrongPass.status === 401, "Enabled: returns 401 when called with wrong password");
    assert(!resEnabledWrongPass.headers.get("set-cookie"), "Sets no cookie on wrong password");

    // Case 2.5: Route enabled, called with correct password
    const reqEnabledCorrectPass = new Request("http://localhost:3000/api/admin/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "fila_demo_reviewer_2026" }),
    });
    const resEnabledCorrectPass = await demoLoginPost(reqEnabledCorrectPass);
    assert(resEnabledCorrectPass.status === 200, "Enabled: returns 200 when called with correct password");
    const setCookieHeader = resEnabledCorrectPass.headers.get("set-cookie");
    assert(!!setCookieHeader && setCookieHeader.includes("filayoruba_admin_session="), "Sets filayoruba_admin_session cookie on success");
    const successData = await resEnabledCorrectPass.json();
    assert(successData.success === true && successData.user.email === "demo@filayoruba.com", "Returns correct demo reviewer user object");

  } finally {
    // Restore original environment
    for (const key in process.env) {
      delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  }

  console.log(`\n========================================`);
  console.log(`Total Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runSecurityTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
