import { NextResponse } from "next/server";
import { getCustomerFromRequest } from "@/server/customer-auth";
import { cancelCustomerOrder } from "@/server/services/order.service";
import { getClientIp } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const { orderId, reason, notes, email, termsAccepted } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { message: "Valid order reference or order number is required." },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json(
        { message: "Please select a reason for cancelling this order." },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        {
          message:
            "You must review and agree to the Order Cancellation Terms & Conditions to proceed.",
        },
        { status: 400 }
      );
    }

    // Resolve Customer identity: authenticated session OR verified email from tracking portal
    const sessionCustomer = await getCustomerFromRequest(req);
    let resolvedEmail = sessionCustomer?.email;

    if (!resolvedEmail && email && typeof email === "string" && email.includes("@")) {
      resolvedEmail = email.trim().toLowerCase();
    }

    if (!resolvedEmail) {
      return NextResponse.json(
        {
          message:
            "Authentication required. Please sign in or provide the email address used during checkout.",
        },
        { status: 401 }
      );
    }

    const result = await cancelCustomerOrder({
      orderIdOrNumber: orderId.trim(),
      reason: reason.trim(),
      notes: typeof notes === "string" ? notes.trim() : undefined,
      customerEmail: resolvedEmail,
      cancelledBy: "customer",
      ipAddress: ip,
    });

    if (!result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      order: result.order,
    });
  } catch (error) {
    console.error("Error processing customer order cancellation:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred while processing your cancellation. Please try again." },
      { status: 500 }
    );
  }
}
