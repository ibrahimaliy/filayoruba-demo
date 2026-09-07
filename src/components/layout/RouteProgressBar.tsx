"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Settle progress bar whenever route successfully completes
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept internal link clicks to immediately trigger progress feedback
  useEffect(() => {
    const handleLinkClick = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      const targetAttr = target.getAttribute("target");

      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("tel:") ||
        href.startsWith("mailto:") ||
        targetAttr === "_blank" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      // Check if it's an internal link
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin === window.location.origin) {
          const currentUrl = new URL(window.location.href);
          // If navigating to a different URL/path
          if (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search) {
            setIsNavigating(true);
            setProgress(25);
            // Simulate progression
            setTimeout(() => setProgress(65), 150);
            setTimeout(() => setProgress(85), 400);
          }
        }
      } catch {
        // Ignore invalid URLs
      }
    };

    const handlePopState = () => {
      setIsNavigating(true);
      setProgress(40);
      setTimeout(() => setProgress(80), 150);
    };

    const handlePageShow = () => {
      setIsNavigating(false);
      setProgress(0);
    };

    document.addEventListener("click", handleLinkClick, { capture: true });
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("click", handleLinkClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  if (!isNavigating && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[999999] pointer-events-none h-1 overflow-hidden"
    >
      <div
        className="h-full bg-gradient-to-r from-[#FED501] via-[#FFE066] to-[#FED501] shadow-[0_0_12px_#FED501] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transition: progress === 100 ? "width 150ms ease-out, opacity 300ms ease-out 100ms" : "width 300ms ease-out",
        }}
      />
    </div>
  );
}
