import { NextResponse } from "next/server";
import { sendCustomerOtp } from "@/server/customer-auth";
import { checkRateLimit, getClientIp } from "@/server/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const ipLimit = checkRateLimit(`otp_send:ip:${ip}`, 5, 10 * 60 * 1000);

    if (!ipLimit.success) {
      return NextResponse.json(
        { message: `Too many sign-in requests from this connection. Please try again in ${ipLimit.resetSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "A valid email address is required." },
        { status: 400 }
      );
    }

    const emailLimit = checkRateLimit(`otp_send:email:${email.toLowerCase().trim()}`, 3, 10 * 60 * 1000);
    if (!emailLimit.success) {
      return NextResponse.json(
        { message: `Too many verification codes requested for this email. Please wait ${emailLimit.resetSeconds} seconds.` },
        { status: 429 }
      );
    }

    const result = await sendCustomerOtp(email);
    if (!result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error sending customer OTP:", error);
    return NextResponse.json(
      { message: "Failed to send sign-in code. Please try again." },
      { status: 500 }
    );
  }
}
