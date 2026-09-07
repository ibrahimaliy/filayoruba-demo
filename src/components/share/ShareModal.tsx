"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Check, Sparkles } from "lucide-react";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824zm-3.392-10.416c-4.28 0-7.763 3.482-7.764 7.764 0 1.37.358 2.709 1.039 3.89l-1.106 4.04 4.137-1.085c1.139.621 2.427.95 3.694.95 4.281 0 7.765-3.483 7.765-7.765 0-4.281-3.484-7.765-7.765-7.765zm0 14.073c-1.172 0-2.32-.315-3.321-.912l-.238-.142-2.468.647.658-2.406-.155-.247c-.655-1.042-1.001-2.247-1.001-3.481 0-3.479 2.831-6.31 6.314-6.31 3.482 0 6.314 2.831 6.314 6.31 0 3.479-2.832 6.31-6.314 6.31z"/>
    </svg>
  );
}

export interface SharePreviewData {
  image?: string;
  name: string;
  details?: string;
  price?: number;
}

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  shareUrl: string;
  shareText: string;
  preview?: SharePreviewData;
}

export default function ShareModal({
  isOpen,
  onClose,
  title,
  subtitle,
  shareUrl,
  shareText,
  preview,
}: ShareModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background body scroll when open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  // Guarantee absolute URL for sharing external links
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const resolvedUrl =
    shareUrl.startsWith("http://") || shareUrl.startsWith("https://")
      ? shareUrl
      : `${origin}${shareUrl.startsWith("/") ? "" : "/"}${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(resolvedUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!", {
        description: "You can now paste and share it anywhere.",
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const handleWhatsAppShare = () => {
    const text = `${shareText}\n\n${resolvedUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 select-none animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity cursor-pointer"
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        className="relative w-full max-w-md rounded-3xl border border-[#FED501]/40 bg-[#FAF9F6] p-6 sm:p-7 shadow-2xl z-10 space-y-5 animate-scale-in text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#B8860B]">
              <Sparkles className="w-3.5 h-3.5 text-[#FED501] fill-[#FED501]" />
              <span>Yorùbá Heritage Curation</span>
            </div>
            <h3
              id="share-modal-title"
              className="font-serif text-xl sm:text-2xl font-bold text-[#000000] tracking-tight"
            >
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-600 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer shrink-0"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Card */}
        {preview && (
          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-white border border-[#E8E1D5] shadow-xs">
            {preview.image && (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200">
                <ImageWithFallback
                  src={preview.image}
                  alt={preview.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                  fallbackTitle={preview.name}
                  fallbackVariant="sm"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-0.5">
              <h4 className="font-serif font-bold text-sm text-[#000000] truncate">
                {preview.name}
              </h4>
              {preview.details && (
                <p className="text-xs text-slate-500 truncate font-medium">
                  {preview.details}
                </p>
              )}
              {typeof preview.price === "number" && (
                <p className="font-extrabold text-sm text-[#000000] pt-0.5">
                  ₦{preview.price.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* WhatsApp Primary Action */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-sm transition-all shadow-md shadow-[#25D366]/20 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <WhatsAppIcon className="w-5 h-5 text-white shrink-0" />
            <span>Share to WhatsApp</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-[#FAF9F6] px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            or copy direct link
          </span>
        </div>

        {/* Direct Link Field */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={resolvedUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 select-all truncate focus:outline-none focus:border-[#FED501] shadow-2xs"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm",
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-[#000000] hover:bg-[#1A1A1A] text-white hover:text-[#FED501]"
              )}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
