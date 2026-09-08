import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateAdminRequest } from "@/server/auth-edge";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow public admin auth routes without blocking
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/admin/auth")
  ) {
    return NextResponse.next();
  }

  // 2. Validate admin credentials (cookie or Authorization header or x-admin-key)
  let isAuthenticated = false;
  try {
    isAuthenticated = await validateAdminRequest(req);
  } catch (err: any) {
    if (err?.message?.includes("[SECURITY CRITICAL]")) {
      throw err;
    }
    console.warn("Middleware admin session check failed:", err);
    isAuthenticated = false;
  }

  if (!isAuthenticated) {
    // API routes return 401 JSON
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json(
        { message: "Unauthorized. Admin authentication required." },
        { status: 401 }
      );
    }

    // Page routes redirect to login
    if (pathname.startsWith("/admin")) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
