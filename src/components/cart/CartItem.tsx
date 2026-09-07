"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { CartItem as CartItemType } from "@/types/cart";
import { useCartStore } from "@/store/cart-store";
import { formatSizeLabel } from "@/lib/sizing";
import { cn } from "@/lib/utils";
import ShareProductButton from "@/components/share/ShareProductButton";

interface Props {
  item: CartItemType;
}

export default function CartItem({ item }: Props) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const toggleItemSelection = useCartStore((state) => state.toggleItemSelection);

  const isSelected = item.selected !== false;

  const decrease = () => {
    if (item.quantity <= 1) {
      removeFromCart(item.product.id, item.selectedSize);
      return;
    }
    updateQuantity(item.product.id, item.selectedSize, item.quantity - 1);
  };

  const increase = () => {
    updateQuantity(item.product.id, item.selectedSize, item.quantity + 1);
  };

  const image = item.product.images?.[0] || "";

  return (
    <div
      className={cn(
        "border rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center justify-between transition-all",
        isSelected
          ? "bg-white border-[#E8E1D5]"
          : "bg-slate-50/70 border-dashed border-slate-300 opacity-65"
      )}
    >
      <div className="flex gap-3 sm:gap-4 items-center w-full sm:w-auto">
        {/* Selection Checkbox */}
        <label
          className="flex items-center cursor-pointer select-none p-1 -m-1 shrink-0"
          title={isSelected ? "Exclude from checkout" : "Include in checkout"}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleItemSelection(item.product.id, item.selectedSize)}
            aria-label={`Select ${item.product.name} for checkout`}
            className="w-4 h-4 rounded-md accent-[#000000] cursor-pointer"
          />
        </label>

        {/* Thumbnail */}
        <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-900 border border-slate-100">
          <ImageWithFallback
            src={image}
            alt={item.product.name}
            fill
            sizes="96px"
            className="object-cover"
            fallbackTitle={item.product.name}
            fallbackVariant="sm"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="font-serif font-bold text-sm sm:text-base text-[#000000] truncate">
            {item.product.name}
          </h3>

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-[#000000]/5 font-bold text-[#000000]">
              Size: {formatSizeLabel(item.selectedSize)}
            </span>
            {!isSelected && (
              <span className="text-[11px] text-slate-500 font-medium italic">
                Saved for later
              </span>
            )}
          </div>

          <p className="font-extrabold text-sm sm:text-base text-[#000000] pt-0.5">
            ₦{(item.product.price * item.quantity).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
          <button
            type="button"
            onClick={decrease}
            aria-label="Decrease quantity"
            className="p-1.5 sm:p-2 hover:bg-slate-200 text-slate-700 rounded-l-xl transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <span className="px-3 text-xs font-bold text-[#000000]">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={increase}
            aria-label="Increase quantity"
            className="p-1.5 sm:p-2 hover:bg-slate-200 text-slate-700 rounded-r-xl transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <ShareProductButton
            product={item.product}
            selectedSize={item.selectedSize}
            variant="cart-row"
            buttonText="Share"
          />

          <div className="h-4 w-px bg-slate-200 hidden sm:block" aria-hidden="true" />

          <button
            type="button"
            onClick={() => removeFromCart(item.product.id, item.selectedSize)}
            className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
            aria-label={`Remove ${item.product.name} from cart`}
            title="Remove from cart"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
