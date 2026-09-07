"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";

import { useWishlistStore } from "@/store/wishlist-store";

interface WishlistButtonProps {
  productId: string;
  size?: number;
}

export default function WishlistButton({
  productId,
  size = 18,
}: WishlistButtonProps) {
  const isInWishlist = useWishlistStore((state) =>
    state.isInWishlist(productId)
  );

  const toggleWishlist = useWishlistStore(
    (state) => state.toggleWishlist
  );

  const handleToggle = () => {
    toggleWishlist(productId);

    toast.success(
      isInWishlist
        ? "Removed from wishlist"
        : "Added to wishlist"
    );
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={
        isInWishlist
          ? "Remove from wishlist"
          : "Add to wishlist"
      }
      aria-pressed={isInWishlist}
      className="rounded-full bg-white p-2.5 shadow-sm transition-all hover:scale-105"
    >
      <Heart
        size={size}
        className={
          isInWishlist
            ? "fill-[#000000] text-[#000000]"
            : "text-[#000000]"
        }
      />
    </button>
  );
}