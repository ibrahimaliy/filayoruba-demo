import { NextResponse } from "next/server";
import { listCustomerDirectory } from "@/server/services/customer.service";
import { getAdminSession } from "@/server/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const tier = searchParams.get("tier")?.trim();

    const data = await listCustomerDirectory({ search, tier });

    return NextResponse.json(
      {
        customers: data.customers,
        metrics: data.metrics,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Admin customer directory API error:", error);
    return NextResponse.json(
      { message: "Failed to fetch customer directory" },
      { status: 500 }
    );
  }
}
