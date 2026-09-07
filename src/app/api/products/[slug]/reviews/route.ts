import { NextResponse } from "next/server";
import { getProductReviews, createReview } from "@/server/services/review.service";
import { checkRateLimit, getClientIp } from "@/server/rate-limit";
import { getCustomerFromRequest } from "@/server/customer-auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const data = await getProductReviews(slug);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to fetch reviews" },
      { status: 404 }
    );
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  const ip = getClientIp(req);

  // Rate limit review submissions (max 10 per hour per IP)
  const limit = checkRateLimit(`review_post:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json(
      { message: "You have submitted too many reviews recently. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const { slug } = await params;

    // 1. Enforce authenticated customer session
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return NextResponse.json(
        { message: "You must be signed in to your customer account to submit a review." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, rating, title, comment } = body;

    if (!comment || typeof comment !== "string" || comment.trim().length < 5) {
      return NextResponse.json(
        { message: "Please provide a review comment with at least 5 characters." },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { message: "Rating must be an integer between 1 and 5." },
        { status: 400 }
      );
    }

    const reviewerName =
      (typeof name === "string" && name.trim().length >= 2 ? name.trim() : "") ||
      `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
      (customer.email ? customer.email.split("@")[0] : "Customer");

    const result = await createReview({
      productIdOrSlug: slug,
      name: reviewerName,
      email: customer.email || undefined,
      rating: numRating,
      title: title?.trim(),
      comment: comment.trim(),
      isVerifiedSession: true,
    });

    return NextResponse.json({
      success: true,
      message: "Thank you! Your verified review has been published.",
      review: result.review,
      breakdown: result.breakdown,
    });
  } catch (error) {
    console.error("Error creating product review:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to publish review";
    return NextResponse.json(
      { message: errorMessage },
      { status: 403 }
    );
  }
}
