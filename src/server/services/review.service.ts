import "server-only";
import { db } from "@/server/db";
import { Review, RatingBreakdown } from "@/types/product";
import { Prisma } from "@prisma/client";
import { logAuditEvent } from "./audit.service";
import { publishAdminNotification } from "./notification.service";

export interface CreateReviewInput {
  productIdOrSlug: string;
  name: string;
  email?: string;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedSession?: boolean;
}

export interface ReviewEligibilityResult {
  eligible: boolean;
  reason?: "NOT_LOGGED_IN" | "NOT_PURCHASED" | "ORDER_IN_PROGRESS" | "ALREADY_REVIEWED";
  message: string;
  customer?: {
    name: string;
    email: string;
  };
  orderNumber?: string;
  existingReview?: Review;
}

export interface ListAdminReviewsOptions {
  search?: string;
  rating?: number;
  isVerifiedOnly?: boolean;
  productId?: string;
  sortBy?: "newest" | "oldest" | "rating_desc" | "rating_asc" | "helpful";
  page?: number;
  limit?: number;
}

export interface AdminReviewItem extends Review {
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    price: number;
  };
}

export interface AdminReviewsResult {
  reviews: AdminReviewItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: {
    totalReviews: number;
    averageRating: number;
    verifiedCount: number;
    fiveStarCount: number;
    distribution: Record<1 | 2 | 3 | 4 | 5, number>;
    percentages: Record<1 | 2 | 3 | 4 | 5, number>;
  };
}

export function calculateRatingBreakdown(reviews: { rating: number }[]): RatingBreakdown {
  const total = reviews.length;
  if (total === 0) {
    return {
      average: 5.0,
      total: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentages: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;

  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[star] = (distribution[star] || 0) + 1;
    sum += r.rating;
  }

  const average = Number((sum / total).toFixed(1));
  const percentages = {
    5: Math.round((distribution[5] / total) * 100),
    4: Math.round((distribution[4] / total) * 100),
    3: Math.round((distribution[3] / total) * 100),
    2: Math.round((distribution[2] / total) * 100),
    1: Math.round((distribution[1] / total) * 100),
  };

  return {
    average,
    total,
    distribution,
    percentages,
  };
}

/**
 * Checks whether a customer is eligible to submit a review for a specific product.
 * Policy: ONLY customers with a DELIVERED order for the product can review.
 */
export async function checkReviewEligibility(
  productIdOrSlug: string,
  customerEmail?: string,
  customerName?: string
): Promise<ReviewEligibilityResult> {
  if (!customerEmail || !customerEmail.trim()) {
    return {
      eligible: false,
      reason: "NOT_LOGGED_IN",
      message: "Please sign in to your customer account to leave a verified review.",
    };
  }

  const cleanEmail = customerEmail.trim().toLowerCase();

  // 1. Locate product
  const product = await db.product.findFirst({
    where: {
      OR: [{ id: productIdOrSlug }, { slug: productIdOrSlug }],
      isArchived: false,
    },
  });

  if (!product) {
    throw new Error("Product not found.");
  }

  // 2. Check if customer has already reviewed this product
  const existingReview = await db.review.findFirst({
    where: {
      productId: product.id,
      email: { equals: cleanEmail, mode: "insensitive" },
    },
  });

  if (existingReview) {
    return {
      eligible: false,
      reason: "ALREADY_REVIEWED",
      message: "You have already reviewed this handcrafted cap. Thank you for your feedback!",
      customer: {
        name: customerName || existingReview.name,
        email: cleanEmail,
      },
      existingReview: {
        id: existingReview.id,
        name: existingReview.name,
        email: existingReview.email || undefined,
        rating: existingReview.rating,
        title: existingReview.title || undefined,
        comment: existingReview.comment,
        isVerifiedBuyer: existingReview.isVerifiedBuyer,
        helpfulCount: existingReview.helpfulCount,
        date: existingReview.date || existingReview.createdAt.toISOString().split("T")[0],
        createdAt: existingReview.createdAt.toISOString(),
      },
    };
  }

  // 3. Query order items for this product with status DELIVERED
  const deliveredOrderItem = await db.orderItem.findFirst({
    where: {
      OR: [{ productId: product.id }, { productSlug: product.slug }],
      order: {
        customerEmail: { equals: cleanEmail, mode: "insensitive" },
        status: "DELIVERED",
      },
    },
    include: {
      order: {
        select: {
          orderNumber: true,
          status: true,
        },
      },
    },
  });

  if (deliveredOrderItem) {
    return {
      eligible: true,
      message: "You are verified to review this handcrafted cap.",
      customer: {
        name: customerName || cleanEmail.split("@")[0],
        email: cleanEmail,
      },
      orderNumber: deliveredOrderItem.order.orderNumber,
    };
  }

  // 4. Check if they have an in-progress order (PAID, CRAFTING, SHIPPED)
  const inProgressOrderItem = await db.orderItem.findFirst({
    where: {
      OR: [{ productId: product.id }, { productSlug: product.slug }],
      order: {
        customerEmail: { equals: cleanEmail, mode: "insensitive" },
        status: { in: ["PAID", "CRAFTING", "SHIPPED"] },
      },
    },
    include: {
      order: {
        select: {
          orderNumber: true,
          status: true,
        },
      },
    },
  });

  if (inProgressOrderItem) {
    const statusLabels: Record<string, string> = {
      PAID: "confirmed and queued for crafting",
      CRAFTING: "in handcrafting with our master weavers",
      SHIPPED: "dispatched to courier",
    };
    const stageDesc = statusLabels[inProgressOrderItem.order.status] || inProgressOrderItem.order.status.toLowerCase();

    return {
      eligible: false,
      reason: "ORDER_IN_PROGRESS",
      message: `Your order #${inProgressOrderItem.order.orderNumber} is currently ${stageDesc}. You can submit your review once your cap has been delivered.`,
      customer: {
        name: customerName || cleanEmail.split("@")[0],
        email: cleanEmail,
      },
      orderNumber: inProgressOrderItem.order.orderNumber,
    };
  }

  // 5. Not purchased
  return {
    eligible: false,
    reason: "NOT_PURCHASED",
    message: "Verified Patrons Only: You can leave a review once you have purchased and received delivery of this product.",
    customer: {
      name: customerName || cleanEmail.split("@")[0],
      email: cleanEmail,
    },
  };
}

/**
 * Creates a review, verifies delivered buyer status against authenticated customer session and order history, and recalculates product rating
 */
export async function createReview(input: CreateReviewInput): Promise<{
  review: Review;
  breakdown: RatingBreakdown;
}> {
  const { productIdOrSlug, name, email, rating, title, comment, isVerifiedSession } = input;

  if (!productIdOrSlug || !name || !comment || !rating) {
    throw new Error("Missing required review fields.");
  }

  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !isVerifiedSession) {
    throw new Error("You must be signed in to submit a review.");
  }

  const normalizedRating = Math.min(5, Math.max(1, Math.round(rating)));

  // 1. Locate product
  const product = await db.product.findFirst({
    where: {
      OR: [{ id: productIdOrSlug }, { slug: productIdOrSlug }],
      isArchived: false,
    },
  });

  if (!product) {
    throw new Error("Product not found.");
  }

  // 2. Strict Delivery Verification: Customer must have a DELIVERED order for this product
  const deliveredOrderItem = await db.orderItem.findFirst({
    where: {
      OR: [{ productId: product.id }, { productSlug: product.slug }],
      order: {
        customerEmail: { equals: cleanEmail, mode: "insensitive" },
        status: "DELIVERED",
      },
    },
    include: {
      order: true,
    },
  });

  if (!deliveredOrderItem) {
    throw new Error("Only customers whose order has been successfully delivered can submit a review for this product.");
  }

  // 3. Check for existing review (prevent duplicates)
  const existingReview = await db.review.findFirst({
    where: {
      productId: product.id,
      email: { equals: cleanEmail, mode: "insensitive" },
    },
  });

  if (existingReview) {
    throw new Error("You have already submitted a review for this product.");
  }

  const today = new Date().toISOString().split("T")[0];

  // 4. Create review record using Prisma Client
  const review = await db.review.create({
    data: {
      productId: product.id,
      name: name.trim(),
      email: cleanEmail,
      rating: normalizedRating,
      title: title?.trim() || null,
      comment: comment.trim(),
      isVerifiedBuyer: true,
      helpfulCount: 0,
      date: today,
    },
  });

  // 5. Recalculate average rating for the product
  const allRatings = await db.review.findMany({
    where: { productId: product.id },
    select: { rating: true },
  });

  const breakdown = calculateRatingBreakdown(allRatings);

  await db.product.update({
    where: { id: product.id },
    data: { rating: breakdown.average },
  });

  // 6. Log audit trail
  await logAuditEvent({
    action: "PRODUCT_REVIEW_CREATED",
    entity: "Product",
    entityId: product.id,
    userEmail: cleanEmail,
    details: {
      reviewId: review.id,
      rating: normalizedRating,
      isVerifiedBuyer: true,
      orderNumber: deliveredOrderItem.order.orderNumber,
      productName: product.name,
    },
  });

  // 7. Publish real-time notification to Admin Panel
  publishAdminNotification({
    type: "NEW_REVIEW",
    priority: "medium",
    title: `⭐ New ${normalizedRating}-Star Verified Review: ${product.name}`,
    message: `"${comment.slice(0, 70)}${comment.length > 70 ? "..." : ""}" by ${name.trim()} (Delivered Patron #${deliveredOrderItem.order.orderNumber})`,
    link: `/admin/reviews?search=${encodeURIComponent(cleanEmail)}`,
    entityId: product.id,
    entityType: "Review",
    metadata: {
      productId: product.id,
      productName: product.name,
      rating: normalizedRating,
      reviewerName: name.trim(),
      orderNumber: deliveredOrderItem.order.orderNumber,
    },
  }).catch(() => {});

  const domainReview: Review = {
    id: review.id,
    name: review.name,
    email: review.email || undefined,
    rating: review.rating,
    title: review.title || undefined,
    comment: review.comment,
    isVerifiedBuyer: true,
    helpfulCount: review.helpfulCount,
    date: review.date || today,
    createdAt: review.createdAt.toISOString(),
  };

  return {
    review: domainReview,
    breakdown,
  };
}

export interface CreateAdminReviewInput {
  productId: string;
  name: string;
  email?: string;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedBuyer?: boolean;
  date?: string;
}

/**
 * Admin manual review creation (e.g. offline orders, WhatsApp feedback, VIP bespoke reviews)
 */
export async function createAdminReview(
  input: CreateAdminReviewInput,
  adminUser?: { id?: string; email?: string }
): Promise<{ review: Review; breakdown: RatingBreakdown }> {
  const { productId, name, email, rating, title, comment, isVerifiedBuyer = true, date } = input;

  if (!productId || !name || !comment || !rating) {
    throw new Error("Missing required review fields.");
  }

  const product = await db.product.findFirst({
    where: {
      OR: [{ id: productId }, { slug: productId }],
    },
  });

  if (!product) {
    throw new Error("Product not found.");
  }

  const normalizedRating = Math.min(5, Math.max(1, Math.round(rating)));
  const reviewDate = date || new Date().toISOString().split("T")[0];

  const review = await db.review.create({
    data: {
      productId: product.id,
      name: name.trim(),
      email: email?.trim().toLowerCase() || null,
      rating: normalizedRating,
      title: title?.trim() || null,
      comment: comment.trim(),
      isVerifiedBuyer,
      helpfulCount: 0,
      date: reviewDate,
    },
  });

  // Recalculate average rating for the product
  const allRatings = await db.review.findMany({
    where: { productId: product.id },
    select: { rating: true },
  });

  const breakdown = calculateRatingBreakdown(allRatings);

  await db.product.update({
    where: { id: product.id },
    data: { rating: breakdown.average },
  });

  await logAuditEvent({
    action: "ADMIN_REVIEW_CREATED",
    entity: "Product",
    entityId: product.id,
    userId: adminUser?.id,
    userEmail: adminUser?.email || "Admin",
    details: {
      reviewId: review.id,
      rating: normalizedRating,
      reviewerName: name.trim(),
      productName: product.name,
      isVerifiedBuyer,
    },
  });

  const domainReview: Review = {
    id: review.id,
    name: review.name,
    email: review.email || undefined,
    rating: review.rating,
    title: review.title || undefined,
    comment: review.comment,
    isVerifiedBuyer: review.isVerifiedBuyer,
    helpfulCount: review.helpfulCount,
    date: review.date || reviewDate,
    createdAt: review.createdAt.toISOString(),
  };

  return {
    review: domainReview,
    breakdown,
  };
}

/**
 * Lists all reviews for a product with breakdown statistics (public storefront)
 */
export async function getProductReviews(productIdOrSlug: string): Promise<{
  product: { id: string; name: string; slug: string; rating: number };
  reviews: Review[];
  breakdown: RatingBreakdown;
}> {
  const product = await db.product.findFirst({
    where: {
      OR: [{ id: productIdOrSlug }, { slug: productIdOrSlug }],
      isArchived: false,
    },
  });

  if (!product) {
    throw new Error("Product not found.");
  }

  const rawReviews = await db.review.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: "desc" },
  });

  const domainReviews: Review[] = rawReviews.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email || undefined,
    rating: r.rating,
    title: r.title || undefined,
    comment: r.comment,
    isVerifiedBuyer: r.isVerifiedBuyer,
    helpfulCount: r.helpfulCount,
    date: r.date || r.createdAt.toISOString().split("T")[0],
    createdAt: r.createdAt.toISOString(),
  }));

  const breakdown = calculateRatingBreakdown(rawReviews.map((r) => ({ rating: r.rating })));

  return {
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      rating: product.rating,
    },
    reviews: domainReviews,
    breakdown,
  };
}

/**
 * Increment helpful count for a review
 */
export async function voteReviewHelpful(reviewId: string): Promise<{ helpfulCount: number }> {
  const updated = await db.review.update({
    where: { id: reviewId },
    data: { helpfulCount: { increment: 1 } },
    select: { helpfulCount: true },
  });

  return { helpfulCount: updated.helpfulCount };
}

/**
 * Admin moderation: Delete a review and update product average rating
 */
export async function deleteReview(
  reviewId: string,
  adminUser?: { id?: string; email?: string }
): Promise<{ success: boolean; message: string; newRating: number }> {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    include: { product: true },
  });

  if (!review) {
    throw new Error("Review not found.");
  }

  await db.review.delete({
    where: { id: reviewId },
  });

  // Recalculate rating
  const remainingReviews = await db.review.findMany({
    where: { productId: review.productId },
    select: { rating: true },
  });

  const breakdown = calculateRatingBreakdown(remainingReviews);
  const newRating = remainingReviews.length > 0 ? breakdown.average : 5.0;

  await db.product.update({
    where: { id: review.productId },
    data: { rating: newRating },
  });

  await logAuditEvent({
    action: "PRODUCT_REVIEW_DELETED",
    entity: "Product",
    entityId: review.productId,
    userId: adminUser?.id,
    userEmail: adminUser?.email || "Admin",
    details: {
      deletedReviewId: review.id,
      reviewerName: review.name,
      productName: review.product?.name,
    },
  });

  return {
    success: true,
    message: "Review successfully deleted.",
    newRating,
  };
}

/**
 * Admin moderation: Batch delete multiple reviews and recalculate affected product ratings
 */
export async function batchDeleteReviews(
  reviewIds: string[],
  adminUser?: { id?: string; email?: string }
): Promise<{ success: boolean; deletedCount: number }> {
  if (!reviewIds || reviewIds.length === 0) {
    return { success: true, deletedCount: 0 };
  }

  // Identify affected products
  const reviewsToDelete = await db.review.findMany({
    where: { id: { in: reviewIds } },
    select: { id: true, productId: true, name: true },
  });

  const affectedProductIds = Array.from(new Set(reviewsToDelete.map((r) => r.productId)));

  const result = await db.review.deleteMany({
    where: { id: { in: reviewIds } },
  });

  // Recalculate ratings for affected products
  for (const pId of affectedProductIds) {
    const remaining = await db.review.findMany({
      where: { productId: pId },
      select: { rating: true },
    });
    const breakdown = calculateRatingBreakdown(remaining);
    const newRating = remaining.length > 0 ? breakdown.average : 5.0;
    await db.product.update({
      where: { id: pId },
      data: { rating: newRating },
    });
  }

  await logAuditEvent({
    action: "PRODUCT_REVIEWS_BATCH_DELETED",
    entity: "Review",
    userId: adminUser?.id,
    userEmail: adminUser?.email || "Admin",
    details: {
      deletedCount: result.count,
      reviewIds,
      affectedProductCount: affectedProductIds.length,
    },
  });

  return {
    success: true,
    deletedCount: result.count,
  };
}

/**
 * Admin: List and filter reviews across all products with pagination and analytics
 */
export async function listAdminReviews(options: ListAdminReviewsOptions = {}): Promise<AdminReviewsResult> {
  const {
    search,
    rating,
    isVerifiedOnly,
    productId,
    sortBy = "newest",
    page = 1,
    limit = 15,
  } = options;

  const where: Prisma.ReviewWhereInput = {};

  if (productId) {
    where.productId = productId;
  }

  if (rating && rating >= 1 && rating <= 5) {
    where.rating = rating;
  }

  if (isVerifiedOnly) {
    where.isVerifiedBuyer = true;
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { comment: { contains: term, mode: "insensitive" } },
      { title: { contains: term, mode: "insensitive" } },
      { product: { name: { contains: term, mode: "insensitive" } } },
    ];
  }

  let orderBy: Prisma.ReviewOrderByWithRelationInput = { createdAt: "desc" };
  if (sortBy === "oldest") {
    orderBy = { createdAt: "asc" };
  } else if (sortBy === "rating_desc") {
    orderBy = { rating: "desc" };
  } else if (sortBy === "rating_asc") {
    orderBy = { rating: "asc" };
  } else if (sortBy === "helpful") {
    orderBy = { helpfulCount: "desc" };
  }

  const [total, rawReviews, allReviewsForStats] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({
      where,
      orderBy,
      skip: Math.max(0, (page - 1) * limit),
      take: limit,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            price: true,
          },
        },
      },
    }),
    db.review.findMany({
      select: { rating: true, isVerifiedBuyer: true },
    }),
  ]);

  const totalReviewsCount = allReviewsForStats.length;
  const ratingSum = allReviewsForStats.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalReviewsCount > 0 ? Number((ratingSum / totalReviewsCount).toFixed(1)) : 5.0;
  const verifiedCount = allReviewsForStats.filter((r) => r.isVerifiedBuyer).length;
  const fiveStarCount = allReviewsForStats.filter((r) => r.rating === 5).length;

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of allReviewsForStats) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[star] = (distribution[star] || 0) + 1;
  }

  const percentages: Record<1 | 2 | 3 | 4 | 5, number> = {
    5: totalReviewsCount > 0 ? Math.round((distribution[5] / totalReviewsCount) * 100) : 0,
    4: totalReviewsCount > 0 ? Math.round((distribution[4] / totalReviewsCount) * 100) : 0,
    3: totalReviewsCount > 0 ? Math.round((distribution[3] / totalReviewsCount) * 100) : 0,
    2: totalReviewsCount > 0 ? Math.round((distribution[2] / totalReviewsCount) * 100) : 0,
    1: totalReviewsCount > 0 ? Math.round((distribution[1] / totalReviewsCount) * 100) : 0,
  };

  const reviews: AdminReviewItem[] = rawReviews.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email || undefined,
    rating: r.rating,
    title: r.title || undefined,
    comment: r.comment,
    isVerifiedBuyer: r.isVerifiedBuyer,
    helpfulCount: r.helpfulCount,
    date: r.date || r.createdAt.toISOString().split("T")[0],
    createdAt: r.createdAt.toISOString(),
    product: {
      id: r.product.id,
      name: r.product.name,
      slug: r.product.slug,
      images: r.product.images,
      price: Number(r.product.price),
    },
  }));

  return {
    reviews,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
    stats: {
      totalReviews: totalReviewsCount,
      averageRating,
      verifiedCount,
      fiveStarCount,
      distribution,
      percentages,
    },
  };
}
