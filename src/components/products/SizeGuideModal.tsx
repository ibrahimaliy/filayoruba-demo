"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Ruler,
  Check,
  MoveHorizontal,
  Compass,
  SlidersHorizontal,
  X,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { FILA_SIZES, MEASUREMENT_STEPS, FilaSizeInfo } from "@/data/sizing";
import { recommendSize, getSizeInfo } from "@/lib/sizing";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SizeGuideModalProps {
  currentSize?: string;
  availableSizes?: string[];
  onSelectSize?: (size: string) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function SizeGuideModal({
  currentSize,
  availableSizes,
  onSelectSize,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: SizeGuideModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

  const [activeTab, setActiveTab] = useState<"calculator" | "guide">("calculator");
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const [measurement, setMeasurement] = useState<number>(() => {
    if (currentSize) {
      const info = getSizeInfo(currentSize);
      if (info?.inches) return info.inches;
    }
    return 23.0;
  });

  // Keep slider measurement aligned when modal opens or currentSize changes
  useEffect(() => {
    if (isOpen && currentSize) {
      const info = getSizeInfo(currentSize);
      if (info?.inches) {
        setMeasurement(unit === "cm" && info.cm ? info.cm : info.inches);
      }
    }
  }, [isOpen, currentSize, unit]);

  const recommendation = recommendSize(measurement, unit);

  const isSizeAvailable = (sizeKey: string): boolean => {
    if (!availableSizes || availableSizes.length === 0) return true;
    const cleanKey = sizeKey.trim().toUpperCase();
    return availableSizes.some((s) => {
      const info = getSizeInfo(s);
      return (
        s.trim().toUpperCase() === cleanKey ||
        (info && info.size.toUpperCase() === cleanKey)
      );
    });
  };

  const handleApplySize = (sizeKey: string) => {
    if (!isSizeAvailable(sizeKey)) {
      toast.error(`Size ${sizeKey} Unavailable`, {
        description: `Size ${sizeKey} has not been added for this cap by the admin. Please choose an available size.`,
      });
      return;
    }
    if (onSelectSize) {
      onSelectSize(sizeKey);
    }
    setOpen(false);
  };

  const handleUnitToggle = (newUnit: "in" | "cm") => {
    if (newUnit === unit) return;
    setUnit(newUnit);
    if (newUnit === "cm") {
      setMeasurement(Number((measurement * 2.54).toFixed(1)));
    } else {
      setMeasurement(Number((measurement / 2.54).toFixed(1)));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        trigger !== null ? <DialogTrigger render={trigger as React.ReactElement} /> : null
      ) : (
        !isControlled && (
          <DialogTrigger render={
            <button
              type="button"
              className="text-xs font-semibold text-[#000000] hover:text-[#FED501] transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Ruler className="w-3.5 h-3.5" />
              <span className="underline underline-offset-4">Size Guide</span>
            </button>
          } />
        )
      )}

      {/* Clean, Lightweight, Mobile-Optimized Dialog */}
      <DialogContent
        showCloseButton={false}
        className="w-[95vw] max-w-2xl max-h-[90vh] overflow-hidden p-0 rounded-2xl bg-white border border-slate-200 text-[#000000] shadow-2xl flex flex-col"
      >
        {/* Clean Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold font-serif text-[#000000]">
              Fìlà Yorùbá Size Guide
            </h2>
            <p className="text-[11px] text-slate-500">
              Find your ideal cap size by head circumference
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Unit Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleUnitToggle("in")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                  unit === "in"
                    ? "bg-white text-[#000000] shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Inches (″)
              </button>
              <button
                type="button"
                onClick={() => handleUnitToggle("cm")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] ${
                  unit === "cm"
                    ? "bg-white text-[#000000] shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                CM
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clean Segmented Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-50 border-b border-slate-100 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("calculator")}
            className={`py-2 text-center rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "calculator"
                ? "bg-white text-[#000000] shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#FED501]" />
            <span>Size Finder & Chart</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("guide")}
            className={`py-2 text-center rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "guide"
                ? "bg-white text-[#000000] shadow-xs font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#FED501]" />
            <span>How to Measure (4 Steps)</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs">
          {activeTab === "calculator" && (
            <div className="space-y-4">
              {/* Fast & Clean Fit Finder */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">
                    Your Head Circumference:
                  </span>
                  <span className="font-mono font-bold text-sm text-[#000000] bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs">
                    {measurement.toFixed(1)} {unit === "in" ? "inches" : "cm"}
                  </span>
                </div>

                <input
                  type="range"
                  min={unit === "in" ? 21.5 : 54.5}
                  max={unit === "in" ? 25.5 : 64.8}
                  step={unit === "in" ? 0.1 : 0.2}
                  value={measurement}
                  onChange={(e) => setMeasurement(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#000000]"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>22.0″ (XS)</span>
                  <span>23.0″ (M)</span>
                  <span>24.0″ (XL)</span>
                  <span>25.0″ (3XL)</span>
                </div>

                {/* Instant Clean Recommendation Box */}
                <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-slate-500">Recommended Size:</div>
                    <div className="text-sm font-bold text-[#000000] flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span>Size {recommendation.recommended.size}</span>
                      <span className="text-slate-400 font-normal text-xs">
                        ({recommendation.recommended.inches}″ / {recommendation.recommended.cm} cm)
                      </span>
                      {!isSizeAvailable(recommendation.recommended.size) && (
                        <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>Not in stock for this cap</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {onSelectSize && (
                    <button
                      type="button"
                      disabled={!isSizeAvailable(recommendation.recommended.size)}
                      onClick={() => {
                        if (isSizeAvailable(recommendation.recommended.size)) {
                          handleApplySize(recommendation.recommended.size);
                        } else {
                          toast.error(`Size ${recommendation.recommended.size} Unavailable`, {
                            description: `Size ${recommendation.recommended.size} has not been added for this cap by the admin.`,
                          });
                        }
                      }}
                      className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs ${
                        isSizeAvailable(recommendation.recommended.size)
                          ? "bg-[#000000] hover:bg-[#1A1A1A] text-white cursor-pointer"
                          : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                      }`}
                    >
                      {isSizeAvailable(recommendation.recommended.size) ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Select Size {recommendation.recommended.size}</span>
                        </>
                      ) : (
                        <span>Unavailable for This Cap</span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Clean Size Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-3.5 py-2.5">Size</th>
                      <th className="px-3.5 py-2.5 text-center">Inches</th>
                      <th className="px-3.5 py-2.5 text-center">CM</th>
                      <th className="px-3.5 py-2.5 text-left hidden sm:table-cell">Fit Profile</th>
                      <th className="px-3.5 py-2.5 text-right">Select</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {FILA_SIZES.map((item: FilaSizeInfo) => {
                      const isRecommended = recommendation.recommended.size === item.size;
                      const isCurrent = currentSize === item.size || currentSize === `${item.inches}`;
                      const isAvailable = isSizeAvailable(item.size);

                      return (
                        <tr
                          key={item.size}
                          className={`transition-colors ${
                            !isAvailable
                              ? "opacity-55 bg-slate-50/70"
                              : isRecommended
                              ? "bg-[#FED501]/15 font-semibold"
                              : isCurrent
                              ? "bg-slate-50"
                              : "hover:bg-slate-50/50"
                          }`}
                        >
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-bold ${isAvailable ? "text-[#000000]" : "text-slate-400 line-through"}`}>
                                {item.size}
                              </span>
                              {item.isFlexible && (
                                <span className="text-[10px] text-slate-500 font-medium">(Free)</span>
                              )}
                              {isRecommended && isAvailable && (
                                <span className="text-[10px] text-[#000000] bg-[#FED501] px-1.5 py-0.5 rounded font-bold">
                                  Fit
                                </span>
                              )}
                              {!isAvailable && (
                                <span className="text-[9px] text-rose-700 bg-rose-50 border border-rose-200/60 px-1.5 py-0.5 rounded font-bold">
                                  Unavailable
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-3.5 py-2.5 text-center font-mono">
                            {item.isFlexible ? (
                              <MoveHorizontal className="w-3.5 h-3.5 mx-auto text-slate-400" />
                            ) : (
                              `${item.inches?.toFixed(1)}″`
                            )}
                          </td>

                          <td className="px-3.5 py-2.5 text-center font-mono text-slate-500">
                            {item.isFlexible ? (
                              <MoveHorizontal className="w-3.5 h-3.5 mx-auto text-slate-400" />
                            ) : (
                              `${item.cm?.toFixed(1)}`
                            )}
                          </td>

                          <td className="px-3.5 py-2.5 text-slate-500 text-[11px] hidden sm:table-cell truncate max-w-[150px]">
                            {item.label}
                          </td>

                          <td className="px-3.5 py-2.5 text-right">
                            {onSelectSize && (
                              isAvailable ? (
                                <button
                                  type="button"
                                  onClick={() => handleApplySize(item.size)}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                                    isCurrent
                                      ? "bg-slate-100 text-slate-500"
                                      : isRecommended
                                      ? "bg-[#000000] text-white hover:bg-[#1A1A1A]"
                                      : "border border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  {isCurrent ? "Active" : "Pick"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    toast.error(`Size ${item.size} Unavailable`, {
                                      description: `Size ${item.size} (${item.label}) has not been added for this cap by the admin.`,
                                    });
                                  }}
                                  className="px-2 py-1 rounded-md text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200/60 cursor-not-allowed hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                  title={`Size ${item.size} has not been added for this cap`}
                                >
                                  Unavailable
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "guide" && (
            <div className="space-y-3">
              {/* 4 Simple, Readable Step Cards */}
              <div className="grid sm:grid-cols-2 gap-2.5">
                {MEASUREMENT_STEPS.map((step) => (
                  <div
                    key={step.step}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#000000] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                        {step.step}
                      </span>
                      <h4 className="font-bold text-xs text-[#000000]">
                        {step.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed pl-7">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* Clean Golden Rule Callout */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-900 flex items-start gap-2">
                <span className="font-bold text-xs shrink-0">Golden Rule:</span>
                <span className="text-[11px] leading-relaxed">
                  If your head measurement falls between two sizes (e.g. 23.2″), always choose the larger size for a comfortable Yoruba crown fit.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Clean Footer */}
        <div className="p-3 sm:p-4 px-4 sm:px-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 shrink-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Free size exchange within 7 days.</span>
            </span>
            <span className="hidden sm:inline text-slate-300">&bull;</span>
            <Link
              href="/size-guide"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-[#000000] hover:underline"
            >
              <span>Full Size Guide Page</span>
              <ExternalLink className="w-3 h-3 text-[#FED501]" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-semibold text-slate-700 cursor-pointer transition-colors text-center"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
