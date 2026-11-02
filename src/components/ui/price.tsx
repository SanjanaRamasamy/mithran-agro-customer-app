"use client";

import { cn } from "@/lib/utils";
import { calcDiscountPercent, formatPrice } from "@/utils/format";

interface PriceProps {
  price: number;
  mrp?: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showDiscount?: boolean;
}

const SIZES = {
  sm: "text-sm font-semibold",
  md: "text-base font-bold",
  lg: "text-xl font-bold",
  xl: "text-3xl font-bold tracking-tight",
} as const;

export function Price({ price, mrp, size = "md", className, showDiscount = true }: PriceProps) {
  const discount = mrp ? calcDiscountPercent(mrp, price) : 0;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span className={cn("text-charcoal", SIZES[size])}>{formatPrice(price)}</span>
      {mrp !== undefined && mrp > price && (
        <>
          <span className="text-xs font-medium text-graymute line-through sm:text-sm">
            {formatPrice(mrp)}
          </span>
          {showDiscount && discount > 0 && (
            <span className="text-xs font-bold text-success sm:text-sm">{discount}% off</span>
          )}
        </>
      )}
    </div>
  );
}
