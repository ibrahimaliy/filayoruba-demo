import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Optimizes Cloudinary & Unsplash media URLs with edge CDN transforms (dynamic sizing, webp/avif auto format, quality compression)
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options?: { width?: number; height?: number; quality?: "auto" | number }
): string {
  if (!url) return "";

  // Cloudinary image URL transformation
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    const transforms: string[] = ["f_auto"];
    transforms.push(options?.quality ? `q_${options.quality}` : "q_auto");
    if (options?.width) transforms.push(`w_${options.width}`);
    if (options?.height) transforms.push(`h_${options.height}`);
    if (options?.width && options?.height) transforms.push("c_fill");

    const transformString = transforms.join(",");
    // Avoid duplicate transform injection
    if (!url.includes(`/upload/${transformString}/`)) {
      return url.replace("/upload/", `/upload/${transformString}/`);
    }
    return url;
  }

  // Unsplash image URL transformation
  if (url.includes("images.unsplash.com")) {
    const parsed = new URL(url);
    parsed.searchParams.set("auto", "format");
    parsed.searchParams.set("fit", "crop");
    if (options?.width) parsed.searchParams.set("w", options.width.toString());
    if (options?.height) parsed.searchParams.set("h", options.height.toString());
    if (options?.quality && typeof options.quality === "number") {
      parsed.searchParams.set("q", options.quality.toString());
    } else {
      parsed.searchParams.set("q", "80");
    }
    return parsed.toString();
  }

  return url;
}
