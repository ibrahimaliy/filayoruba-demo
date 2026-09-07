import "server-only";
import { db } from "@/server/db";
import { sendEmail } from "@/server/services/email.service";
import { renderOtpVerificationEmail } from "@/server/email/templates";
import { timingSafeEqualStrings, utf8ToBase64, base64ToUtf8 } from "@/server/auth-edge";
import { Customer } from "@prisma/client";
import { redisGet, redisSet, redisDel } from "./redis";

export const CUSTOMER_COOKIE_NAME = "filayoruba_customer_session";
const DEFAULT_CUSTOMER_DEV_SECRET = "filayoruba_customer_secret_key_2026";

function getCustomerAuthSecret(): string {
  const secret = process.env.CUSTOMER_AUTH_SECRET || process.env.ADMIN_SECRET_KEY;
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret === DEFAULT_CUSTOMER_DEV_SECRET || secret.length < 16) {
      throw new Error(
        "CRITICAL SECURITY ERROR: CUSTOMER_AUTH_SECRET or ADMIN_SECRET_KEY must be configured with at least 16 characters in production."
      );
    }
    return secret;
  }
  return secret || DEFAULT_CUSTOMER_DEV_SECRET;
}

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
}

/**
 * Cryptographically secure 6-digit OTP generator
 */
function generateSecureOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const randomNum = 100000 + (array[0] % 900000);
  return randomNum.toString();
}

/**
 * Signs token with Web Crypto HMAC-SHA256
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
 * Creates a signed customer session token
 */
export async function createCustomerSessionToken(customerId: string, email: string): Promise<string> {
  const secret = getCustomerAuthSecret();
  const timestamp = Date.now();
  const payload = JSON.stringify({ customerId, email, iat: timestamp });
  const base64Payload = utf8ToBase64(payload);
  const signature = await signToken(base64Payload, secret);
  return `${base64Payload}.${signature}`;
}

/**
 * Verifies customer session token and returns decoded payload
 */
export async function verifyCustomerSessionToken(
  token: string | null | undefined
): Promise<{ customerId: string; email: string } | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [base64Payload, signature] = parts;
  const secret = getCustomerAuthSecret();

  try {
    const expectedSignature = await signToken(base64Payload, secret);
    if (!timingSafeEqualStrings(signature, expectedSignature)) {
      return null;
    }

    const payload = JSON.parse(base64ToUtf8(base64Payload));
    // 30 days session validity
    const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - payload.iat > maxAgeMs) {
      return null;
    }

    return { customerId: payload.customerId, email: payload.email };
  } catch {
    return null;
  }
}

/**
 * Generates and sends a 6-digit OTP to the customer's email (stored in distributed Redis/memory)
 */
export async function sendCustomerOtp(rawEmail: string): Promise<{ success: boolean; message: string }> {
  const email = rawEmail.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { success: false, message: "A valid email address is required." };
  }

  // Generate cryptographically secure 6-digit random code
  const code = generateSecureOtp();
  const ttlSeconds = 10 * 60; // 10 mins
  const expiresAt = Date.now() + ttlSeconds * 1000;

  const record: OtpRecord = { code, expiresAt, attempts: 0 };
  await redisSet(`otp:${email}`, record, ttlSeconds);

  if (process.env.NODE_ENV !== "production") {
    console.log(`\n🔑 [CUSTOMER OTP CODE] Email: ${email} | Code: ${code} (Expires in 10 mins)\n`);
  }

  const { subject, html } = renderOtpVerificationEmail(email, code);
  await sendEmail({
    to: email,
    subject,
    html,
  });

  return {
    success: true,
    message: `A 6-digit sign-in code has been sent to ${email}.`,
  };
}

/**
 * Verifies 6-digit OTP across distributed server instances, enforces max 5 attempts lockout, creates or finds Customer record
 */
export async function verifyCustomerOtp(
  rawEmail: string,
  rawCode: string
): Promise<{
  success: boolean;
  token?: string;
  customer?: Customer;
  error?: string;
}> {
  const email = rawEmail.trim().toLowerCase();
  const code = rawCode.trim();
  const otpKey = `otp:${email}`;

  const record = await redisGet<OtpRecord>(otpKey);
  if (!record) {
    return { success: false, error: "No active sign-in code found for this email. Please request a new code." };
  }

  if (Date.now() > record.expiresAt) {
    await redisDel(otpKey);
    return { success: false, error: "This sign-in code has expired. Please request a new code." };
  }

  if (record.code !== code) {
    record.attempts = (record.attempts || 0) + 1;
    const remainingAttempts = 5 - record.attempts;

    if (remainingAttempts <= 0) {
      await redisDel(otpKey);
      return {
        success: false,
        error: "Too many failed attempts. For your security, this sign-in code has been invalidated. Please request a new code.",
      };
    }

    const remainingTtl = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000));
    await redisSet(otpKey, record, remainingTtl);

    return {
      success: false,
      error: `Invalid 6-digit sign-in code. (${remainingAttempts} ${remainingAttempts === 1 ? "attempt" : "attempts"} remaining)`,
    };
  }

  // OTP is valid - consume it immediately
  await redisDel(otpKey);

  try {
    // 1. Find or create customer
    let customer = await db.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      const emailPrefix = email.split("@")[0];
      customer = await db.customer.create({
        data: {
          email,
          firstName: emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1),
          lastName: "Customer",
        },
      });
    }

    // 2. Link any existing orders placed with this email to this customer record
    await db.order.updateMany({
      where: {
        customerEmail: { equals: email, mode: "insensitive" },
        customerId: null,
      },
      data: {
        customerId: customer.id,
      },
    });

    // 3. Create session token
    const token = await createCustomerSessionToken(customer.id, customer.email || email);

    return {
      success: true,
      token,
      customer,
    };
  } catch (error) {
    console.error("Database error during customer sign-in:", error);
    return {
      success: false,
      error: "Authentication failed due to database error. Please try again.",
    };
  }
}

/**
 * Retrieves the currently authenticated customer from the incoming request's session cookie
 */
export async function getCustomerFromRequest(
  req: Request | { headers: Headers; cookies?: { get: (name: string) => { value: string } | undefined } }
): Promise<Customer | null> {
  let sessionToken: string | undefined;

  if ("cookies" in req && req.cookies && typeof req.cookies.get === "function") {
    sessionToken = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
  } else {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const cookies = Object.fromEntries(
        cookieHeader.split("; ").map((c) => {
          const [key, ...v] = c.split("=");
          return [key, v.join("=")];
        })
      );
      sessionToken = cookies[CUSTOMER_COOKIE_NAME];
    }
  }

  const session = await verifyCustomerSessionToken(sessionToken);
  if (!session) return null;

  try {
    const customer = await db.customer.findUnique({
      where: { id: session.customerId },
    });
    return customer;
  } catch {
    return null;
  }
}
