import { create } from "zustand";
import { persist } from "zustand/middleware";

import { CustomerInfo, ShippingAddress } from "@/types/checkout";

interface CheckoutStore {
  customerInfo: CustomerInfo;

  shippingAddress: ShippingAddress;

  shippingZoneId: string;

  shippingCost: number;

  currentStep: number;

  pendingOrderId: string | null;

  setStep: (step: number) => void;

  nextStep: () => void;

  previousStep: () => void;

  setCustomerInfo: (data: CustomerInfo) => void;

  setShippingAddress: (data: ShippingAddress) => void;

  setShippingZone: (id: string, cost: number) => void;

  setPendingOrderId: (id: string | null) => void;

  clearCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutStore>()(
  persist(
    (set) => ({
      customerInfo: {
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
      },

      shippingAddress: {
        address: "",
        city: "",
        state: "",
      },

      shippingZoneId: "",

      shippingCost: 0,

      currentStep: 1,

      pendingOrderId: null,

      setPendingOrderId: (id) =>
        set({
          pendingOrderId: id,
        }),

      setCustomerInfo: (data) =>
        set({
          customerInfo: data,
        }),

      setShippingAddress: (data) =>
        set({
          shippingAddress: data,
        }),

      setShippingZone: (id, cost) =>
        set({
          shippingZoneId: id,

          shippingCost: cost,
        }),

      setStep: (step) =>
        set({
          currentStep: step,
        }),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(4, state.currentStep + 1),
        })),

      previousStep: () =>
        set((state) => ({
          currentStep: Math.max(1, state.currentStep - 1),
        })),

      clearCheckout: () => {
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("filayoruba-checkout");
          } catch {}
        }
        set({
          customerInfo: {
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
          },

          shippingAddress: {
            address: "",
            city: "",
            state: "",
          },

          shippingZoneId: "",

          shippingCost: 0,

          currentStep: 1,

          pendingOrderId: null,
        });
      },
    }),
    {
      name: "filayoruba-checkout",
      partialize: (state) => ({
        customerInfo: state.customerInfo,
        shippingAddress: state.shippingAddress,
        shippingZoneId: state.shippingZoneId,
        shippingCost: state.shippingCost,
        pendingOrderId: state.pendingOrderId,
      }),
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        currentStep: 1, // Always enforce step 1 on page reload or new session
      }),
    },
  ),
);
