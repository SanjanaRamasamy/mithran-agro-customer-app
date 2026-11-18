"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  MapPin,
  ShoppingBasket,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useToast } from "@/contexts/NotificationContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { OrderSummary } from "@/components/cart/order-summary";
import { PAYMENT_METHODS } from "@/constants";
import { formatPrice } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { Address } from "@/types";
import { parseCustomerOrder } from "@/lib/customer-order";
import { INDIAN_STATES, validateAddressFields } from "@/lib/validation";

function StepHeader({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-forest-900 text-xs font-extrabold text-white">
        {n}
      </span>
      <div>
        <h2 className="text-base font-bold text-charcoal">{title}</h2>
        {hint && <p className="text-xs text-graymute">{hint}</p>}
      </div>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-forest-100 bg-white px-3.5 text-sm text-charcoal outline-none transition placeholder:text-graymute/70 focus:border-forest-300 focus:ring-2 focus:ring-forest-200";

function Field({
  label,
  children,
  error,
  htmlFor,
  errorId,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  htmlFor?: string;
  errorId?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-graymute">
        {label}
      </label>
      {children}
      {error && (
        <p id={errorId} className="mt-1 text-[11px] font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function CheckoutForm() {
  const router = useRouter();
  const { lines, clearCart } = useCart();
  const { user, addresses, addAddress, isAuthenticated } = useAuth();
  const { placeOrder } = useOrders();
  const { toast } = useToast();
  const { reload } = useCatalog();
  const hasUnavailableItems = lines.some((line) => {
    const minimum = line.product.prestaShop?.minimumQuantity ?? 1;
    const stock = line.variant.stockCount;
    return !line.variant.inStock || line.quantity < minimum || (stock !== undefined && line.quantity > stock);
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? ""
  );
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    line1: "",
    line2: "",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "",
    label: "Home",
  });
  const [addrErrors, setAddrErrors] = useState<Record<string, string>>({});

  const [placing, setPlacing] = useState(false);
  const submissionInProgress = useRef(false);
  const [quote, setQuote] = useState<{ total: number; key: string } | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  const quoteKey = useMemo(
    () => JSON.stringify([
      selectedAddressId,
      lines.map((line) => [
        line.product.prestaShop?.productId ?? "",
        line.product.prestaShop?.defaultAttributeId ?? "0",
        line.quantity,
        line.variant.price,
      ]),
    ]),
    [lines, selectedAddressId],
  );
  const currentQuote = quote?.key === quoteKey ? quote : null;

  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      setSelectedAddressId(addresses.find((address) => address.isDefault)?.id ?? addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (quote && quote.key !== quoteKey) {
      idempotencyKey.current = null;
    }
  }, [quote, quoteKey]);

  const validateNewAddressField = (field: keyof typeof newAddr, nextDraft: typeof newAddr) => {
    const check = validateAddressFields(nextDraft);
    setAddrErrors((prev) => {
      const next = { ...prev };
      if (check.errors[field]) next[field] = check.errors[field];
      else delete next[field];
      return next;
    });
  };

  const saveNewAddress = async () => {
    const check = validateAddressFields(newAddr);
    setAddrErrors(check.errors);
    if (!check.ok) {
      const order = ["name", "phone", "line1", "line2", "city", "state", "pincode", "label"];
      const firstKey = order.find((k) => check.errors[k]);
      if (firstKey) document.getElementById(`co-addr-${firstKey}`)?.focus();
      return;
    }
    try {
      const created = await addAddress({
        label: check.values.label,
        name: check.values.name,
        phone: check.values.phone,
        line1: check.values.line1,
        line2: check.values.line2 || undefined,
        city: check.values.city,
        state: check.values.state,
        pincode: check.values.pincode,
        type: check.values.label.toLowerCase() as Address["type"],
        isDefault: addresses.length === 0,
      });
      setSelectedAddressId(created.id);
      setQuote(null);
      setAddrErrors({});
      setShowNewAddress(false);
      toast({ title: "Address saved to your account." });
    } catch (error) {
      toast({
        kind: "error",
        title: error instanceof Error ? error.message : "Unable to save delivery address.",
      });
    }
  };

  const placeOrderNow = async () => {
    if (submissionInProgress.current) return;
    if (!isAuthenticated || !user) {
      toast({ kind: "error", title: "Sign in is required to place an order." });
      router.replace("/login?redirect=%2Fcheckout");
      return;
    }
    if (lines.length === 0) return;
    if (hasUnavailableItems) {
      toast({ kind: "error", title: "One or more basket items are unavailable." });
      return;
    }
    const address = addresses.find((a) => a.id === selectedAddressId) ?? addresses[0];
    if (!address) {
      toast({ kind: "error", title: "Please add a delivery address first." });
      setShowNewAddress(true);
      return;
    }
    if (lines.some((line) => !line.product.prestaShop?.productId)) {
      toast({ kind: "error", title: "A basket item is not available in the store catalog." });
      reload();
      return;
    }

    submissionInProgress.current = true;
    setPlacing(true);
    try {
      const inventoryResponse = await fetch("/api/prestashop/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          items: lines.map((line) => ({
            productId: line.product.prestaShop?.productId,
            attributeId: Number(line.product.prestaShop?.defaultAttributeId ?? 0),
            quantity: line.quantity,
            expectedPrice: line.variant.price,
          })),
        }),
      });
      const inventoryPayload: unknown = await inventoryResponse.json();
      if (
        !inventoryResponse.ok ||
        typeof inventoryPayload !== "object" ||
        inventoryPayload === null ||
        !("success" in inventoryPayload) ||
        inventoryPayload.success !== true
      ) {
        const message = typeof inventoryPayload === "object" && inventoryPayload !== null &&
          "message" in inventoryPayload && typeof inventoryPayload.message === "string"
          ? inventoryPayload.message
          : "Unable to verify current product availability.";
        setQuote(null);
        reload();
        throw new Error(message);
      }

      if (!currentQuote) {
        const quoteResponse = await fetch("/api/customer/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            addressId: address.id,
            items: lines.map((line) => ({
              productId: line.product.prestaShop?.productId,
              attributeId: Number(line.product.prestaShop?.defaultAttributeId ?? 0),
              quantity: line.quantity,
            })),
          }),
        });
        const quotePayload: unknown = await quoteResponse.json();
        if (
          !quoteResponse.ok ||
          typeof quotePayload !== "object" ||
          quotePayload === null ||
          !("quote" in quotePayload) ||
          typeof quotePayload.quote !== "object" ||
          quotePayload.quote === null ||
          !("total" in quotePayload.quote) ||
          typeof quotePayload.quote.total !== "number" ||
          !Number.isFinite(quotePayload.quote.total)
        ) {
          const message = typeof quotePayload === "object" && quotePayload !== null &&
            "message" in quotePayload && typeof quotePayload.message === "string"
            ? quotePayload.message
            : "Could not calculate the current order total.";
          throw new Error(message);
        }
        setQuote({ total: quotePayload.quote.total, key: quoteKey });
        toast({ title: "Order total ready.", description: "Review the amount, then confirm your Cash on Delivery order." });
        return;
      }

      idempotencyKey.current ??= crypto.randomUUID();
      const response = await fetch("/api/customer/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          addressId: address.id,
          idempotencyKey: idempotencyKey.current,
          expectedTotal: currentQuote.total,
          items: lines.map((line) => ({
            productId: line.product.prestaShop?.productId,
            attributeId: Number(line.product.prestaShop?.defaultAttributeId ?? 0),
            quantity: line.quantity,
          })),
        }),
      });
      const payload: unknown = await response.json();
      const orderRecord =
        typeof payload === "object" && payload !== null && "order" in payload
          ? parseCustomerOrder(payload.order)
          : null;
      if (!response.ok || !orderRecord || orderRecord.userId !== user.id) {
        const message = typeof payload === "object" && payload !== null &&
          "message" in payload && typeof payload.message === "string"
          ? payload.message
          : "Could not confirm this order. Please try again.";
        if (response.status === 409) {
          setQuote(null);
          reload();
        }
        throw new Error(message);
      }

      const id = orderRecord.id;
      placeOrder(orderRecord);
      clearCart();
      idempotencyKey.current = null;
      router.push(`/order-confirmation?id=${id}`);
    } catch (error) {
      toast({
        kind: "error",
        title: error instanceof Error ? error.message : "Unable to verify your basket.",
      });
    } finally {
      submissionInProgress.current = false;
      setPlacing(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-dashed border-forest-200 bg-white/60 px-6 py-16 text-center">
        <span className="text-5xl" aria-hidden>🧺</span>
        <h1 className="mt-4 text-xl font-bold text-charcoal">Nothing to check out yet</h1>
        <p className="mt-1.5 text-sm text-graymute">Add some fresh produce to your basket first.</p>
        <button
          onClick={() => router.push("/search")}
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-2xl bg-forest-900 px-6 text-sm font-bold text-white transition hover:bg-forest-800"
        >
          <ShoppingBasket className="size-4" aria-hidden />
          Browse produce
        </button>
      </div>
    );
  }

  if (hasUnavailableItems) {
    return (
      <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 px-6 py-10 text-center">
        <h1 className="text-xl font-bold text-charcoal">Review your basket</h1>
        <p className="mt-2 text-sm text-graymute">Some items are out of stock or no longer meet their minimum quantity.</p>
        <button
          onClick={() => router.push("/cart")}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-forest-900 px-5 text-sm font-bold text-white"
        >
          Return to basket
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        {/* Step 1 — account */}
        <section aria-label="Customer details" className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
          <StepHeader n={1} title="Customer account" hint="Order details are associated with your Mithran Agro account." />
          <p className="text-sm font-semibold text-charcoal">{user?.name}</p>
          <p className="mt-0.5 text-xs text-graymute">{user?.email}</p>
        </section>

        {/* Step 2 — address */}
        <section aria-label="Delivery address" className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
          <StepHeader n={2} title="Delivery address" hint="Choose where the harvest should land." />

          <div className="grid gap-2.5 sm:grid-cols-2">
            {addresses.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAddressId(a.id)}
                aria-pressed={selectedAddressId === a.id}
                className={cn(
                  "rounded-2xl border p-4 text-left transition active:scale-[0.99]",
                  selectedAddressId === a.id
                    ? "border-forest-800 bg-forest-50/70 ring-1 ring-forest-800"
                    : "border-forest-100 hover:border-forest-300"
                )}
              >
                <span className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-forest-800">
                    <MapPin className="size-3.5" aria-hidden />
                    {a.label}
                  </span>
                  {a.isDefault && (
                    <span className="rounded-full bg-lime-soft px-2 py-0.5 text-[10px] font-bold text-lime-deep">Default</span>
                  )}
                </span>
                <span className="mt-1.5 block text-sm font-bold text-charcoal">{a.name}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-graymute">
                  {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} — {a.pincode}
                </span>
                <span className="mt-1 block text-xs text-graymute">{a.phone}</span>
              </button>
            ))}

            {!showNewAddress && (
              <button
                onClick={() => setShowNewAddress(true)}
                className="flex min-h-[120px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-forest-200 text-forest-800 transition hover:bg-forest-50"
              >
                <span className="text-2xl" aria-hidden>＋</span>
                <span className="text-sm font-bold">Add new address</span>
              </button>
            )}
          </div>

          {showNewAddress && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4 overflow-hidden"
            >
              <div className="grid gap-4 rounded-2xl bg-soft/60 p-4 sm:grid-cols-2">
                <Field label="Full name *" htmlFor="co-addr-name" error={addrErrors.name} errorId="co-addr-name-err">
                  <input
                    id="co-addr-name"
                    maxLength={80}
                    autoComplete="name"
                    aria-invalid={Boolean(addrErrors.name)}
                    aria-describedby={addrErrors.name ? "co-addr-name-err" : undefined}
                    className={cn(inputCls, addrErrors.name && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                    value={newAddr.name}
                    onChange={(e) => {
                      const next = { ...newAddr, name: e.target.value };
                      setNewAddr(next);
                      if (addrErrors.name) validateNewAddressField("name", next);
                    }}
                    onBlur={() => validateNewAddressField("name", newAddr)}
                  />
                </Field>
                <Field label="Mobile number *" htmlFor="co-addr-phone" error={addrErrors.phone} errorId="co-addr-phone-err">
                  <input
                    id="co-addr-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="tel-national"
                    placeholder="9876543210"
                    aria-invalid={Boolean(addrErrors.phone)}
                    aria-describedby={addrErrors.phone ? "co-addr-phone-err" : undefined}
                    className={cn(inputCls, addrErrors.phone && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                    value={newAddr.phone}
                    onChange={(e) => {
                      const next = { ...newAddr, phone: e.target.value };
                      setNewAddr(next);
                      if (addrErrors.phone) validateNewAddressField("phone", next);
                    }}
                    onBlur={() => validateNewAddressField("phone", newAddr)}
                  />
                </Field>
                <Field label="Address line 1 *" htmlFor="co-addr-line1" error={addrErrors.line1} errorId="co-addr-line1-err">
                  <input
                    id="co-addr-line1"
                    maxLength={150}
                    autoComplete="address-line1"
                    placeholder="Flat / House no, Street"
                    aria-invalid={Boolean(addrErrors.line1)}
                    aria-describedby={addrErrors.line1 ? "co-addr-line1-err" : undefined}
                    className={cn(inputCls, addrErrors.line1 && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                    value={newAddr.line1}
                    onChange={(e) => {
                      const next = { ...newAddr, line1: e.target.value };
                      setNewAddr(next);
                      if (addrErrors.line1) validateNewAddressField("line1", next);
                    }}
                    onBlur={() => validateNewAddressField("line1", newAddr)}
                  />
                </Field>
                <Field label="Address line 2 (optional)" htmlFor="co-addr-line2" error={addrErrors.line2} errorId="co-addr-line2-err">
                  <input
                    id="co-addr-line2"
                    maxLength={150}
                    autoComplete="address-line2"
                    placeholder="Area, Landmark"
                    aria-invalid={Boolean(addrErrors.line2)}
                    aria-describedby={addrErrors.line2 ? "co-addr-line2-err" : undefined}
                    className={cn(inputCls, addrErrors.line2 && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                    value={newAddr.line2}
                    onChange={(e) => {
                      const next = { ...newAddr, line2: e.target.value };
                      setNewAddr(next);
                      if (addrErrors.line2) validateNewAddressField("line2", next);
                    }}
                    onBlur={() => validateNewAddressField("line2", newAddr)}
                  />
                </Field>
                <Field label="City *" htmlFor="co-addr-city" error={addrErrors.city} errorId="co-addr-city-err">
                  <input
                    id="co-addr-city"
                    maxLength={60}
                    autoComplete="address-level2"
                    aria-invalid={Boolean(addrErrors.city)}
                    aria-describedby={addrErrors.city ? "co-addr-city-err" : undefined}
                    className={cn(inputCls, addrErrors.city && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                    value={newAddr.city}
                    onChange={(e) => {
                      const next = { ...newAddr, city: e.target.value };
                      setNewAddr(next);
                      if (addrErrors.city) validateNewAddressField("city", next);
                    }}
                    onBlur={() => validateNewAddressField("city", newAddr)}
                  />
                </Field>
                <Field label="State / UT *" htmlFor="co-addr-state" error={addrErrors.state} errorId="co-addr-state-err">
                  <select
                    id="co-addr-state"
                    autoComplete="address-level1"
                    aria-invalid={Boolean(addrErrors.state)}
                    aria-describedby={addrErrors.state ? "co-addr-state-err" : undefined}
                    className={cn(inputCls, addrErrors.state && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                    value={newAddr.state}
                    onChange={(e) => {
                      const next = { ...newAddr, state: e.target.value };
                      setNewAddr(next);
                      validateNewAddressField("state", next);
                    }}
                    onBlur={() => validateNewAddressField("state", newAddr)}
                  >
                    <option value="">Select state or UT</option>
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </Field>
                <Field label="PIN code *" htmlFor="co-addr-pincode" error={addrErrors.pincode} errorId="co-addr-pincode-err">
                  <input
                    id="co-addr-pincode"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="postal-code"
                    placeholder="560102"
                    aria-invalid={Boolean(addrErrors.pincode)}
                    aria-describedby={addrErrors.pincode ? "co-addr-pincode-err" : undefined}
                    className={cn(inputCls, addrErrors.pincode && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                    value={newAddr.pincode}
                    onChange={(e) => {
                      const next = { ...newAddr, pincode: e.target.value };
                      setNewAddr(next);
                      if (addrErrors.pincode) validateNewAddressField("pincode", next);
                    }}
                    onBlur={() => validateNewAddressField("pincode", newAddr)}
                  />
                </Field>
                <Field label="Save as *" htmlFor="co-addr-label" error={addrErrors.label} errorId="co-addr-label-err">
                  <select
                    id="co-addr-label"
                    className={inputCls}
                    value={newAddr.label}
                    onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                  >
                    <option>Home</option>
                    <option>Work</option>
                    <option>Other</option>
                  </select>
                </Field>
                <div className="flex items-end gap-2">
                  <button type="button" onClick={saveNewAddress} className="h-11 flex-1 rounded-xl bg-forest-900 text-sm font-bold text-white transition hover:bg-forest-800">
                    Save address
                  </button>
                  <button type="button" onClick={() => { setShowNewAddress(false); setAddrErrors({}); }} className="h-11 rounded-xl border border-forest-200 px-4 text-sm font-semibold text-charcoal transition hover:bg-soft">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* Step 3 — delivery */}
        <section aria-label="Delivery" className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
          <StepHeader n={3} title="Delivery" hint="Delivery charges and timing are calculated for your delivery address." />
          <p className="text-sm leading-relaxed text-graymute">
            Delivery timing and fees are calculated by the store carrier. The final amount shown below comes from PrestaShop.
          </p>
        </section>

        {/* Step 4 — payment */}
        <section aria-label="Payment method" className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
          <StepHeader n={4} title="Payment method" hint="Cash on Delivery is the configured payment method." />
          <div className="grid gap-2.5 sm:grid-cols-2">
            {PAYMENT_METHODS.map((pm) => (
              <div
                key={pm.id}
                className="flex items-start gap-3 rounded-2xl border border-forest-800 bg-forest-50/70 p-4 text-left ring-1 ring-forest-800"
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-800">
                  {pm.id === "cod" && <ShoppingBasket className="size-4" aria-hidden />}
                </span>
                <span>
                  <span className="block text-sm font-bold text-charcoal">{pm.label}</span>
                  <span className="mt-0.5 block text-xs text-graymute">{pm.hint}</span>
                </span>
                <CheckCircle2 className="ml-auto size-5 shrink-0 text-forest-700" aria-hidden />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* summary column */}
      <aside aria-label="Order summary" className="lg:sticky lg:top-40 lg:self-start">
        <div className="space-y-4">
          <OrderSummary
            ctaLabel={placing ? "Processing…" : currentQuote ? "Place Cash on Delivery order" : "Review order total"}
            onCta={placeOrderNow}
            disabled={placing}
            sticky={false}
            couponSlot={false}
            realCheckout
            authoritativeTotal={currentQuote?.total}
          />
          {placing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass flex items-center justify-center gap-2 rounded-2xl p-4 text-sm font-semibold text-forest-900"
              role="status"
            >
              <span className="size-4 animate-spin rounded-full border-2 border-forest-700 border-t-transparent" aria-hidden />
              Revalidating your basket and submitting it to PrestaShop…
            </motion.div>
          )}
        </div>
      </aside>

      {/* mobile sticky place-order */}
      <div className="glass-strong fixed inset-x-3 bottom-20 z-40 flex items-center justify-between gap-3 rounded-2xl p-3 lg:hidden">
        <div className="pl-1">
          <p className="text-[11px] text-graymute">Order total</p>
          <p className="text-base font-extrabold text-charcoal">
            {currentQuote ? formatPrice(currentQuote.total) : "Review total"}
          </p>
        </div>
        <button
          onClick={placeOrderNow}
          disabled={placing}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-forest-900 px-5 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60"
        >
          {placing ? "Processing…" : currentQuote ? "Place COD order" : "Review total"}
          {!placing && <ChevronRight className="size-4" aria-hidden />}
        </button>
      </div>
    </div>
  );
}
