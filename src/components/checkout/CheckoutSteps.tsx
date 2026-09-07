"use client";

import { Check } from "lucide-react";

interface Props {
  currentStep: number;
}

const steps = [
  { id: 1, name: "Information" },
  { id: 2, name: "Shipping" },
  { id: 3, name: "Review" },
  { id: 4, name: "Payment" },
];

export default function CheckoutSteps({ currentStep }: Props) {
  return (
    <div className="mb-8 sm:mb-12 w-full max-w-full overflow-hidden">
      <div className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isLast = index === steps.length - 1;

          return (
            <div
              key={step.id}
              className={`flex items-center ${isLast ? "shrink-0" : "flex-1 min-w-0"}`}
            >
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div
                  className={`
                    flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-colors duration-200
                    ${
                      isCompleted
                        ? "bg-[#000000] text-white"
                        : isActive
                        ? "bg-[#000000] text-[#FED501] ring-4 ring-[#FED501]/30"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                  ) : (
                    step.id
                  )}
                </div>

                <span
                  className={`hidden sm:inline text-sm font-medium ${
                    isActive
                      ? "text-[#000000] font-semibold"
                      : isCompleted
                      ? "text-slate-700"
                      : "text-slate-400"
                  }`}
                >
                  {step.name}
                </span>
              </div>

              {!isLast && (
                <div
                  className={`mx-2 sm:mx-4 md:mx-6 h-[2px] flex-1 min-w-[8px] rounded transition-colors duration-200 ${
                    currentStep > step.id ? "bg-[#000000]" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}