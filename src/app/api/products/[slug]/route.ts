import { NextResponse } from "next/server";
import { findProductBySlug } from "@/server/services/product.service";

export async function GET(
  req: Request,
  context: {
    params: Promise<{ slug: string }>;
  }
) {
  try {
    const { slug } = await context.params;
    const product = await findProductBySlug(slug);

    if (!product) {
      return NextResponse.json(
        { message: "Product Not Found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("API /api/products/[slug] error:", error);
    return NextResponse.json(
      { message: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
