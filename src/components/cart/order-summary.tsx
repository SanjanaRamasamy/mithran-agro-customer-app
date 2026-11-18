"use client";

import { useState } from "react";
import { BadgeCheck, Tag, X } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/NotificationContext";
import { COUPONS } from "@/data/offers";
import { formatPrice, formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";

/** Coupon entry + available coupon chips (simulated validation). */
export function CouponBox({ compact }: { compact?: boolean }) {
  const { coupon, applyCoupon, removeCoupon, totals } = useCart();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyCoupon(code);
    if (res.ok) {
      setError(null);
      setCode("");
      toast({ title: "Coupon applied 🎉", description: res.message });
    } else {
      setError(res.message);
    }
  };

  return (
    <div className={cn("rounded-2xl border border-forest-50 bg-white p-4 shadow-soft", compact && "p-3.5")}>
      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-charcoal">
        <Tag className="size-4 text-forest-700" aria-hidden />
        Coupons & offers
      </p>

      {coupon ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-lime-soft/70 px-3.5 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <BadgeCheck className="size-5 shrink-0 text-lime-deep" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-bold text-lime-deep">{coupon.code}</p>
              <p className="truncate text-xs text-lime-deep/80">
                {coupon.description}
                {coupon.discount > 0 && ` — saving ${formatPrice(coupon.discount)}`}
              </p>
            </div>
          </div>
          <button
            onClick={removeCoupon}
            aria-label={`Remove coupon ${coupon.code}`}
            className="shrink-0 rounded-lg p-1.5 text-lime-deep/70 transition hover:bg-white hover:text-red-600"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex gap-2" noValidate>
          <div className="flex-1">
            <label htmlFor="coupon-code" className="sr-only">
              Coupon code
            </label>
            <input
              id="coupon-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code e.g. FRESH20"
              aria-invalid={!!error}
              aria-describedby={error ? "coupon-error" : undefined}
              className={cn(
                "h-10 w-full rounded-xl border bg-white px-3 text-sm font-semibold tracking-wide outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-graymute/70 focus:ring-2 focus:ring-forest-200",
                error ? "border-red-300" : "border-forest-100 focus:border-forest-300"
              )}
            />
            {error && (
              <p id="coupon-error" className="mt-1 text-[11px] font-medium text-red-600">
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="h-10 shrink-0 rounded-xl bg-forest-900 px-4 text-sm font-bold text-white transition hover:bg-forest-800 active:scale-95"
          >
            Apply
          </button>
        </form>
      )}

      {/* available coupons */}
      <div className="mt-3 space-y-2">
        {COUPONS.filter((c) => totals.subtotal >= c.minOrder || c.type === "free-delivery")
          .slice(0, 2)
          .map((c) => (
            <button
              key={c.code}
              onClick={() => {
                const res = applyCoupon(c.code);
                if (res.ok) toast({ title: "Coupon applied 🎉", description: res.message });
                else setError(res.message);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-forest-200 px-3.5 py-2.5 text-left transition hover:bg-forest-50"
            >
              <span className="min-w-0">
                <span className="block text-xs font-extrabold tracking-wide text-forest-900">{c.code}</span>
                <span className="block truncate text-[11px] text-graymute">{c.description}</span>
              </span>
              <span className="shrink-0 text-[10px] font-semibold text-graymute">
                till {formatDate(c.expiry)}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}

/** Sticky totals card with delivery breakdown and checkout CTA. */
export function OrderSummary({
  ctaLabel = "Proceed to checkout",
  ctaHref,
  onCta,
  showSavings = true,
  couponSlot = true,
  disabled,
  sticky,
  realCheckout = false,
  authoritativeTotal,
}: {
  ctaLabel?: string;
  ctaHref?: string;
  onCta?: () => void;
  showSavings?: boolean;
  couponSlot?: boolean;
  disabled?: boolean;
  sticky?: boolean;
  realCheckout?: boolean;
  authoritativeTotal?: number;
}) {
  const { totals, itemCount } = useCart();

  return (
    <div className={cn("space-y-4", sticky && "lg:sticky lg:top-40")}>
      {couponSlot && <CouponBox />}

      <div className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
        <h2 className="text-sm font-bold text-charcoal">Order summary</h2>
        <dl className="mt-3 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-graymute">
              {realCheckout
                ? `Current basket estimate (${itemCount} ${itemCount === 1 ? "item" : "items"})`
                : `Basket total (${itemCount} ${itemCount === 1 ? "item" : "items"})`}
            </dt>
            <dd className="font-semibold text-charcoal">{formatPrice(totals.subtotal)}</dd>
          </div>
          {!realCheckout && (
            <>
              {showSavings && totals.savings > 0 && (
                <div className="flex justify-between">
                  <dt className="text-graymute">Produce savings</dt>
                  <dd className="font-semibold text-success">−{formatPrice(totals.savings)}</dd>
                </div>
              )}
              {totals.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-graymute">Coupon discount</dt>
                  <dd className="font-semibold text-success">−{formatPrice(totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-graymute">Delivery fee</dt>
                <dd className={cn("font-semibold", totals.deliveryFee === 0 ? "text-success" : "text-charcoal")}>
                  {totals.deliveryFee === 0 ? "FREE" : formatPrice(totals.deliveryFee)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-graymute">Handling (simulated)</dt>
                <dd className="font-semibold text-charcoal">{formatPrice(totals.handlingFee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-graymute">Zero-waste packing</dt>
                <dd className="font-semibold text-charcoal">{formatPrice(totals.greenFee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-graymute">GST (5%, mock)</dt>
                <dd className="font-semibold text-charcoal">{formatPrice(totals.tax)}</dd>
              </div>
            </>
          )}
          <div className="flex justify-between border-t border-forest-50 pt-3 text-base">
            <dt className="font-bold text-charcoal">{realCheckout ? "PrestaShop order total" : "Estimated total"}</dt>
            <dd className="font-extrabold text-charcoal">
              {realCheckout
                ? authoritativeTotal === undefined ? "Review total" : formatPrice(authoritativeTotal)
                : formatPrice(totals.total)}
            </dd>
          </div>
        </dl>

        {!realCheckout && showSavings && totals.savings + totals.discount > 0 && (
          <p className="mt-3 rounded-xl bg-emerald-soft/70 px-3.5 py-2.5 text-xs font-bold text-emerald-800">
            🌱 Total savings on this order: {formatPrice(totals.savings + totals.discount)}
          </p>
        )}

        {ctaHref ? (
          <a
            href={ctaHref}
            onClick={(event) => {
              if (disabled) event.preventDefault();
            }}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            className={cn(
              "mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold shadow-soft transition active:scale-[0.98]",
              disabled
                ? "cursor-not-allowed bg-gray-200 text-gray-400"
                : "bg-forest-900 text-white hover:bg-forest-800"
            )}
          >
            {ctaLabel}
          </a>
        ) : (
          <button
            onClick={onCta}
            disabled={disabled}
            className={cn(
              "mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold shadow-soft transition active:scale-[0.98]",
              disabled
                ? "cursor-not-allowed bg-gray-200 text-gray-400"
                : "bg-forest-900 text-white hover:bg-forest-800"
            )}
          >
            {ctaLabel}
          </button>
        )}

        <p className="mt-2.5 text-center text-[11px] leading-relaxed text-graymute">
          {realCheckout
            ? "Inventory and final amount are verified by PrestaShop before order creation."
            : "Basket totals are estimates. Final price and availability are checked at checkout."}
        </p>
      </div>
    </div>
  );
}
