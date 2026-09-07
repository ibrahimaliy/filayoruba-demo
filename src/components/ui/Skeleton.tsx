import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gold" | "dark";
}

export default function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-md animate-pulse",
        variant === "default" && "bg-slate-200/80 animate-shimmer",
        variant === "gold" && "bg-[#FED501]/20 shimmer-gold",
        variant === "dark" && "bg-white/10 animate-shimmer-dark",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
