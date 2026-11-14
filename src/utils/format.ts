/* Format helpers — shared across the app. No inline formatting logic elsewhere. */

export function formatPrice(amount: number, opts?: { withDecimals?: boolean }): string {
  const decimals = opts?.withDecimals ? 2 : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

export function formatMRP(amount: number): string {
  return `M.R.P.: ${formatPrice(amount)}`;
}

export function calcDiscountPercent(mrp: number, price: number): number {
  if (mrp <= 0 || price >= mrp) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

export function formatDate(iso: string, style: "short" | "long" | "day" = "short"): string {
  const d = new Date(iso);
  if (style === "long") {
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (style === "day") {
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  }
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function timeAgo(iso: string, now = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function packLabel(unit: string, value: number): string {
  if (unit === "g" && value >= 1000) return `${value / 1000} kg`;
  if (unit === "ml" && value >= 1000) return `${value / 1000} L`;
  return `${value} ${unit}${unit === "pc" && value > 1 ? "s" : ""}`;
}

export function titleCase(s: string): string {
  return s
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function pluralize(n: number, one: string, many?: string): string {
  return n === 1 ? one : (many ?? `${one}s`);
}

export function orderNumber(seq: number): string {
  return `VRD-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`;
}
