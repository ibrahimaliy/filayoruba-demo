import { NextResponse } from "next/server";
import { createProduct, listProducts, listTrashedProducts } from "@/server/services/product.service";
import { getAdminSession } from "@/server/auth";
import { logAuditEvent } from "@/server/services/audit.service";
import { getClientIp } from "@/server/rate-limit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const products = status === "trash" ? await listTrashedProducts() : await listProducts();

    return NextResponse.json(products, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    console.error("Admin list products error:", error);
    return NextResponse.json(
      { message: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin authentication required." },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.name || !body.price) {
      return NextResponse.json(
        { message: "Product name and price are required." },
        { status: 400 }
      );
    }

    const product = await createProduct({
      name: body.name,
      slug: body.slug,
      description: body.description,
      price: Number(body.price),
      collectionSlug: body.collectionSlug || undefined,
      images: body.images?.length ? body.images : [
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80"
      ],
      colors: body.colors?.length ? body.colors : ["Standard"],
      sizes: body.sizes?.length ? body.sizes : ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
      stock: Number(body.stock || 0),
      featured: Boolean(body.featured),
    });

    await logAuditEvent({
      action: "PRODUCT_CREATED",
      entity: "Product",
      entityId: product.id,
      userId: session?.id,
      userEmail: session?.email,
      ipAddress: ip,
      details: {
        productName: product.name,
        price: product.price,
        stock: product.stock,
        slug: product.slug,
      },
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { message: "Failed to create product" },
      { status: 500 }
    );
  }
}

