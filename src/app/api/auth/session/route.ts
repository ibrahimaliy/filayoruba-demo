import { NextResponse } from "next/server";
import { getCustomerFromRequest } from "@/server/customer-auth";

export async function GET(req: Request) {
  const customer = await getCustomerFromRequest(req);

  if (!customer) {
    return NextResponse.json({
      authenticated: false,
    });
  }

  return NextResponse.json({
    authenticated: true,
    customer: {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
    },
  });
}
