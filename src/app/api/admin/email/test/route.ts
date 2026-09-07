import { NextResponse } from "next/server";
import { Order, OrderStatus } from "@/types/order";
import {
  renderOrderConfirmationEmail,
  renderOrderStatusUpdateEmail,
  renderAdminNewOrderAlertEmail,
} from "@/server/email/templates";
import { sendEmail } from "@/server/services/email.service";
import { getAdminSession } from "@/server/auth";

// Sample mock order for testing and previewing email templates
const sampleOrder: Order = {
  id: "sample-order-id-123",
  orderNumber: "FY-2026-889921",
  status: "paid",
  salesChannel: "ONLINE_STORE",
  paymentStatus: "paid",
  fulfillmentType: "delivery",
  discount: 0,
  amountPaid: 47500,
  amountDue: 0,
  amountRefunded: 0,
  refundStatus: "not_refunded",
  payments: [],
  subtotal: 45000,
  shipping: 2500,
  total: 47500,
  customer: {
    firstName: "Adewale",
    lastName: "Adeyemi",
    email: "adewale.adeyemi@example.com",
    phone: "+234 803 123 4567",
  },
  address: {
    address: "Plot 14, Victoria Island Extension",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
  },
  paymentReference: "trad_1787720000_sample",
  paymentMethod: "Paystack (CARD)",
  createdAt: new Date().toISOString(),
  paidAt: new Date().toISOString(),
  items: [
    {
      product: {
        id: "prod-1",
        slug: "royal-damask-fila",
        name: "Royal Navy Damask Handwoven Fila",
        description: "Intricately woven with traditional gold threading for ceremonial occasions.",
        price: 35000,
        images: [
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
        ],
        colors: ["Royal Navy", "Gold"],
        sizes: ["22", "23"],
        stock: 8,
        featured: true,
        rating: 5.0,
        reviews: [],
        collection: {
          name: "Ceremonial Heritage",
          slug: "heritage",
        },
      },
      quantity: 1,
      selectedSize: "22.5 inches",
    },
    {
      product: {
        id: "prod-2",
        slug: "aso-oke-classic-fila",
        name: "Aso-Oke Classic Embroidered Fila",
        description: "Timeless traditional styling.",
        price: 10000,
        images: [
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80",
        ],
        colors: ["White", "Silver"],
        sizes: ["22", "23"],
        stock: 12,
        featured: false,
        rating: 4.9,
        reviews: [],
        collection: {
          name: "Aso-Oke Heritage",
          slug: "aso-oke",
        },
      },
      quantity: 1,
      selectedSize: "23 inches",
    },
  ],
};

/**
 * GET: Preview email template HTML in browser
 */
export async function GET(req: Request) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized. Admin session required." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "confirmation";
  const status = (searchParams.get("status") || "crafting") as OrderStatus;

  let rendered: { subject: string; html: string };

  switch (type) {
    case "status":
      rendered = renderOrderStatusUpdateEmail(sampleOrder, status);
      break;
    case "admin_alert":
      rendered = renderAdminNewOrderAlertEmail(sampleOrder);
      break;
    case "confirmation":
    default:
      rendered = renderOrderConfirmationEmail(sampleOrder);
      break;
  }

  return new Response(rendered.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

/**
 * POST: Send a real test email to an admin-specified email address
 */
export async function POST(req: Request) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { to, type = "confirmation", status = "crafting" } = body;

    if (!to || typeof to !== "string") {
      return NextResponse.json(
        { message: "Recipient email 'to' is required." },
        { status: 400 }
      );
    }

    let rendered: { subject: string; html: string };

    switch (type) {
      case "status":
        rendered = renderOrderStatusUpdateEmail(sampleOrder, status as OrderStatus);
        break;
      case "admin_alert":
        rendered = renderAdminNewOrderAlertEmail(sampleOrder);
        break;
      case "confirmation":
      default:
        rendered = renderOrderConfirmationEmail(sampleOrder);
        break;
    }

    const result = await sendEmail({
      to,
      subject: `[TEST] ${rendered.subject}`,
      html: rendered.html,
    });

    return NextResponse.json({
      success: result.success,
      provider: result.provider,
      messageId: result.messageId,
      error: result.error,
      recipient: to,
    });
  } catch (error) {
    console.error("Test email dispatch error:", error);
    return NextResponse.json(
      { message: "Failed to dispatch test email." },
      { status: 500 }
    );
  }
}
