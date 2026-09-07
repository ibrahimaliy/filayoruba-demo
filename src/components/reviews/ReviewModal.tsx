"use client";

import { useState } from "react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { Star, X, Loader2, ShieldCheck, CheckCircle2, Sparkles } from "lucide-react";
import { Review } from "@/types/product";
import { toast } from "sonner";

export interface ReviewModalProduct {
  name: string;
  slug: string;
  image?: string;
  price?: number;
  size?: string;
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ReviewModalProduct | null;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  onSuccess?: (newReview: Review) => void;
}

const RATING_DESCRIPTIONS: Record<number, string> = {
  5: "Exceptional Royal Craftsmanship (5/5)",
  4: "Very Good Fit & Fabric Weave (4/5)",
  3: "Decent Fit & Quality (3/5)",
  2: "Needs Craft Improvement (2/5)",
  1: "Disappointed with Order (1/5)",
};

export default function ReviewModal({
  isOpen,
  onClose,
  product,
  orderNumber,
  customerName,
  customerEmail,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const activeRating = hoverRating !== null ? hoverRating : rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || comment.trim().length < 5) {
      setError("Please write a review comment with at least 5 characters.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${product.slug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customerName,
          email: customerEmail,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to submit review.");
        setIsSubmitting(false);
        return;
      }

      toast.success(`Thank you! Your verified review for "${product.name}" has been published.`);
      if (onSuccess && data.review) {
        onSuccess(data.review);
      }
      onClose();
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-[#FED501]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#000000]">
                Review Delivered Cap
              </h3>
              <p className="text-[11px] text-slate-500">
                Share your authentic feedback on fitting, fabric, and handcraft
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Cap Product Preview */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0">
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                fallbackTitle={product.name}
                fallbackVariant="sm"
              />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {product.name}
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {product.size ? `Size: ${product.size}" • ` : ""}
                {orderNumber ? `Order #${orderNumber}` : "Delivered"}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Delivered Buyer
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Rating Stars */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
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
                    className={`w-7 h-7 ${
                      star <= activeRating
                        ? "fill-[#FED501] text-[#FED501]"
                        : "text-slate-200"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-[11px] font-semibold text-amber-800 mt-1 block">
              {RATING_DESCRIPTIONS[activeRating] || `${activeRating} Stars`}
            </span>
          </div>

          {/* Review Title */}
          <div>
            <label htmlFor="review-title" className="block font-semibold text-slate-700 mb-1">
              Review Headline <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              id="review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Royal fitting, holds crease perfectly throughout the party!"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#000000]"
            />
          </div>

          {/* Review Comment */}
          <div>
            <label htmlFor="review-comment" className="block font-semibold text-slate-700 mb-1">
              Your Experience & Artisan Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`How does the cap fit on your crown? How is the Aṣọ Òkè fabric sheen and embroidery?`}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#000000] leading-relaxed"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#000000] hover:bg-[#1A1A1A] text-white font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Publish Verified Review</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
