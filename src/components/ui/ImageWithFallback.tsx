"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import ImageFallbackCard, { ImageFallbackCardProps } from "./ImageFallbackCard";

export interface ImageWithFallbackProps extends Omit<ImageProps, "onError" | "src"> {
  src?: ImageProps["src"] | null | undefined;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  fallbackBadge?: string;
  fallbackIcon?: ImageFallbackCardProps["icon"];
  fallbackVariant?: ImageFallbackCardProps["variant"];
  fallbackClassName?: string;
  onImageError?: () => void;
}

export default function ImageWithFallback({
  src,
  alt,
  fallbackTitle,
  fallbackSubtitle,
  fallbackBadge,
  fallbackIcon,
  fallbackVariant = "fill",
  fallbackClassName = "",
  onImageError,
  className = "",
  ...props
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state if the src prop changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const isEmptySrc = !src || (typeof src === "string" && src.trim() === "");

  if (isEmptySrc || hasError) {
    return (
      <ImageFallbackCard
        title={fallbackTitle || alt}
        subtitle={fallbackSubtitle}
        badge={fallbackBadge}
        icon={fallbackIcon}
        variant={fallbackVariant}
        className={fallbackClassName || className}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt || "Fìlà Yorùbá Cap"}
      className={className}
      onError={() => {
        setHasError(true);
        onImageError?.();
      }}
      {...props}
    />
  );
}
