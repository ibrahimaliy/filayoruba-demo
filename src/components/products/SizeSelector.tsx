"use client";

import { useState } from "react";
import { Ruler } from "lucide-react";
import SizeGuideModal from "./SizeGuideModal";
import { getSizeInfo, normalizeProductSizes } from "@/lib/sizing";

interface SizeSelectorProps {
  sizes: string[];
  selected: string;
  onChange: (size: string) => void;
}

export default function SizeSelector({ sizes, selected, onChange }: SizeSelectorProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const displaySizes = normalizeProductSizes(sizes);
  const currentInfo = getSizeInfo(selected);

  return (
    <div className="space-y-3">
      {/* Sleek Header with Selected Size Details & Single Size Guide Link */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-slate-900 flex-wrap">
          <span className="text-slate-500 uppercase tracking-wider text-[11px]">Size:</span>
          <span className="font-bold text-[#000000]">
            {currentInfo ? currentInfo.size : selected}
          </span>
          {currentInfo && !currentInfo.isFlexible && (
            <span className="text-slate-500 font-normal text-[11px]">
              ({currentInfo.inches}″ / {currentInfo.cm} cm)
            </span>
          )}
          {currentInfo?.label && (
            <span className="hidden sm:inline text-slate-400 font-normal text-[11px]">
              &bull; {currentInfo.label}
            </span>
          )}
        </div>

        {/* Single, Clean Size Guide Trigger */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#000000] hover:text-[#FED501] transition-colors cursor-pointer py-1 px-1.5 group"
          aria-label="Open size guide modal"
        >
          <Ruler className="w-3.5 h-3.5 text-[#FED501] transition-transform group-hover:rotate-12" />
          <span className="underline underline-offset-4 decoration-slate-300 group-hover:decoration-[#FED501]">
            Size Guide
          </span>
        </button>
      </div>

      {/* Modern Multi-Tiered Size Pills with Head Circumference Details */}
      <div className="flex flex-wrap gap-2">
        {displaySizes.map((sizeKey) => {
          const info = getSizeInfo(sizeKey);
          const isSelected =
            selected === sizeKey ||
            (info && currentInfo && info.size === currentInfo.size) ||
            (info && `${info.inches}` === selected);

          const label = info ? info.size : sizeKey;

          return (
            <button
              key={sizeKey}
              type="button"
              onClick={() => onChange(info ? info.size : sizeKey)}
              aria-pressed={isSelected}
              className={`group relative flex flex-col items-center justify-center h-12 min-w-[3.5rem] px-3 rounded-xl transition-all cursor-pointer border ${
                isSelected
                  ? "bg-[#000000] text-white border-[#000000] shadow-sm ring-2 ring-black/10 scale-[1.02]"
                  : "bg-white text-slate-800 border-slate-200 hover:border-slate-400 hover:bg-slate-50 active:scale-98"
              }`}
            >
              <span className="text-xs font-bold leading-none">{label}</span>
              {info && !info.isFlexible && info.inches && (
                <span
                  className={`text-[10px] font-mono leading-none mt-1 ${
                    isSelected ? "text-slate-300" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                >
                  {info.inches}″
                </span>
              )}
              {info?.isFlexible && (
                <span
                  className={`text-[9px] font-medium leading-tight mt-1 ${
                    isSelected ? "text-[#FED501]" : "text-amber-600"
                  }`}
                >
                  Filastik
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Discreet Yoruba Crown Golden Rule */}
      <p className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FED501] shrink-0" />
        <span>Between sizes? Choose the larger size for a comfortable Yoruba crown fit.</span>
      </p>

      {/* Synchronized Size Guide Modal */}
      <SizeGuideModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        currentSize={selected}
        availableSizes={displaySizes}
        onSelectSize={(newSize) => {
          onChange(newSize);
        }}
        trigger={null}
      />
    </div>
  );
}
