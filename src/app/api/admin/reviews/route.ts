import { NextResponse } from "next/server";
import { getAdminSession } from "@/server/auth-edge";
import { listAdminReviews, createAdminReview } from "@/server/services/review.service";

export async function GET(req: Request) {
  const session = await getAdminSession(req);
  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized. Admin authentication required." },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const ratingParam = searchParams.get("rating");
    const rating = ratingParam ? parseInt(ratingParam, 10) : undefined;
    const verifiedParam = searchParams.get("verified");
    const isVerifiedOnly = verifiedParam === "true";
    const productId = searchParams.get("productId") || undefined;
    const sortBy = (searchParams.get("sortBy") as any) || "newest";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);

    const data = await listAdminReviews({
      search,
      rating,
      isVerifiedOnly,
      productId,
      sortBy,
      page,
      limit,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error listing admin reviews:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to load reviews" },
      { status: 500 }
    );
  }
}

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
    const { productId, name, email, rating, title, comment, isVerifiedBuyer, date } = body;

    if (!productId || !name || !comment || !rating) {
      return NextResponse.json(
        { message: "Product, reviewer name, rating, and review comment are required." },
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

    const result = await createAdminReview(
      {
        productId,
        name: name.trim(),
        email: email?.trim() || undefined,
        rating: numRating,
        title: title?.trim() || undefined,
        comment: comment.trim(),
        isVerifiedBuyer: isVerifiedBuyer !== false,
        date: date?.trim() || undefined,
      },
      { id: session.id, email: session.email }
    );

    return NextResponse.json({
      success: true,
      message: "Review successfully created and published.",
      review: result.review,
      breakdown: result.breakdown,
    });
  } catch (error) {
    console.error("Error creating review in admin:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create review" },
      { status: 400 }
    );
  }
}
