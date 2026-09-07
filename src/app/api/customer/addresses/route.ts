import { NextResponse } from "next/server";
import { getCustomerFromRequest } from "@/server/customer-auth";
import {
  saveCustomerAddress,
  getCustomerProfile,
} from "@/server/services/customer.service";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const customer = await getCustomerFromRequest(req);

    if (!customer) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const addresses = await db.address.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { message: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const customer = await getCustomerFromRequest(req);

    if (!customer) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { address, city, state, country } = body;

    if (!address?.trim() || !city?.trim() || !state?.trim()) {
      return NextResponse.json(
        { message: "Address, city, and state are required fields" },
        { status: 400 }
      );
    }

    const newAddress = await saveCustomerAddress(customer.id, {
      address,
      city,
      state,
      country,
    });

    const fullProfile = await getCustomerProfile(customer.id);

    return NextResponse.json({
      success: true,
      message: "Address added successfully",
      address: newAddress,
      profile: fullProfile,
    });
  } catch (error: any) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to create address" },
      { status: 500 }
    );
  }
}
