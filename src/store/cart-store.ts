import { create } from "zustand";
import { persist } from "zustand/middleware";

import { Product } from "@/types/product";
import { CartItem } from "@/types/cart";

interface CartStore {
  items: CartItem[];

  addToCart: (
    product: Product,
    size: string
  ) => void;

  removeFromCart: (
    productId: string,
    size: string
  ) => void;

  updateQuantity: (
    productId: string,
    size: string,
    quantity: number
  ) => void;

  toggleItemSelection: (
    productId: string,
    size: string
  ) => void;

  setItemSelection: (
    productId: string,
    size: string,
    selected: boolean
  ) => void;

  selectAll: (selected: boolean) => void;

  clearCart: () => void;

  clearSelectedItems: () => void;

  clearPurchasedItems: (
    purchasedItems?: Array<{ productId?: string; id?: string; size?: string; selectedSize?: string }>
  ) => void;

  totalItems: () => number;

  totalPrice: () => number;

  selectedItems: () => CartItem[];

  selectedTotalItems: () => number;

  selectedTotalPrice: () => number;

  isAllSelected: () => boolean;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addToCart: (product, size) => {
        const items = get().items;

        const existing = items.find(
          (item) =>
            item.product.id === product.id &&
            item.selectedSize === size
        );

        if (existing) {
          set({
            items: items.map((item) =>
              item.product.id === product.id &&
              item.selectedSize === size
                ? {
                    ...item,
                    quantity: item.quantity + 1,
                    selected: true,
                  }
                : item
            ),
          });

          return;
        }

        set({
          items: [
            ...items,
            {
              product,
              quantity: 1,
              selectedSize: size,
              selected: true,
            },
          ],
        });
      },

      removeFromCart: (productId, size) =>
        set({
          items: get().items.filter(
            (item) =>
              !(
                item.product.id === productId &&
                item.selectedSize === size
              )
          ),
        }),

      updateQuantity: (
        productId,
        size,
        quantity
      ) =>
        set({
          items: get().items.map((item) =>
            item.product.id === productId &&
            item.selectedSize === size
              ? {
                  ...item,
                  quantity,
                }
              : item
          ),
        }),

      toggleItemSelection: (productId, size) =>
        set({
          items: get().items.map((item) =>
            item.product.id === productId && item.selectedSize === size
              ? {
                  ...item,
                  selected: item.selected === false ? true : false,
                }
              : item
          ),
        }),

      setItemSelection: (productId, size, selected) =>
        set({
          items: get().items.map((item) =>
            item.product.id === productId && item.selectedSize === size
              ? {
                  ...item,
                  selected,
                }
              : item
          ),
        }),

      selectAll: (selected) =>
        set({
          items: get().items.map((item) => ({
            ...item,
            selected,
          })),
        }),

      clearCart: () => {
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("filayoruba-cart");
          } catch {}
        }
        set({ items: [] });
      },

      clearSelectedItems: () => {
        const currentItems = get().items;
        const remaining = currentItems.filter((item) => item.selected === false);
        if (typeof window !== "undefined") {
          try {
            if (remaining.length === 0) {
              localStorage.removeItem("filayoruba-cart");
            } else {
              localStorage.setItem(
                "filayoruba-cart",
                JSON.stringify({
                  state: { items: remaining },
                  version: 0,
                })
              );
            }
          } catch {}
        }
        set({ items: remaining });
      },

      clearPurchasedItems: (purchasedItems) => {
        const currentItems = get().items;
        if (!purchasedItems || purchasedItems.length === 0) {
          const remaining = currentItems.filter((item) => item.selected === false);
          if (typeof window !== "undefined") {
            try {
              if (remaining.length === 0) {
                localStorage.removeItem("filayoruba-cart");
              } else {
                localStorage.setItem(
                  "filayoruba-cart",
                  JSON.stringify({
                    state: { items: remaining },
                    version: 0,
                  })
                );
              }
            } catch {}
          }
          set({ items: remaining });
          return;
        }

        const remaining = currentItems.filter((item) => {
          const wasPurchased = purchasedItems.some((p) => {
            const matchId = (p.productId || p.id) === item.product.id;
            const matchSize =
              !p.selectedSize && !p.size
                ? true
                : (p.selectedSize || p.size) === item.selectedSize;
            return matchId && matchSize;
          });
          return !wasPurchased;
        });

        if (typeof window !== "undefined") {
          try {
            if (remaining.length === 0) {
              localStorage.removeItem("filayoruba-cart");
            } else {
              localStorage.setItem(
                "filayoruba-cart",
                JSON.stringify({
                  state: { items: remaining },
                  version: 0,
                })
              );
            }
          } catch {}
        }
        set({ items: remaining });
      },

      totalItems: () =>
        get().items.reduce(
          (total, item) => total + item.quantity,
          0
        ),

      totalPrice: () =>
        get().items.reduce(
          (total, item) =>
            total + item.product.price * item.quantity,
          0
        ),

      selectedItems: () =>
        get().items.filter((item) => item.selected !== false),

      selectedTotalItems: () =>
        get()
          .items.filter((item) => item.selected !== false)
          .reduce((total, item) => total + item.quantity, 0),

      selectedTotalPrice: () =>
        get()
          .items.filter((item) => item.selected !== false)
          .reduce(
            (total, item) =>
              total + item.product.price * item.quantity,
            0
          ),

      isAllSelected: () => {
        const items = get().items;
        if (items.length === 0) return false;
        return items.every((item) => item.selected !== false);
      },
    }),
    {
      name: "filayoruba-cart",
      merge: (persistedState: any, currentState) => {
        if (typeof window !== "undefined" && !localStorage.getItem("filayoruba-cart")) {
          return {
            ...currentState,
            items: [],
          };
        }
        return {
          ...currentState,
          ...persistedState,
        };
      },
    }
  )
);