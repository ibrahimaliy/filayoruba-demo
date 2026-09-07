import { NextResponse } from "next/server";
import { getCustomerFromRequest } from "@/server/customer-auth";
import {
  getCustomerProfile,
  updateCustomerProfile,
  saveCustomerAddress,
} from "@/server/services/customer.service";

export async function GET(req: Request) {
  try {
    const customer = await getCustomerFromRequest(req);

    if (!customer) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const profile = await getCustomerProfile(customer.id);

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Error fetching customer profile:", error);
    return NextResponse.json(
      { message: "Failed to retrieve profile" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const customer = await getCustomerFromRequest(req);

    if (!customer) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { firstName, lastName, phone, newAddress } = body;

    const updated = await updateCustomerProfile(customer.id, {
      firstName,
      lastName,
      phone,
    });

    if (newAddress && newAddress.address && newAddress.city && newAddress.state) {
      await saveCustomerAddress(customer.id, newAddress);
    }

    const fullProfile = await getCustomerProfile(customer.id);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profile: fullProfile,
    });
  } catch (error) {
    console.error("Error updating customer profile:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}
