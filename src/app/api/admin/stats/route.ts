import { NextResponse } from "next/server";
import { getOrderMetrics, listAllOrders } from "@/server/services/order.service";
import { listProducts } from "@/server/services/product.service";
import { listCustomerDirectory } from "@/server/services/customer.service";
import { listCollections } from "@/server/services/collection.service";
import { getAdminSession } from "@/server/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    const metrics = await getOrderMetrics().catch(() => ({
      totalRevenue: 0,
      totalOrders: 0,
      paidOrders: 0,
      pendingOrders: 0,
      craftingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      averageOrderValue: 0,
    }));

    const orders = await listAllOrders().catch(() => []);
    const products = await listProducts().catch(() => []);
    const customerData = await listCustomerDirectory().catch(() => ({
      customers: [],
      metrics: { totalCustomers: 0, vipCount: 0, totalRevenue: 0, averageLtv: 0 },
    }));
    const collections = await listCollections().catch(() => []);

    const lowStockProducts = products.filter((p) => p.stock <= 5);

    return NextResponse.json(
      {
        metrics,
        orders,
        products,
        customers: customerData.customers || [],
        customerMetrics: customerData.metrics,
        collections,
        totalProducts: products.length,
        lowStockCount: lowStockProducts.length,
        lowStockProducts,
        recentOrders: orders.slice(0, 8),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { message: "Failed to fetch admin metrics." },
      { status: 500 }
    );
  }
}
