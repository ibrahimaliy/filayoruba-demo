"use client";

import { useState } from "react";
import { Star, Loader2, X, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Review, RatingBreakdown } from "@/types/product";

interface ProductReviewFormProps {
  productSlug: string;
  productName: string;
  verifiedCustomer: {
    name: string;
    email: string;
    orderNumber?: string;
  };
  onSuccess: (newReview: Review, updatedBreakdown: RatingBreakdown) => void;
  onCancel: () => void;
}

export default function ProductReviewForm({
  productSlug,
  productName,
  verifiedCustomer,
  onSuccess,
  onCancel,
}: ProductReviewFormProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeRating = hoverRating !== null ? hoverRating : rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 5) {
      setError("Please write a review comment of at least 5 characters.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${productSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: verifiedCustomer.name,
          email: verifiedCustomer.email,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to submit review.");
        setIsLoading(false);
        return;
      }

      onSuccess(data.review, data.breakdown);
    } catch {
      setError("Could not submit review. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 sm:p-7 mb-8 relative animate-in fade-in duration-200 shadow-xs">
      <div className="flex items-center justify-between mb-4 border-b border-slate-200/70 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#000000]">
            Write a Verified Review
          </h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Verified Delivered Buyer
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Close form"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* Verified Patron Identity Badge */}
      <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 mb-4 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#000000] text-[#FED501] font-bold flex items-center justify-center text-xs">
            {verifiedCustomer.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-slate-900 block leading-tight">
              {verifiedCustomer.name}
            </span>
            <span className="text-[11px] text-slate-500">
              {verifiedCustomer.email}
            </span>
          </div>
        </div>
        {verifiedCustomer.orderNumber && (
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Order #{verifiedCustomer.orderNumber}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Stars */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Your Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-1 cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                aria-label={`Rate ${star} star`}
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= activeRating
                      ? "fill-[#FED501] text-[#FED501]"
                      : "text-slate-200"
                  }`}
                />
              </button>
            ))}
            <span className="text-xs font-bold text-slate-700 ml-2">
              {activeRating} {activeRating === 1 ? "Star" : "Stars"}
            </span>
          </div>
        </div>

        {/* Review Title */}
        <div>
          <label htmlFor="review-title" className="block text-xs font-semibold text-slate-700 mb-1">
            Review Title <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            id="review-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Masterpiece craft, fits perfectly for the wedding!"
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#000000]"
          />
        </div>

        {/* Review Comment */}
        <div>
          <label htmlFor="reviewer-comment" className="block text-xs font-semibold text-slate-700 mb-1">
            Your Review Experience <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reviewer-comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Tell other patrons about the fabric weave, fit, and artisan details of ${productName}...`}
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#000000] leading-relaxed"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/70">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Submit Verified Review</span>
          </button>
        </div>
      </form>
    </div>
  );
}
