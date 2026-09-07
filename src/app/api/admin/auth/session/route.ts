import { NextResponse } from "next/server";
import { getAdminSession } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.id,
      email: session.email,
      name: session.name,
      role: session.role,
    },
  });
}

