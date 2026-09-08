export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER";

export interface AdminSessionUser {
  id?: string;
  email?: string;
  name?: string;
  role: AdminRole;
}

export interface AdminSessionPayload extends AdminSessionUser {
  iat: number;
}

export const ADMIN_COOKIE_NAME = "filayoruba_admin_session";
export const DEFAULT_DEMO_PASSWORD = "fila_demo_reviewer_2026";
const DEFAULT_DEV_ADMIN_SECRET = "dev_filayoruba_signing_secret_do_not_use_in_prod";

/**
 * Constant-time string comparison safe for Edge runtimes (protects against timing attacks)
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

const INSECURE_DEV_SECRETS = [
  "filayoruba_admin_secret_key_2026",
  "tradedge_admin_secret_key_2026",
  "dev_filayoruba_signing_secret_do_not_use_in_prod",
];

export function getAdminSecret(): string {
  const secret = process.env.ADMIN_SECRET_KEY;
  if (secret && secret.length >= 16 && !INSECURE_DEV_SECRETS.includes(secret)) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    console.warn("[SECURITY WARNING] ADMIN_SECRET_KEY is missing or weak in production environment variables. Using fallback.");
  }
  return secret || DEFAULT_DEV_ADMIN_SECRET;
}

/**
 * Returns the human master admin password used for emergency recovery / seeding
 * Strictly checks ADMIN_PASSWORD without reusing ADMIN_SECRET_KEY.
 */
export function getMasterAdminPassword(): string {
  const pass = process.env.ADMIN_PASSWORD;
  return pass || "";
}

/**
 * Returns the dedicated throwaway password for portfolio reviewers / demo access
 */
export function getDemoAdminPassword(): string {
  return process.env.DEMO_ADMIN_PASSWORD || DEFAULT_DEMO_PASSWORD;
}

/**
 * Derives a PBKDF2 Web Crypto hash from password and salt (100,000 iterations)
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  return Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Creates an HMAC-SHA256 signature for a token using Web Crypto API
 */
async function signToken(token: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(token));
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * UTF-8 safe Base64 encoder compatible with Edge Runtime and Node.js
 * Prevents InvalidCharacterError on Yoruba diacritics and Unicode characters.
 */
export function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * UTF-8 safe Base64 decoder compatible with Edge Runtime and Node.js
 */
export function base64ToUtf8(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Generates a signed session cookie value: `<payload>.<signature>`
 */
export async function createSessionToken(user?: {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
}): Promise<string> {
  const secret = getAdminSecret();
  const timestamp = Date.now();
  const rawRole = (user?.role || "ADMIN").toUpperCase();
  const normalizedRole: AdminRole =
    rawRole === "SUPER_ADMIN" || rawRole === "ADMIN" || rawRole === "MANAGER"
      ? (rawRole as AdminRole)
      : "ADMIN";

  const payload: AdminSessionPayload = {
    role: normalizedRole,
    id: user?.id,
    email: user?.email,
    name: user?.name || (normalizedRole === "SUPER_ADMIN" ? "Super Admin" : "Artisan Admin"),
    iat: timestamp,
  };

  const base64Payload = utf8ToBase64(JSON.stringify(payload));
  const signature = await signToken(base64Payload, secret);
  return `${base64Payload}.${signature}`;
}

/**
 * Decodes and verifies a signed session token payload
 */
export async function decodeSessionToken(token: string | null | undefined): Promise<AdminSessionPayload | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [base64Payload, signature] = parts;
  const secret = getAdminSecret();

  try {
    const expectedSignature = await signToken(base64Payload, secret);
    if (!timingSafeEqualStrings(signature, expectedSignature)) {
      return null;
    }

    const payload = JSON.parse(base64ToUtf8(base64Payload)) as AdminSessionPayload;
    // Expire sessions after 7 days
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.iat > maxAgeMs) {
      return null;
    }

    const role = payload.role?.toUpperCase();
    if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "MANAGER" || role === "admin") {
      return {
        ...payload,
        role: role === "SUPER_ADMIN" ? "SUPER_ADMIN" : role === "MANAGER" ? "MANAGER" : "ADMIN",
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Verifies a signed session token
 */
export async function verifySessionToken(token: string | null | undefined): Promise<boolean> {
  const decoded = await decodeSessionToken(token);
  return decoded !== null;
}

/**
 * Extracts and verifies the current admin session from Request or NextRequest headers / cookies
 */
export async function getAdminSession(
  req: Request | { headers: Headers; cookies?: { get: (name: string) => { value: string } | undefined } }
): Promise<AdminSessionPayload | null> {
  const secret = getAdminSecret();

  // 1. Check Authorization header (Bearer token fallback to Master Super Admin)
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (timingSafeEqualStrings(token, secret)) {
      return {
        email: "superadmin@filayoruba.com",
        name: "Fìlà Yorùbá Master Artisan",
        role: "SUPER_ADMIN",
        iat: Date.now(),
      };
    }
  }

  // 2. Check x-admin-key header
  const customKey = req.headers.get("x-admin-key");
  if (customKey && timingSafeEqualStrings(customKey.trim(), secret)) {
    return {
      email: "superadmin@filayoruba.com",
      name: "Fìlà Yorùbá Master Artisan",
      role: "SUPER_ADMIN",
      iat: Date.now(),
    };
  }

  // 3. Extract cookie
  let sessionToken: string | undefined;
  if ("cookies" in req && req.cookies && typeof req.cookies.get === "function") {
    sessionToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  } else {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split("; ").map((c) => {
          const [key, ...v] = c.split("=");
          return [key, v.join("=")];
        })
      );
      sessionToken = cookies[ADMIN_COOKIE_NAME];
    }
  }

  return decodeSessionToken(sessionToken);
}

/**
 * Checks whether a request contains valid admin credentials (Bearer token, custom header, or cookie)
 * Pure Web Crypto implementation safe for Edge Middleware.
 */
export async function validateAdminRequest(
  req: Request | { headers: Headers; cookies?: { get: (name: string) => { value: string } | undefined } }
): Promise<boolean> {
  const session = await getAdminSession(req);
  return session !== null;
}

