import { NextResponse } from "next/server";
import { voteReviewHelpful } from "@/server/services/review.service";
import { checkRateLimit, getClientIp } from "@/server/rate-limit";

interface RouteParams {
  params: Promise<{ slug: string; id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const ip = getClientIp(req);
    const limit = checkRateLimit(`review_helpful:${ip}`, 30, 60 * 1000);
    if (!limit.success) {
      return NextResponse.json(
        { message: `Too many votes. Please wait ${limit.resetSeconds} seconds.` },
        { status: 429 }
      );
    }

    const { id } = await params;
    const result = await voteReviewHelpful(id);
    return NextResponse.json({
      success: true,
      helpfulCount: result.helpfulCount,
    });
  } catch (error) {
    console.error("Error voting review helpful:", error);
    return NextResponse.json(
      { message: "Failed to record helpful vote" },
      { status: 400 }
    );
  }
}
