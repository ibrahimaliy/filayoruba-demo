/**
 * Next.js Server Initialization Hook (runs once when server boots)
 * Validates critical security configuration in production to fail loudly at boot
 * rather than silently running with weak or missing keys.
 */
export async function register() {
  if (process.env.NODE_ENV === "production") {
    const { getAdminSecret, getMasterAdminPassword } = await import("@/server/auth-edge");
    getAdminSecret();
    getMasterAdminPassword();
  }
}
