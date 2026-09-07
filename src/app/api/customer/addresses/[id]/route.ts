import { NextResponse } from "next/server";
import { getCustomerFromRequest } from "@/server/customer-auth";
import {
  updateCustomerAddress,
  deleteCustomerAddress,
  getCustomerProfile,
} from "@/server/services/customer.service";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const customer = await getCustomerFromRequest(req);

    if (!customer) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { message: "Address ID is required" },
        { status: 400 }
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

    const updated = await updateCustomerAddress(customer.id, id, {
      address,
      city,
      state,
      country,
    });

    const fullProfile = await getCustomerProfile(customer.id);

    return NextResponse.json({
      success: true,
      message: "Address updated successfully",
      address: updated,
      profile: fullProfile,
    });
  } catch (error: any) {
    console.error("Error updating address:", error);
    const statusCode = error?.message?.includes("unauthorized") ? 403 : 500;
    return NextResponse.json(
      { message: error?.message || "Failed to update address" },
      { status: statusCode }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const customer = await getCustomerFromRequest(req);

    if (!customer) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { message: "Address ID is required" },
        { status: 400 }
      );
    }

    await deleteCustomerAddress(customer.id, id);

    const fullProfile = await getCustomerProfile(customer.id);

    return NextResponse.json({
      success: true,
      message: "Address deleted successfully",
      profile: fullProfile,
    });
  } catch (error: any) {
    console.error("Error deleting address:", error);
    const statusCode = error?.message?.includes("unauthorized") ? 403 : 500;
    return NextResponse.json(
      { message: error?.message || "Failed to delete address" },
      { status: statusCode }
    );
  }
}
