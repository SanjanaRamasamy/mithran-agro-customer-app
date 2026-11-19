import { cn } from "@/lib/utils";

/**
 * Path to the supplied Agro Pvt. Ltd. logo artwork.
 * Update this constant if the logo asset path changes in the future.
 */
export const AGRO_LOGO_SRC = "/images/agro-logo.png";

/**
 * Reusable Agro brand logo component using the original supplied artwork.
 * Preserves natural aspect ratio (693:361) without extra containers or filters.
 */
export function AgroBrandMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dimensions =
    size === "lg"
      ? "h-16 w-[123px] sm:h-[72px] sm:w-[138px]"
      : size === "sm"
        ? "h-9 w-[69px]"
        : "h-10 w-[77px] sm:h-11 sm:w-[85px]";

  return (
    <img
      src={AGRO_LOGO_SRC}
      alt="Agro"
      width={693}
      height={361}
      decoding="async"
      className={cn("block shrink-0 object-contain select-none", dimensions, className)}
    />
  );
}
