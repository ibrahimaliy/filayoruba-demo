import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistStore {
  productIds: string[];

  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      productIds: [],

      addToWishlist: (productId) =>
        set((state) => {
          if (state.productIds.includes(productId)) {
            return state;
          }

          return {
            productIds: [...state.productIds, productId],
          };
        }),

      removeFromWishlist: (productId) =>
        set((state) => ({
          productIds: state.productIds.filter(
            (id) => id !== productId
          ),
        })),

      toggleWishlist: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),

      isInWishlist: (productId) =>
        get().productIds.includes(productId),

      clearWishlist: () => set({ productIds: [] }),
    }),
    {
      name: "filayoruba-wishlist",
    }
  )
);