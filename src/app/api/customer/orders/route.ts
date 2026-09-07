import { NextResponse } from "next/server";
import { getCustomerFromRequest } from "@/server/customer-auth";
import { getCustomerOrders } from "@/server/services/customer.service";

export async function GET(req: Request) {
  try {
    const customer = await getCustomerFromRequest(req);

    if (!customer) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const orders = await getCustomerOrders(customer.id, customer.email || "");

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return NextResponse.json(
      { message: "Failed to retrieve order history" },
      { status: 500 }
    );
  }
}
