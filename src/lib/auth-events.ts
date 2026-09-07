/**
 * Client-side Authentication Event Bus
 * Dispatches and listens for authentication changes (login, logout, session expiration)
 * so that persistent UI components like Navbar and layout shells update immediately without page refresh.
 */

import { useCheckoutStore } from "@/store/checkout-store";

export const AUTH_CHANGED_EVENT = "filayoruba:auth-changed";

export function notifyAuthChange(detail?: Record<string, any>) {
  if (typeof window !== "undefined") {
    if (detail?.loggedOut) {
      useCheckoutStore.getState().clearCheckout();
    }
    window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail }));
  }
}

export function subscribeAuthChange(callback: (e?: CustomEvent) => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (e: Event) => callback(e as CustomEvent);
  window.addEventListener(AUTH_CHANGED_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
