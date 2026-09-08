import "server-only";
import { Order, OrderStatus } from "@/types/order";
import {
  renderOrderConfirmationEmail,
  renderOrderStatusUpdateEmail,
  renderAdminNewOrderAlertEmail,
  renderOrderAddressUpdatedEmail,
} from "@/server/email/templates";

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  provider: "resend" | "console_dev";
  error?: string;
}

// Default sender address:
// Resend requires verified domains. In sandbox mode or before domain DNS is added,
// "onboarding@resend.dev" is permitted by Resend. Once "filayoruba.com" is verified on Resend,
// EMAIL_FROM can be set to "Fìlà Yorùbá <orders@filayoruba.com>".
const FALLBACK_SANDBOX_FROM = "Fìlà Yorùbá <onboarding@resend.dev>";
const DEFAULT_FROM = process.env.EMAIL_FROM || FALLBACK_SANDBOX_FROM;
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || "demo@filayoruba.com";
const DEFAULT_REPLY_TO = "orders@filayoruba.com";

/**
 * Dispatches an email using Resend REST API or logs to dev console if no API key is set.
 * Automatically handles Resend domain verification fallback and sandbox restrictions.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const to = Array.isArray(params.to) ? params.to : [params.to];
  const initialFrom = params.from || DEFAULT_FROM;
  const replyTo = params.replyTo || DEFAULT_REPLY_TO;

  // 1. If RESEND_API_KEY is configured, dispatch via Resend REST API
  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: initialFrom,
          to,
          subject: params.subject,
          html: params.html,
          reply_to: replyTo,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg: string = data.message || "Failed to send email via Resend";

        // Domain verification fallback:
        // If Resend rejected because the custom domain (e.g. filayoruba.com) is not verified,
        // retry automatically using onboarding@resend.dev with reply_to preserved.
        if (
          (response.status === 403 || errorMsg.includes("not verified")) &&
          !initialFrom.includes("onboarding@resend.dev")
        ) {
          console.warn(
            `⚠️ [Resend Domain Notice] Custom domain in "${initialFrom}" is not yet verified on https://resend.com/domains.\n` +
            `   Retrying dispatch via "${FALLBACK_SANDBOX_FROM}" (Reply-To: ${replyTo})...`
          );

          const retryResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: FALLBACK_SANDBOX_FROM,
              to,
              subject: params.subject,
              html: params.html,
              reply_to: replyTo,
            }),
          });

          const retryData = await retryResponse.json();

          if (retryResponse.ok && retryData.id) {
            console.log(`✉️ [Resend Fallback] Email delivered via onboarding@resend.dev to ${to.join(", ")} (ID: ${retryData.id})`);
            return {
              success: true,
              messageId: retryData.id,
              provider: "resend",
            };
          }

          // If retry also failed, check for sandbox restriction
          if (retryData.message?.includes("only send testing emails to your own email")) {
            console.error(
              `\n🚨 [RESEND SANDBOX RESTRICTION] Recipient "${to.join(", ")}" blocked.\n` +
              `   Reason: Unverified Resend accounts can only send to the account owner's registered email.\n` +
              `   Action: Add & verify your domain "filayoruba.com" at https://resend.com/domains to send to all customers.\n`
            );
          }

          return {
            success: false,
            provider: "resend",
            error: retryData.message || errorMsg,
          };
        }

        // Sandbox account restriction banner
        if (errorMsg.includes("only send testing emails to your own email")) {
          console.error(
            `\n🚨 [RESEND SANDBOX RESTRICTION] Recipient "${to.join(", ")}" blocked.\n` +
            `   Reason: Unverified Resend accounts can only send to the account owner's registered email.\n` +
            `   Action: Add & verify your domain "filayoruba.com" at https://resend.com/domains to send to all customers.\n`
          );
        } else {
          console.error("❌ Resend API Error:", data);
        }

        return {
          success: false,
          provider: "resend",
          error: errorMsg,
        };
      }

      console.log(`✉️ [Resend] Email successfully sent to ${to.join(", ")} (ID: ${data.id})`);
      return {
        success: true,
        messageId: data.id,
        provider: "resend",
      };
    } catch (error) {
      console.error("❌ Resend network error:", error);
      return {
        success: false,
        provider: "resend",
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  // 2. Development Console Logger Fallback (When no Resend key is configured)
  console.log(`\n======================================================`);
  console.log(`📨 [DEV EMAIL SIMULATOR] (No RESEND_API_KEY configured)`);
  console.log(`From:     ${initialFrom}`);
  console.log(`To:       ${to.join(", ")}`);
  console.log(`Subject:  ${params.subject}`);
  console.log(`Reply-To: ${replyTo}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`------------------------------------------------------`);
  console.log(`Tip: Add RESEND_API_KEY=re_... in .env.local to send live emails.`);
  console.log(`======================================================\n`);

  return {
    success: true,
    messageId: `dev_${Date.now()}`,
    provider: "console_dev",
  };
}

/**
 * Sends luxury order confirmation & receipt to the customer
 */
export async function sendOrderConfirmationEmail(order: Order): Promise<SendEmailResult> {
  if (!order.customer?.email) {
    return { success: false, provider: "console_dev", error: "Customer email is missing" };
  }

  const { subject, html } = renderOrderConfirmationEmail(order);
  return sendEmail({
    to: order.customer.email,
    subject,
    html,
    replyTo: DEFAULT_REPLY_TO,
  });
}

/**
 * Sends milestone status update email to the customer (Crafting, Shipped, Delivered)
 */
export async function sendOrderStatusUpdateEmail(
  order: Order,
  status: OrderStatus
): Promise<SendEmailResult> {
  if (!order.customer?.email) {
    return { success: false, provider: "console_dev", error: "Customer email is missing" };
  }

  // Only send for actionable statuses
  const notifyStatuses: OrderStatus[] = ["crafting", "shipped", "delivered", "cancelled"];
  if (!notifyStatuses.includes(status)) {
    return { success: true, provider: "console_dev" };
  }

  const { subject, html } = renderOrderStatusUpdateEmail(order, status);
  return sendEmail({
    to: order.customer.email,
    subject,
    html,
    replyTo: DEFAULT_REPLY_TO,
  });
}

/**
 * Sends instant alert email to store admin / artisan team upon receipt of payment
 */
export async function sendAdminNewOrderAlertEmail(order: Order): Promise<SendEmailResult> {
  const { subject, html } = renderAdminNewOrderAlertEmail(order);
  return sendEmail({
    to: ADMIN_EMAIL,
    subject,
    html,
    replyTo: DEFAULT_REPLY_TO,
  });
}

/**
 * Sends confirmation email to customer when order delivery address is updated
 */
export async function sendOrderAddressUpdatedEmail(
  order: Order,
  newAddress: { address: string; city: string; state: string; country?: string }
): Promise<SendEmailResult> {
  if (!order.customer?.email) {
    return { success: false, provider: "console_dev", error: "Customer email is missing" };
  }

  const { subject, html } = renderOrderAddressUpdatedEmail(order, newAddress);
  return sendEmail({
    to: order.customer.email,
    subject,
    html,
    replyTo: DEFAULT_REPLY_TO,
  });
}

