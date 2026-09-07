import { NextResponse } from "next/server";
import { getCustomerFromRequest } from "@/server/customer-auth";
import { updateOrderDeliveryAddress } from "@/server/services/order.service";
import { getClientIp } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

async function handleAddressUpdate(req: Request) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const {
      orderId,
      address,
      city,
      state,
      country = "Nigeria",
      customerPhone,
      saveToAddressBook = false,
      email,
    } = body;

    if (!orderId || typeof orderId !== "string") {
      return NextResponse.json(
        { message: "A valid order reference or order number is required." },
        { status: 400 }
      );
    }

    if (!address || typeof address !== "string" || address.trim().length < 3) {
      return NextResponse.json(
        { message: "Please enter a valid street address (minimum 3 characters)." },
        { status: 400 }
      );
    }

    if (!city || typeof city !== "string" || city.trim().length < 2) {
      return NextResponse.json(
        { message: "Please enter a valid city or town." },
        { status: 400 }
      );
    }

    if (!state || typeof state !== "string" || state.trim().length < 2) {
      return NextResponse.json(
        { message: "Please enter a valid state." },
        { status: 400 }
      );
    }

    // Resolve Customer identity: authenticated session OR verified email
    const sessionCustomer = await getCustomerFromRequest(req);
    let resolvedEmail: string | undefined = sessionCustomer?.email || undefined;

    if (!resolvedEmail && email && typeof email === "string" && email.includes("@")) {
      resolvedEmail = email.trim().toLowerCase();
    }

    if (!resolvedEmail && !sessionCustomer) {
      return NextResponse.json(
        {
          message:
            "Authentication required. Please sign in or provide the email address used during checkout.",
        },
        { status: 401 }
      );
    }

    const result = await updateOrderDeliveryAddress({
      orderIdOrNumber: orderId.trim(),
      customerEmail: resolvedEmail || undefined,
      authenticatedCustomerId: sessionCustomer?.id,
      address: {
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        country: typeof country === "string" && country.trim() ? country.trim() : "Nigeria",
      },
      customerPhone: typeof customerPhone === "string" ? customerPhone.trim() : undefined,
      saveToAddressBook: Boolean(saveToAddressBook),
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
    console.error("Error processing order address update:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred while updating the delivery address. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return handleAddressUpdate(req);
}

export async function PATCH(req: Request) {
  return handleAddressUpdate(req);
}
