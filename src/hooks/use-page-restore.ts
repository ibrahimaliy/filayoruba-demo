"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

/**
 * Resets loading state and dismisses lingering redirect toasts (e.g. Paystack)
 * when a user returns to the page via browser Back button, bfcache restoration, or tab focus.
 */
export function usePageRestore(onRestore: () => void) {
  const onRestoreRef = useRef(onRestore);
  useEffect(() => {
    onRestoreRef.current = onRestore;
  });

  useEffect(() => {
    const handleRestore = () => {
      onRestoreRef.current();
      toast.dismiss();
    };

    // 1. Initial cleanup on mount (in case component mounts after back navigation)
    handleRestore();

    // 2. bfcache / back-forward navigation event
    window.addEventListener("pageshow", handleRestore);

    // 3. Document visibility change (user switches back to this tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleRestore();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handleRestore);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
