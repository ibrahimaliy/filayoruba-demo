"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Lock,
  Sparkles,
  AlertCircle,
  X,
  ArrowRight,
  Truck,
  ShoppingBag,
} from "lucide-react";
import { Review, RatingBreakdown } from "@/types/product";
import ProductReviewForm from "./ProductReviewForm";
import { toast } from "sonner";

interface ProductReviewsSectionProps {
  productSlug: string;
  productName: string;
  initialReviews: Review[];
  initialRating: number;
}

interface EligibilityState {
  loading: boolean;
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

export default function ProductReviewsSection({
  productSlug,
  productName,
  initialReviews,
  initialRating,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState<boolean>(false);
  const [eligibility, setEligibility] = useState<EligibilityState>({
    loading: true,
    eligible: false,
    message: "Verifying review eligibility...",
  });

  // Calculate review statistics
  const totalReviews = reviews.length;
  const ratingSum = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalReviews > 0 ? Number((ratingSum / totalReviews).toFixed(1)) : initialRating;

  // Check customer review eligibility on mount
  useEffect(() => {
    async function checkEligibility() {
      try {
        const res = await fetch(`/api/products/${productSlug}/reviews/eligibility`);
        const data = await res.json();
        setEligibility({
          loading: false,
          eligible: Boolean(data.eligible),
          reason: data.reason,
          message: data.message || "",
          customer: data.customer,
          orderNumber: data.orderNumber,
          existingReview: data.existingReview,
        });
      } catch {
        setEligibility({
          loading: false,
          eligible: false,
          reason: "NOT_LOGGED_IN",
          message: "Sign in to your account to check review eligibility.",
        });
      }
    }
    checkEligibility();
  }, [productSlug]);

  const handleWriteReviewClick = () => {
    if (showForm) {
      setShowForm(false);
      return;
    }

    if (eligibility.eligible) {
      setShowForm(true);
    } else {
      setShowEligibilityModal(true);
    }
  };

  const handleReviewCreated = (newReview: Review) => {
    setReviews((prev) => [newReview, ...prev]);
    setShowForm(false);
    setEligibility((prev) => ({
      ...prev,
      eligible: false,
      reason: "ALREADY_REVIEWED",
      message: "You have reviewed this product. Thank you for your feedback!",
      existingReview: newReview,
    }));
    toast.success("Thank you! Your verified review has been published.");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[#FED501]">
            <Star className="w-5 h-5 fill-[#FED501]" />
            <span className="text-xl font-bold text-[#000000]">{averageRating.toFixed(1)}</span>
          </div>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="text-xs font-semibold text-slate-600">
            {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </span>
          <span className="text-xs text-slate-400">&bull;</span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Verified Delivered Buyers
          </span>
        </div>

        {/* ALWAYS VISIBLE Write a Review Action Button */}
        <button
          type="button"
          onClick={handleWriteReviewClick}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
        >
          {showForm ? (
            <span>Cancel Review</span>
          ) : eligibility.eligible ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-[#FED501]" />
              <span>Write a Verified Review</span>
            </>
          ) : (
            <>
              <Star className="w-3.5 h-3.5 text-[#FED501]" />
              <span>Write a Review</span>
            </>
          )}
        </button>
      </div>

      {/* Dynamic Eligibility Banner for Eligible Delivered Customer */}
      {!eligibility.loading && eligibility.eligible && !showForm && (
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5 sm:mt-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-900">
                Verified Delivered Order #{eligibility.orderNumber}
              </h4>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Welcome back, {eligibility.customer?.name}. Your cap was delivered! Click &quot;Write a Verified Review&quot; to share your experience with fellow patrons.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Review Now
          </button>
        </div>
      )}

      {/* Dynamic Banner for Customers who already reviewed */}
      {!eligibility.loading && eligibility.reason === "ALREADY_REVIEWED" && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs text-slate-700">
            <span className="font-bold text-[#000000]">Your Review is Published: </span>
            Thank you for reviewing this handcrafted cap! Your verified feedback helps our master weavers and fellow patrons.
          </div>
        </div>
      )}

      {/* Review Form (Inline Drawer) */}
      {showForm && eligibility.customer && (
        <ProductReviewForm
          productSlug={productSlug}
          productName={productName}
          verifiedCustomer={{
            name: eligibility.customer.name,
            email: eligibility.customer.email,
            orderNumber: eligibility.orderNumber,
          }}
          onSuccess={handleReviewCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Reviews List - Visually public to ALL visitors (logged in or not) */}
      <div className="divide-y divide-slate-100">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="py-5 first:pt-0 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#000000]">{review.name}</span>
                  {review.isVerifiedBuyer && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Buyer
                    </span>
                  )}
                </div>

                <time className="text-[11px] text-slate-400">
                  {review.date ||
                    (review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "")}
                </time>
              </div>

              {/* Star Score */}
              <div className="flex items-center gap-1 text-[#FED501]">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < review.rating ? "fill-[#FED501]" : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                {review.title && (
                  <span className="text-xs font-bold text-slate-900 ml-1.5">
                    {review.title}
                  </span>
                )}
              </div>

              {/* Comment */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-0.5">
                {review.comment}
              </p>
            </div>
          ))
        ) : (
          <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-slate-100/80">
            <Sparkles className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No reviews yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Be the first patron to review this handcrafted cap once your order arrives!
            </p>
          </div>
        )}
      </div>

      {/* Eligibility Guidance Modal (Shows when user clicks 'Write a Review' but isn't eligible yet) */}
      {showEligibilityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-sm font-bold text-[#000000]">
                  Verified Delivery Reviews
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEligibilityModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Context Body */}
            {eligibility.reason === "NOT_LOGGED_IN" ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                  <p className="font-semibold text-slate-900 mb-1">
                    Authentic Guild Feedback Policy
                  </p>
                  To preserve authenticity, only patrons who have purchased and received delivery of this cap can submit reviews.
                </div>
                <p className="text-xs text-slate-500">
                  Have you already ordered and received this cap? Sign in with your customer account email to write your verified review.
                </p>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEligibilityModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <Link
                    href={`/account/login?redirect=${encodeURIComponent(`/products/${productSlug}#reviews`)}`}
                    className="px-4 py-2 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <span>Sign In to Review</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#FED501]" />
                  </Link>
                </div>
              </div>
            ) : eligibility.reason === "ORDER_IN_PROGRESS" ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold mb-1 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    Order In Progress (#{eligibility.orderNumber})
                  </p>
                  {eligibility.message}
                </div>
                <p className="text-xs text-slate-500">
                  As soon as your courier marks your cap as delivered, you can return here to submit your verified 5-star review!
                </p>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEligibilityModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Got It
                  </button>
                  {eligibility.orderNumber && (
                    <Link
                      href={`/track-order?order=${encodeURIComponent(eligibility.orderNumber)}`}
                      className="px-4 py-2 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5 text-[#FED501]" />
                      <span>Track Order</span>
                    </Link>
                  )}
                </div>
              </div>
            ) : eligibility.reason === "ALREADY_REVIEWED" ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                  <p className="font-bold mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Review Already Submitted
                  </p>
                  You have already shared your review for this handcrafted cap. Thank you for your feedback!
                </div>
                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowEligibilityModal(false)}
                    className="px-4 py-2 rounded-xl bg-[#000000] text-white text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <p className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#FED501]" />
                    Delivered Patron Guarantee
                  </p>
                  Reviews are reserved for patrons who have purchased and received delivery of this cap. Experience master artisan heritage by ordering yours today!
                </div>
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEligibilityModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEligibilityModal(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-4 py-2 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-[#FED501]" />
                    <span>Order This Cap</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
