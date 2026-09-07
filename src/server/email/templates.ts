import { Order, OrderStatus } from "@/types/order";

const APP_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function formatNaira(amount: number): string {
  return `₦${(amount || 0).toLocaleString("en-NG")}`;
}

export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * 1. Customer Order Confirmation & Receipt Template
 */
export function renderOrderConfirmationEmail(order: Order): { subject: string; html: string } {
  const orderNum = order.orderNumber || order.id;
  const subject = `Order Confirmed: ${escapeHtml(orderNum)} - Fìlà Yorùbá`;
  const trackingUrl = `${APP_URL}/track-order?order=${encodeURIComponent(orderNum)}`;

  const itemsHtml = order.items
    .map((item) => {
      const img = item.product.images?.[0] || "";
      const safeName = escapeHtml(item.product.name);
      const safeSize = escapeHtml(item.selectedSize || "Standard");
      return `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #E2E8F0; vertical-align: middle;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                ${img
          ? `<td width="64" style="vertical-align: middle; padding-right: 16px;">
                        <img src="${escapeHtml(img)}" alt="${safeName}" width="64" height="64" style="border-radius: 8px; object-fit: cover; display: block; border: 1px solid #E2E8F0;" />
                      </td>`
          : ""
        }
                <td style="vertical-align: middle;">
                  <p style="margin: 0; font-size: 15px; font-weight: 600; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    ${safeName}
                  </p>
                  <p style="margin: 4px 0 0 0; font-size: 13px; color: #64748B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    Size: <strong>${safeSize}</strong> &bull; Qty: <strong>${item.quantity}</strong>
                  </p>
                </td>
                <td align="right" style="vertical-align: middle; white-space: nowrap;">
                  <p style="margin: 0; font-size: 15px; font-weight: 700; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    ${formatNaira(item.product.price * item.quantity)}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  const safeFirstName = escapeHtml(order.customer.firstName);
  const safeLastName = escapeHtml(order.customer.lastName);
  const safeAddress = escapeHtml(order.address.address);
  const safeCity = escapeHtml(order.address.city);
  const safeState = escapeHtml(order.address.state);
  const safeCountry = escapeHtml(order.address.country || "Nigeria");
  const safePaymentMethod = escapeHtml(order.paymentMethod || "Paystack");
  const safePhone = escapeHtml(order.customer.phone);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #000000; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #E2E8F0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #000000; padding: 36px 32px; text-align: center; border-bottom: 3px solid #FED501;">
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td align="right" style="text-align: right;">
                    <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 32px; font-weight: 800; color: #FFFFFF; line-height: 1; letter-spacing: -0.5px; text-align: right;">
                      Fìlà
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; color: #FED501; text-transform: uppercase; letter-spacing: 3px; line-height: 1; margin-top: 3px; text-align: right;">
                      YORÙBÁ
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Confirmation Intro -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #000000;">
                Thank you for your order, ${safeFirstName}!
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Your payment has been confirmed via Paystack. Your authentic Yoruba Fila cap has been queued for hand-tailoring by our master artisans.
              </p>

              <!-- Order Meta Box -->
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748B; font-weight: 600;">
                        Order Number
                      </p>
                      <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 700; color: #000000;">
                        ${escapeHtml(orderNum)}
                      </p>
                    </td>
                    <td align="right">
                      <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748B; font-weight: 600;">
                        Payment Status
                      </p>
                      <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 700; color: #16A34A;">
                        ● PAID (${safePaymentMethod})
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Item Breakdown -->
              <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 700; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">
                Order Summary
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${itemsHtml}
              </table>

              <!-- Totals Table -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #64748B;">Subtotal</td>
                  <td align="right" style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #000000;">
                    ${formatNaira(order.subtotal)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #64748B;">Shipping / Delivery</td>
                  <td align="right" style="padding: 6px 0; font-size: 14px; font-weight: 600; color: #000000;">
                    ${order.shipping > 0 ? formatNaira(order.shipping) : "Free Delivery"}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 0 0; font-size: 16px; font-weight: 700; color: #000000; border-top: 2px solid #000000;">Total Paid</td>
                  <td align="right" style="padding: 12px 0 0 0; font-size: 20px; font-weight: 800; color: #000000; border-top: 2px solid #000000;">
                    ${formatNaira(order.total)}
                  </td>
                </tr>
              </table>

              <!-- Delivery Address Box -->
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 20px; margin-top: 24px;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748B;">
                  Shipping Destination
                </p>
                <p style="margin: 0; font-size: 14px; color: #000000; font-weight: 600;">
                  ${safeFirstName} ${safeLastName}
                </p>
                <p style="margin: 2px 0 0 0; font-size: 13px; color: #475569; line-height: 1.5;">
                  ${safeAddress}, ${safeCity}, ${safeState}, ${safeCountry}
                </p>
                ${safePhone ? `<p style="margin: 4px 0 0 0; font-size: 12px; color: #64748B;">Phone: ${safePhone}</p>` : ""}
              </div>

              <!-- Track Order CTA Button -->
              <div style="text-align: center; margin: 36px 0 12px 0;">
                <a href="${trackingUrl}" target="_blank" style="display: inline-block; background: #FED501; color: #000000; font-weight: 800; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(254, 213, 1, 0.35); text-transform: uppercase; letter-spacing: 0.5px;">
                  Track Order Progress →
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #000000; padding: 24px 32px; text-align: center; border-top: 1px solid #262626;">
              <p style="margin: 0; color: rgba(255, 255, 255, 0.7); font-size: 12px;">
                Have questions about your order? Reply directly to this email or visit our <a href="${APP_URL}/contact" style="color: #FED501; text-decoration: underline;">Contact Desk</a>.
              </p>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.4); font-size: 11px;">
                &copy; ${new Date().getFullYear()} Fìlà Yorùbá. Authentic Heritage, Tailored Elegance.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * 2. Customer Order Status Milestone Update Template (Crafting, Shipped, Delivered)
 */
export function renderOrderStatusUpdateEmail(order: Order, status: OrderStatus): { subject: string; html: string } {
  const orderNum = order.orderNumber || order.id;
  const trackingUrl = `${APP_URL}/track-order?order=${encodeURIComponent(orderNum)}`;

  const statusConfig: Record<string, { title: string; subtitle: string; icon: string; badgeColor: string }> = {
    crafting: {
      title: "Your Fila is on the Loom!",
      subtitle: "Our master artisans in Oyo have begun hand-weaving and shaping your traditional cap.",
      icon: "🧵",
      badgeColor: "#F59E0B",
    },
    shipped: {
      title: "Your Order is on its Way!",
      subtitle: "Your handcrafted Fila has been inspected, packaged, and dispatched to our logistics courier.",
      icon: "📦",
      badgeColor: "#3B82F6",
    },
    delivered: {
      title: "Order Delivered!",
      subtitle: "Your Fìlà Yorùbá order has arrived at your destination. Wear it with pride and elegance.",
      icon: "✨",
      badgeColor: "#10B981",
    },
    cancelled: {
      title: "Order Cancelled",
      subtitle: "Your order has been cancelled. If you believe this is an error, please reach out to us.",
      icon: "⚠️",
      badgeColor: "#EF4444",
    },
  };

  const config = statusConfig[status] || {
    title: `Order Status: ${status.toUpperCase()}`,
    subtitle: `Your order status has been updated to ${status}.`,
    icon: "📋",
    badgeColor: "#64748B",
  };

  const subject = `Order Update: ${config.title} (#${escapeHtml(orderNum)})`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #000000;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #E2E8F0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #000000; padding: 32px; text-align: center; border-bottom: 3px solid #FED501;">
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td align="right" style="text-align: right;">
                    <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 800; color: #FFFFFF; line-height: 1; letter-spacing: -0.5px; text-align: right;">
                      Fìlà
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; font-weight: 600; color: #FED501; text-transform: uppercase; letter-spacing: 2.5px; line-height: 1; margin-top: 3px; text-align: right;">
                      YORÙBÁ
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.7); font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px;">
                Artisan Status Update
              </p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 40px; margin-bottom: 8px;">${config.icon}</div>
                <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #000000;">
                  ${escapeHtml(config.title)}
                </h2>
                <p style="margin: 0; font-size: 14px; color: #64748B; line-height: 1.6;">
                  ${escapeHtml(config.subtitle)}
                </p>
              </div>

              <!-- Milestone Card -->
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td>
                      <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748B; font-weight: 600;">
                        Order Reference
                      </p>
                      <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 700; color: #000000;">
                        ${escapeHtml(orderNum)}
                      </p>
                    </td>
                    <td align="right">
                      <span style="display: inline-block; padding: 6px 14px; border-radius: 9999px; background-color: ${config.badgeColor}20; color: ${config.badgeColor}; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                        ${escapeHtml(status)}
                      </span>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Track Button -->
              <div style="text-align: center; margin: 32px 0 8px 0;">
                <a href="${trackingUrl}" target="_blank" style="display: inline-block; background: #FED501; color: #000000; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                  View Live Tracking →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #000000; padding: 20px 32px; text-align: center;">
              <p style="margin: 0; color: rgba(255, 255, 255, 0.6); font-size: 11px;">
                &copy; ${new Date().getFullYear()} Fìlà Yorùbá. Authentic Heritage, Tailored Elegance.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * 3. Store Owner / Admin New Order Alert Template
 */
export function renderAdminNewOrderAlertEmail(order: Order): { subject: string; html: string } {
  const orderNum = order.orderNumber || order.id;
  const subject = `🚨 [NEW PAID ORDER] ${escapeHtml(orderNum)} - ${formatNaira(order.total)}`;
  const adminOrderUrl = `${APP_URL}/admin/orders`;

  const itemsList = order.items
    .map(
      (item) => `
      <li style="margin-bottom: 8px; font-size: 14px; color: #000000;">
        <strong>${item.quantity}x ${escapeHtml(item.product.name)}</strong> (Size: ${escapeHtml(item.selectedSize || "Standard")}) &mdash; ${formatNaira(item.product.price * item.quantity)}
      </li>
    `
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 12px; border: 1px solid #E2E8F0; padding: 24px;">
    <tr>
      <td>
        <h2 style="margin: 0 0 16px 0; color: #000000; font-size: 18px;">
          🎉 New Paid Order Received!
        </h2>
        <div style="background-color: #F8FAFC; border-radius: 8px; padding: 16px; margin-bottom: 20px; border: 1px solid #E2E8F0;">
          <p style="margin: 0 0 6px 0;"><strong>Order:</strong> ${escapeHtml(orderNum)}</p>
          <p style="margin: 0 0 6px 0;"><strong>Customer:</strong> ${escapeHtml(order.customer.firstName)} ${escapeHtml(order.customer.lastName)} (${escapeHtml(order.customer.email)})</p>
          <p style="margin: 0 0 6px 0;"><strong>Phone:</strong> ${escapeHtml(order.customer.phone || "N/A")}</p>
          <p style="margin: 0 0 6px 0;"><strong>Delivery:</strong> ${escapeHtml(order.address.address)}, ${escapeHtml(order.address.city)}, ${escapeHtml(order.address.state)}</p>
          <p style="margin: 0 0 6px 0;"><strong>Total Revenue:</strong> <span style="font-size: 18px; font-weight: bold; color: #16A34A;">${formatNaira(order.total)}</span></p>
          <p style="margin: 0;"><strong>Paystack Ref:</strong> ${escapeHtml(order.paymentReference || "N/A")}</p>
        </div>

        <h3 style="font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; color: #64748B;">Items Ordered:</h3>
        <ul style="margin: 0 0 24px 0; padding-left: 20px;">
          ${itemsList}
        </ul>

        <div style="text-align: center;">
          <a href="${adminOrderUrl}" target="_blank" style="display: inline-block; background-color: #000000; color: #FFFFFF; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px;">
            Open Admin Order Pipeline →
          </a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * 4. Passwordless 6-Digit OTP Sign-in Code Template
 */
export function renderOtpVerificationEmail(email: string, code: string): { subject: string; html: string } {
  const safeCode = escapeHtml(code);
  const safeEmail = escapeHtml(email);
  const subject = `${safeCode} is your Fìlà Yorùbá Sign-In Code`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #000000;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border: 1px solid #E2E8F0;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 28px; text-align: center; border-bottom: 3px solid #FED501;">
              <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td align="right" style="text-align: right;">
                    <div style="font-family: Georgia, 'Times New Roman', serif; font-size: 26px; font-weight: 800; color: #FFFFFF; line-height: 1; letter-spacing: -0.5px; text-align: right;">
                      Fìlà
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 9.5px; font-weight: 600; color: #FED501; text-transform: uppercase; letter-spacing: 2.5px; line-height: 1; margin-top: 3px; text-align: right;">
                      YORÙBÁ
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.7); font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.5px;">
                Customer Authentication
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 36px 32px; text-align: center;">
              <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #000000;">
                Your Sign-In Code
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #64748B; line-height: 1.5;">
                Enter the 6-digit code below to sign in to your Fìlà Yorùbá customer account for <strong>${safeEmail}</strong>.
              </p>

              <!-- OTP Code Display -->
              <div style="background-color: #F8FAFC; border: 2px dashed #FED501; border-radius: 12px; padding: 20px; margin-bottom: 24px; display: inline-block;">
                <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #000000;">
                  ${safeCode}
                </span>
              </div>

              <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                This code will expire in <strong>10 minutes</strong>. If you didn't request this sign-in, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #000000; padding: 18px 32px; text-align: center;">
              <p style="margin: 0; color: rgba(255, 255, 255, 0.5); font-size: 11px;">
                &copy; ${new Date().getFullYear()} Fìlà Yorùbá. Authentic Heritage, Tailored Elegance.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * 6. Order Delivery Address Updated Template
 */
export function renderOrderAddressUpdatedEmail(
  order: Order,
  newAddress: { address: string; city: string; state: string; country?: string }
): { subject: string; html: string } {
  const orderNum = order.orderNumber || order.id;
  const subject = `Delivery Address Updated: Order #${escapeHtml(orderNum)} - Fìlà Yorùbá`;
  const trackingUrl = `${APP_URL}/track-order?order=${encodeURIComponent(orderNum)}`;
  const customerName = escapeHtml(order.customer?.firstName || "Valued Patron");
  const safeStreet = escapeHtml(newAddress.address);
  const safeCity = escapeHtml(newAddress.city);
  const safeState = escapeHtml(newAddress.state);
  const safeCountry = escapeHtml(newAddress.country || "Nigeria");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 28px 32px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 20px; font-weight: 700; letter-spacing: 1px;">
                FÌLÀ YORÙBÁ
              </h1>
              <p style="margin: 6px 0 0 0; color: #FED501; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px;">
                Delivery Destination Update
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.6;">
                Ẹ n lẹ o, <strong>${customerName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748B; line-height: 1.6;">
                The delivery address for your order <strong>#${escapeHtml(orderNum)}</strong> has been successfully updated before courier dispatch.
              </p>

              <!-- Address Box -->
              <div style="background-color: #F8FAFC; border: 1px solid #CBD5E1; border-left: 4px solid #FED501; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #000000; text-transform: uppercase; letter-spacing: 1px;">
                  New Delivery Address:
                </p>
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #0F172A; line-height: 1.5;">
                  ${safeStreet}<br/>
                  ${safeCity}, ${safeState}<br/>
                  ${safeCountry}
                </p>
              </div>

              <p style="margin: 0 0 24px 0; font-size: 13px; color: #64748B; line-height: 1.5;">
                Our artisan team has noted your updated destination and courier labels will reflect this address once handcrafting is complete.
              </p>

              <!-- Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px 0;">
                    <a href="${trackingUrl}" style="display: inline-block; background-color: #000000; color: #FFFFFF; font-size: 13px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px;">
                      Track Order &amp; Milestones &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #000000; padding: 18px 32px; text-align: center;">
              <p style="margin: 0; color: rgba(255, 255, 255, 0.5); font-size: 11px;">
                &copy; ${new Date().getFullYear()} Fìlà Yorùbá. Authentic Heritage, Tailored Elegance.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}

/**
 * 6. Administrative Password Reset OTP Code Template
 */
export function renderAdminPasswordResetEmail(name: string, code: string): { subject: string; html: string } {
  const safeName = escapeHtml(name || "Administrator");
  const safeCode = escapeHtml(code);
  const subject = `Admin Password Reset Code: ${safeCode} - Fìlà Yorùbá Ops`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0F172A; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 520px; background-color: #000000; border: 1px solid rgba(254, 213, 1, 0.3); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(180deg, #1A1A1A 0%, #000000 100%); padding: 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td align="center">
                    <div style="width: 56px; height: 56px; border-radius: 50%; border: 2px solid #FED501; overflow: hidden; display: inline-block;">
                      <img src="${APP_URL}/images/fallback%20logo/fallback%20logo.jpg" alt="Fìlà Yorùbá" width="56" height="56" style="display: block; object-fit: cover;" />
                    </div>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 16px 0 0 0; color: #FED501; font-size: 16px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">
                Artisan Operations Portal
              </h1>
              <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.6); font-size: 12px; font-weight: 400;">
                Administrative Security Notification
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 36px 32px; text-align: center;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #FFFFFF;">
                Password Reset Request
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; color: #94A3B8; line-height: 1.6; text-align: left;">
                Hello <strong>${safeName}</strong>,<br/>
                We received a request to reset your administrator credentials for the Fìlà Yorùbá Artisan Operations Portal. Enter the 6-digit authorization code below to configure your new password:
              </p>

              <!-- OTP Code Display -->
              <div style="background-color: rgba(254, 213, 1, 0.08); border: 2px solid #FED501; border-radius: 12px; padding: 22px; margin-bottom: 24px; display: inline-block;">
                <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #FED501;">
                  ${safeCode}
                </span>
              </div>

              <p style="margin: 0 0 16px 0; font-size: 12px; color: #E2E8F0; text-align: center;">
                ⏱️ This code will expire in <strong>15 minutes</strong>.
              </p>

              <div style="background-color: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 8px; padding: 12px 16px; text-align: left;">
                <p style="margin: 0; font-size: 12px; color: #FDA4AF; line-height: 1.5;">
                  <strong>Security Alert:</strong> If you did not initiate this password reset, your account credentials may have been targeted. Please alert your Super Admin immediately.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0A0A0A; padding: 18px 32px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
              <p style="margin: 0; color: rgba(255, 255, 255, 0.4); font-size: 11px;">
                &copy; ${new Date().getFullYear()} Fìlà Yorùbá Luxury Operations. All administrative actions are logged and audited.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
}


