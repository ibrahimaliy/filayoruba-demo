import { NextResponse } from "next/server";
import { CUSTOMER_COOKIE_NAME } from "@/server/customer-auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  response.cookies.set({
    name: CUSTOMER_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
