import { NextResponse } from "next/server";
import { getOrderByReference } from "@/server/services/order.service";
import { checkRateLimit, getClientIp } from "@/server/rate-limit";
import { getCustomerFromRequest } from "@/server/customer-auth";

function maskPhone(phone?: string): string {
  if (!phone) return "—";
  const digits = phone.replace(/\s+/g, "");
  if (digits.length <= 4) return "••••";
  const lastFour = digits.slice(-4);
  return `${digits.slice(0, 4)} ••• ••${lastFour.slice(-2)}`;
}

function maskStreetAddress(address?: string): string {
  if (!address) return "";
  const parts = address.split(",");
  if (parts.length > 1) {
    return `••••••••••, ${parts.slice(1).join(",").trim()}`;
  }
  return "••••••••••";
}

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    // Allow up to 60 polling/status lookups per minute per IP for instant real-time tracking
    const limit = checkRateLimit(`track_order:${ip}`, 60, 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { message: `Too many lookup attempts. Please wait ${limit.resetSeconds} seconds.` },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim() || searchParams.get("reference")?.trim();
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!query) {
      return NextResponse.json(
        { message: "Please provide an Order Number, Reference, or Order ID." },
        { status: 400 }
      );
    }

    const order = await getOrderByReference(query);

    if (!order) {
      return NextResponse.json(
        { message: "No order found matching the provided reference or number." },
        { status: 404 }
      );
    }

    // Check if the requester is signed in as this customer
    const sessionCustomer = await getCustomerFromRequest(req);
    const sessionEmail = sessionCustomer?.email ? sessionCustomer.email.toLowerCase() : null;
    const orderEmail = order.customer?.email ? order.customer.email.toLowerCase() : null;
    const isOwnerSession = Boolean(sessionEmail && orderEmail && sessionEmail === orderEmail);

    // If not authenticated as the order owner, enforce email verification
    if (!isOwnerSession) {
      if (!email) {
        return NextResponse.json(
          { message: "For your privacy and security, please provide the email address used when placing this order." },
          { status: 400 }
        );
      }

      if (!orderEmail || orderEmail !== email) {
        return NextResponse.json(
          { message: "The email address does not match this order." },
          { status: 403 }
        );
      }
    }

    // Return sanitized or full payload depending on session ownership
    const isFullyAuthorized = isOwnerSession;

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber || order.id.slice(0, 8).toUpperCase(),
        status: order.status,
        paymentStatus: order.paymentStatus,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        customer: {
          firstName: order.customer?.firstName || "Valued",
          lastName: isFullyAuthorized
            ? (order.customer?.lastName || "Customer")
            : order.customer?.lastName
            ? `${order.customer.lastName.charAt(0)}.`
            : "C.",
          email: isFullyAuthorized
            ? (order.customer?.email || "")
            : order.customer?.email
            ? `${order.customer.email.slice(0, 2)}•••@${order.customer.email.split("@")[1]}`
            : "—",
          phone: isFullyAuthorized ? order.customer?.phone : maskPhone(order.customer?.phone),
        },
        address: {
          address: isFullyAuthorized ? (order.address?.address || "In-Store") : maskStreetAddress(order.address?.address || "In-Store"),
          city: order.address?.city || "Lagos",
          state: order.address?.state,
          country: order.address?.country,
        },
        items: order.items,
        paymentReference: isFullyAuthorized ? order.paymentReference : undefined,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
      },
    });
  } catch (error) {
    console.error("Order tracking error:", error);
    return NextResponse.json(
      { message: "Failed to retrieve order tracking information." },
      { status: 500 }
    );
  }
}
