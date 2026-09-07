import { NextResponse } from "next/server";
import { verifyCustomerOtp, CUSTOMER_COOKIE_NAME } from "@/server/customer-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { message: "Email and 6-digit code are required." },
        { status: 400 }
      );
    }

    const result = await verifyCustomerOtp(email, code);

    if (!result.success || !result.token) {
      return NextResponse.json(
        { message: result.error || "Invalid sign-in code." },
        { status: 400 }
      );
    }

    const isProduction = process.env.NODE_ENV === "production";
    const response = NextResponse.json({
      success: true,
      message: "Signed in successfully",
      customer: result.customer,
    });

    response.cookies.set({
      name: CUSTOMER_COOKIE_NAME,
      value: result.token,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Error verifying customer OTP:", error);
    return NextResponse.json(
      { message: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
