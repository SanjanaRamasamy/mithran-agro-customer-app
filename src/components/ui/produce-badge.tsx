import { cn } from "@/lib/utils";
import { BADGE_CONFIG } from "@/constants";
import type { ProductBadge } from "@/types";

interface ProduceBadgeProps {
  badge: ProductBadge;
  className?: string;
  compact?: boolean;
}

/** Themed badge for product attributes (organic, seasonal, bestseller…). */
export function ProduceBadge({ badge, className, compact }: ProduceBadgeProps) {
  const cfg = BADGE_CONFIG[badge];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm",
        compact && "px-1.5",
        cfg.className,
        className
      )}
    >
      {cfg.label}
    </span>
  );
}
