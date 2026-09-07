import { NextResponse } from "next/server";
import { getCustomerFromRequest } from "@/server/customer-auth";
import { checkReviewEligibility } from "@/server/services/review.service";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const customer = await getCustomerFromRequest(req);

    if (!customer) {
      return NextResponse.json({
        eligible: false,
        reason: "NOT_LOGGED_IN",
        message: "Please sign in to leave a verified review for this cap.",
      });
    }

    const email = customer.email || undefined;
    const fullName = `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || (email ? email.split("@")[0] : "Valued Patron");
    const eligibility = await checkReviewEligibility(slug, email, fullName);

    return NextResponse.json(eligibility);
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    return NextResponse.json(
      {
        eligible: false,
        message: error instanceof Error ? error.message : "Failed to verify review eligibility",
      },
      { status: 400 }
    );
  }
}
