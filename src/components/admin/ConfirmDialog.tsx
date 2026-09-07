"use client";

import { AlertTriangle, Trash2, RotateCcw, Check, RefreshCw, X } from "lucide-react";

export type ConfirmDialogVariant = "danger" | "warning" | "info" | "success";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
  itemCount?: number;
  highlightText?: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  itemCount,
  highlightText,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <Trash2 className="w-6 h-6 text-red-600" />,
      iconBg: "bg-red-50 border-red-100",
      confirmBtn: "bg-red-600 hover:bg-red-700 text-white shadow-red-200",
      accentBadge: "bg-red-50 text-red-700 border-red-200",
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
      iconBg: "bg-amber-50 border-amber-100",
      confirmBtn: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200",
      accentBadge: "bg-amber-50 text-amber-700 border-amber-200",
    },
    info: {
      icon: <RotateCcw className="w-6 h-6 text-[#000000]" />,
      iconBg: "bg-slate-100 border-slate-200",
      confirmBtn: "bg-[#000000] hover:bg-[#1A1A1A] text-white shadow-slate-200",
      accentBadge: "bg-slate-100 text-[#000000] border-slate-200",
    },
    success: {
      icon: <Check className="w-6 h-6 text-emerald-600" />,
      iconBg: "bg-emerald-50 border-emerald-100",
      confirmBtn: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200",
      accentBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  }[variant];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 border border-slate-200 shadow-2xl relative animate-scale-up">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 sm:gap-4">
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border flex-shrink-0 ${variantStyles.iconBg}`}
          >
            {variantStyles.icon}
          </div>

          <div className="flex-1 pr-4">
            <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 leading-snug">
              {title}
            </h3>
            {highlightText && (
              <div className="mt-1">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${variantStyles.accentBadge}`}
                >
                  {highlightText}
                </span>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {itemCount !== undefined && itemCount > 1 && (
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 flex items-center justify-between">
            <span className="font-medium">Total items affected:</span>
            <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              {itemCount} items
            </span>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 text-center cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer ${variantStyles.confirmBtn}`}
          >
            {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
