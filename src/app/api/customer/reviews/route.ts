import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getCustomerFromRequest } from "@/server/customer-auth";

export async function GET(req: Request) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return NextResponse.json({ reviews: [] });
    }

    const reviews = await db.review.findMany({
      where: {
        email: { equals: customer.email, mode: "insensitive" },
      },
      select: {
        id: true,
        productId: true,
        rating: true,
        title: true,
        comment: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching customer reviews:", error);
    return NextResponse.json({ reviews: [] }, { status: 500 });
  }
}
