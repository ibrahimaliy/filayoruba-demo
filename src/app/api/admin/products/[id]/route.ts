import { NextResponse } from "next/server";
import {
  findProductById,
  updateProduct,
  updateProductStock,
  trashProduct,
  restoreProduct,
  permanentDeleteProduct,
} from "@/server/services/product.service";
import { getAdminSession } from "@/server/auth";
import { logAuditEvent } from "@/server/services/audit.service";
import { getClientIp } from "@/server/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const product = await findProductById(id);

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      { message: "Failed to retrieve product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin authentication required." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();

    const existing = await findProductById(id);
    if (!existing) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    const updated = await updateProduct(id, {
      name: body.name,
      slug: body.slug,
      description: body.description,
      price: body.price !== undefined ? Number(body.price) : undefined,
      collectionSlug: body.collectionSlug,
      images: body.images,
      colors: body.colors,
      sizes: body.sizes,
      stock: body.stock !== undefined ? Number(body.stock) : undefined,
      featured: body.featured !== undefined ? Boolean(body.featured) : undefined,
    });

    if (!updated) {
      return NextResponse.json(
        { message: "Product not found or update failed" },
        { status: 404 }
      );
    }

    await logAuditEvent({
      action: "PRODUCT_UPDATED",
      entity: "Product",
      entityId: id,
      userId: session.id,
      userEmail: session.email,
      ipAddress: ip,
      details: {
        productName: updated.name,
        price: updated.price,
        stock: updated.stock,
        featured: updated.featured,
      },
    });

    return NextResponse.json({
      success: true,
      product: updated,
    });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { message: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin authentication required." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const { stock, action } = body;

    const existing = await findProductById(id);
    if (!existing) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    if (action === "restore") {
      await restoreProduct(id);
      await logAuditEvent({
        action: "PRODUCT_RESTORED",
        entity: "Product",
        entityId: id,
        userId: session.id,
        userEmail: session.email,
        ipAddress: ip,
        details: { productName: existing.name },
      });
      return NextResponse.json({ success: true, message: "Product restored from trash" });
    }

    if (action === "trash") {
      await trashProduct(id);
      await logAuditEvent({
        action: "PRODUCT_TRASHED",
        entity: "Product",
        entityId: id,
        userId: session.id,
        userEmail: session.email,
        ipAddress: ip,
        details: { productName: existing.name },
      });
      return NextResponse.json({ success: true, message: "Product moved to trash" });
    }

    if (stock !== undefined && !isNaN(Number(stock))) {
      const newStock = Number(stock);
      const updated = await updateProductStock(id, newStock);
      if (!updated) {
        return NextResponse.json(
          { message: "Product not found" },
          { status: 404 }
        );
      }

      await logAuditEvent({
        action: "PRODUCT_STOCK_ADJUSTED",
        entity: "Product",
        entityId: id,
        userId: session.id,
        userEmail: session.email,
        ipAddress: ip,
        details: {
          productName: existing.name,
          oldStock: existing.stock,
          newStock,
        },
      });

      return NextResponse.json({
        success: true,
        product: updated,
      });
    }

    return NextResponse.json({ message: "Invalid patch payload" }, { status: 400 });
  } catch (error) {
    console.error("Update stock/action error:", error);
    return NextResponse.json(
      { message: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(req);
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin authentication required." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const { searchParams } = new URL(req.url);
    const isHard = searchParams.get("hard") === "true";

    const existing = await findProductById(id);
    if (!existing) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    if (isHard) {
      if (session.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { message: "Access denied. Only Super Admins can permanently wipe product records." },
          { status: 403 }
        );
      }

      await permanentDeleteProduct(id);
      await logAuditEvent({
        action: "PRODUCT_HARD_DELETED",
        entity: "Product",
        entityId: id,
        userId: session.id,
        userEmail: session.email,
        ipAddress: ip,
        details: { productName: existing.name, slug: existing.slug },
      });

      return NextResponse.json({
        success: true,
        message: "Product permanently deleted from database",
      });
    } else {
      await trashProduct(id);
      await logAuditEvent({
        action: "PRODUCT_TRASHED",
        entity: "Product",
        entityId: id,
        userId: session.id,
        userEmail: session.email,
        ipAddress: ip,
        details: { productName: existing.name },
      });

      return NextResponse.json({
        success: true,
        message: "Product moved to trash",
      });
    }
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { message: "Failed to delete product" },
      { status: 500 }
    );
  }
}

