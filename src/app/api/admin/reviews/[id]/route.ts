import { NextResponse } from "next/server";
import { deleteReview } from "@/server/services/review.service";
import { getAdminSession } from "@/server/auth-edge";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized. Admin authentication required." },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const result = await deleteReview(id, { id: session.id, email: session.email });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete review" },
      { status: 400 }
    );
  }
}
