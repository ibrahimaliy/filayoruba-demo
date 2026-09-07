"use client";

import { useState } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  Check,
  MoveHorizontal,
  ArrowRight,
} from "lucide-react";
import { FILA_SIZES, FilaSizeInfo } from "@/data/sizing";
import { recommendSize } from "@/lib/sizing";

export default function SizeGuideCalculator() {
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const [measurement, setMeasurement] = useState<number>(23.0);

  const recommendation = recommendSize(measurement, unit);

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
    <div className="space-y-6">
      {/* Sleek Fit Finder */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#000000] font-serif flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#FED501]" />
              <span>Head Circumference Fit Finder</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Drag the slider to find your exact Fìlà Yorùbá match
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Unit Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleUnitToggle("in")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer text-xs ${
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
                className={`px-3 py-1 rounded-md transition-all cursor-pointer text-xs ${
                  unit === "cm"
                    ? "bg-white text-[#000000] shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                CM
              </button>
            </div>

            <span className="font-mono font-bold text-xs text-[#000000] bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
              {measurement.toFixed(1)} {unit === "in" ? "″" : "cm"}
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-2 pt-1">
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
        </div>

        {/* Clean Recommendation Callout */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-slate-500">Recommended Size:</div>
            <div className="text-base font-bold text-[#000000] flex items-center gap-2 mt-0.5">
              <span>Size {recommendation.recommended.size}</span>
              <span className="text-slate-400 font-normal text-xs font-sans">
                ({recommendation.recommended.inches}″ / {recommendation.recommended.cm} cm)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {recommendation.note}
            </p>
          </div>

          <Link
            href="/products"
            className="px-4 py-2 rounded-lg bg-[#000000] hover:bg-[#1A1A1A] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0"
          >
            <span>Shop Size {recommendation.recommended.size} Filas</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#FED501]" />
          </Link>
        </div>
      </div>

      {/* Clean Size Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">SIZE</th>
                <th className="px-4 py-3 text-center">INCHES</th>
                <th className="px-4 py-3 text-center">CM</th>
                <th className="px-4 py-3 text-left">FITTING CHARACTERISTIC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FILA_SIZES.map((item: FilaSizeInfo) => {
                const isRecommended = recommendation.recommended.size === item.size;

                return (
                  <tr
                    key={item.size}
                    className={`transition-colors ${
                      isRecommended ? "bg-[#FED501]/15 font-semibold" : "hover:bg-slate-50/50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#000000]">{item.size}</span>
                        {item.isFlexible && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            Free
                          </span>
                        )}
                        {isRecommended && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#000000] text-[#FED501] font-bold">
                            Match
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center font-mono text-slate-800">
                      {item.isFlexible ? (
                        <MoveHorizontal className="w-3.5 h-3.5 mx-auto text-slate-400" />
                      ) : (
                        `${item.inches?.toFixed(1)}″`
                      )}
                    </td>

                    <td className="px-4 py-3 text-center font-mono text-slate-500">
                      {item.isFlexible ? (
                        <MoveHorizontal className="w-3.5 h-3.5 mx-auto text-slate-400" />
                      ) : (
                        `${item.cm?.toFixed(1)}`
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {item.description}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
