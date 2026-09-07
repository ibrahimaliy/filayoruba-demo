import { NextResponse } from "next/server";
import { getAdminSession } from "@/server/auth-edge";
import { batchDeleteReviews } from "@/server/services/review.service";

export async function POST(req: Request) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized. Admin authentication required." },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { reviewIds } = body;

    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return NextResponse.json(
        { message: "Please provide an array of review IDs to delete." },
        { status: 400 }
      );
    }

    const result = await batchDeleteReviews(reviewIds, {
      id: session.id,
      email: session.email,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in batch review deletion:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete reviews" },
      { status: 500 }
    );
  }
}
