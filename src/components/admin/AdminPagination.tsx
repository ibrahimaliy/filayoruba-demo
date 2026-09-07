"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface AdminPaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export default function AdminPagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  itemLabel = "items",
  className = "",
}: AdminPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems === 0) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate visible page numbers with ellipsis
  const getPageNumbers = () => {
    const delta = 1;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (typeof i === "number") {
        if (l !== undefined) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l !== 1) {
            rangeWithDots.push("...");
          }
        }
        rangeWithDots.push(i);
        l = i;
      }
    }

    return rangeWithDots;
  };

  return (
    <div
      className={`bg-white px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 select-none ${className}`}
    >
      {/* 1. Item range & count */}
      <div className="flex items-center gap-3 text-xs text-slate-500 w-full sm:w-auto justify-between sm:justify-start">
        <span>
          Showing <strong className="text-slate-800 font-bold">{startItem}</strong> to{" "}
          <strong className="text-slate-800 font-bold">{endItem}</strong> of{" "}
          <strong className="text-slate-800 font-bold">{totalItems}</strong> {itemLabel}
        </span>

        {/* Page size dropdown */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="hidden md:inline text-slate-400">Show</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                onPageSizeChange(newSize);
                onPageChange(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 pr-6 text-xs font-bold text-[#000000] focus:outline-none focus:border-[#FED501] cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Pagination Controls */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
        {/* First & Prev Page */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 transition-all cursor-pointer disabled:cursor-not-allowed"
            title="First Page"
            aria-label="First Page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>
        </div>

        {/* Numeric Page Buttons */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 text-xs font-bold text-slate-400"
                >
                  &hellip;
                </span>
              );
            }

            const pageNum = p as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? "bg-[#000000] text-[#FED501] shadow-sm ring-2 ring-[#FED501]/30 font-extrabold"
                    : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80"
                }`}
                aria-label={`Page ${pageNum}`}
                aria-current={isActive ? "page" : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next & Last Page */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            aria-label="Next Page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 transition-all cursor-pointer disabled:cursor-not-allowed"
            title="Last Page"
            aria-label="Last Page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
