"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  MapPin,
  ShoppingBasket,
  UserRound,
  Wallet,
  Zap,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useToast } from "@/contexts/NotificationContext";
import { useCatalog } from "@/contexts/CatalogContext";
import { OrderSummary } from "@/components/cart/order-summary";
import { DELIVERY_SLOTS } from "@/data/banners";
import { PAYMENT_METHODS } from "@/constants";
import { orderNumber, formatPrice } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { Address, DeliverySlot, Order, OrderItem } from "@/types";

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
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  htmlFor?: string;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-graymute">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-[11px] font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function CheckoutForm() {
  const router = useRouter();
  const { lines, totals, clearCart } = useCart();
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

  const [slotId, setSlotId] = useState<string>(DELIVERY_SLOTS[2]?.id ?? DELIVERY_SLOTS[0].id);
  const [payment, setPayment] = useState<string>("upi");
  const [placing, setPlacing] = useState(false);
  const [contactName, setContactName] = useState(user?.name ?? "");
  const [contactPhone, setContactPhone] = useState(user?.phone ?? "");
  const [contactErrors, setContactErrors] = useState<{ name?: string; phone?: string }>({});

  const selectedSlot = DELIVERY_SLOTS.find((s) => s.id === slotId);
  const slotFee = selectedSlot?.fee ?? 0;

  const grandTotal = useMemo(() => totals.total + slotFee, [totals.total, slotFee]);

  const validateContact = () => {
    const errs: { name?: string; phone?: string } = {};
    if (contactName.trim().length < 2) errs.name = "Please enter the receiver's full name.";
    if (!/^[+\d][\d\s-]{8,14}$/.test(contactPhone.trim())) errs.phone = "Enter a valid phone number.";
    setContactErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateNewAddress = () => {
    const errs: Record<string, string> = {};
    if (newAddr.name.trim().length < 2) errs.name = "Name is required.";
    if (newAddr.line1.trim().length < 5) errs.line1 = "Address line 1 is required.";
    if (!/^\d{6}$/.test(newAddr.pincode.trim())) errs.pincode = "Enter a 6-digit PIN code.";
    setAddrErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveNewAddress = () => {
    if (!validateNewAddress()) return;
    const created = addAddress({
      label: newAddr.label,
      name: newAddr.name,
      phone: newAddr.phone,
      line1: newAddr.line1,
      line2: newAddr.line2 || undefined,
      city: newAddr.city,
      state: newAddr.state,
      pincode: newAddr.pincode,
      type: newAddr.label.toLowerCase() as Address["type"],
      isDefault: addresses.length === 0,
    });
    setSelectedAddressId(created.id);
    setShowNewAddress(false);
    toast({ title: "Address saved", description: "Simulated — stored locally for this demo." });
  };

  const placeOrderNow = async () => {
    if (!validateContact()) return;
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

    setPlacing(true);
    try {
      const response = await fetch("/api/prestashop/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          items: lines.map((line) => ({
            productId: line.product.prestaShop?.productId ?? line.product.id,
            quantity: line.quantity,
            expectedPrice: line.variant.price,
          })),
        }),
      });
      const payload: unknown = await response.json();
      const validationMessage =
        typeof payload === "object" && payload !== null && "message" in payload && typeof payload.message === "string"
          ? payload.message
          : "Unable to verify current product availability.";
      if (!response.ok || typeof payload !== "object" || payload === null || !("success" in payload) || payload.success !== true) {
        toast({ kind: "error", title: validationMessage });
        reload();
        setPlacing(false);
        return;
      }
    } catch (error) {
      toast({
        kind: "error",
        title: error instanceof Error ? error.message : "Unable to verify your basket.",
      });
      setPlacing(false);
      return;
    }

    /* simulate payment + order creation latency */
    window.setTimeout(() => {
      const id = orderNumber(Math.floor(100000 + Math.random() * 899999));
      const items: OrderItem[] = lines.map((l, i) => ({
        id: `oi-${id}-${i}`,
        productId: l.productId,
        variantId: l.variantId,
        name: l.product.name,
        image: l.product.images[0],
        sellerName: l.product.prestaShop ? "Mithran Agro" : l.product.sellerId,
        packLabel: l.variant.name,
        quantity: l.quantity,
        price: l.variant.price,
        mrp: l.variant.mrp,
        lineTotal: l.lineTotal,
      }));

      const paymentLabel =
        PAYMENT_METHODS.find((p) => p.id === payment)?.label ?? "UPI";

      const order: Order = {
        id,
        userId: user?.id ?? "guest",
        items,
        status: "confirmed",
        placedAt: new Date().toISOString(),
        scheduledSlot: `${selectedSlot?.day}, ${selectedSlot?.window}`,
        address,
        paymentMethod: paymentLabel,
        paymentId: `${payment.toUpperCase()}-${Math.floor(100000 + Math.random() * 899999)}`,
        totals: { ...totals, total: grandTotal },
        couponCode: undefined,
        invoiceNo: `INV-${id.slice(4)}`,
        tracking: [
          {
            id: `${id}-t1`,
            status: "placed",
            title: "Order placed",
            description: "Payment confirmed (simulated). Farmers notified.",
            timestamp: new Date().toISOString(),
            completed: true,
          },
          {
            id: `${id}-t2`,
            status: "confirmed",
            title: "Confirmed by farmers",
            description: "Growers reserved your produce for packing.",
            timestamp: new Date().toISOString(),
            completed: true,
          },
          {
            id: `${id}-t3`,
            status: "packed",
            title: "Harvest & pack",
            description: "Scheduled before your delivery slot.",
            timestamp: "",
            completed: false,
          },
          {
            id: `${id}-t4`,
            status: "out-for-delivery",
            title: "Out for delivery",
            description: "Rider assigned at dispatch.",
            timestamp: "",
            completed: false,
          },
          {
            id: `${id}-t5`,
            status: "delivered",
            title: "Delivered",
            description: "Leave at doorstep instructions will be honoured.",
            timestamp: "",
            completed: false,
          },
        ],
        canCancel: true,
        canReturn: false,
        deliveryPartner: "Mithren Express",
      };

      placeOrder(order);
      clearCart();
      router.push(`/order-confirmation?id=${id}`);
      setPlacing(false);
    }, 1400);
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
        {/* Step 1 — contact */}
        <section aria-label="Customer details" className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
          <StepHeader n={1} title="Customer details" hint="Who should the rider call on arrival?" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Receiver name" error={contactErrors.name} htmlFor="ck-name">
              <input
                id="ck-name"
                className={cn(inputCls, contactErrors.name && "border-red-300")}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Full name"
                autoComplete="name"
              />
            </Field>
            <Field label="Phone" error={contactErrors.phone} htmlFor="ck-phone">
              <input
                id="ck-phone"
                className={cn(inputCls, contactErrors.phone && "border-red-300")}
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 98XXX XXXXX"
                inputMode="tel"
                autoComplete="tel"
              />
            </Field>
          </div>
          {!isAuthenticated && (
            <p className="mt-3 rounded-xl bg-soft px-3.5 py-2.5 text-xs text-graymute">
              <UserRound className="mr-1 inline size-3.5" aria-hidden />
              You&apos;re checking out as a guest — sign in later to track orders across devices (simulated).
            </p>
          )}
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
                  {a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city} — {a.pincode}
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
                <Field label="Full name" error={addrErrors.name}>
                  <input className={cn(inputCls, addrErrors.name && "border-red-300")} value={newAddr.name} onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })} />
                </Field>
                <Field label="Phone">
                  <input className={inputCls} value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} inputMode="tel" />
                </Field>
                <Field label="Address line 1" error={addrErrors.line1}>
                  <input className={cn(inputCls, addrErrors.line1 && "border-red-300")} value={newAddr.line1} onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })} placeholder="Flat / House no, Street" />
                </Field>
                <Field label="Address line 2 (optional)">
                  <input className={inputCls} value={newAddr.line2} onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })} placeholder="Area, Landmark" />
                </Field>
                <Field label="City">
                  <input className={inputCls} value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
                </Field>
                <Field label="PIN code" error={addrErrors.pincode}>
                  <input className={cn(inputCls, addrErrors.pincode && "border-red-300")} value={newAddr.pincode} onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })} inputMode="numeric" maxLength={6} placeholder="560102" />
                </Field>
                <Field label="Save as">
                  <select
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
                  <button onClick={saveNewAddress} className="h-11 flex-1 rounded-xl bg-forest-900 text-sm font-bold text-white transition hover:bg-forest-800">
                    Save address
                  </button>
                  <button onClick={() => setShowNewAddress(false)} className="h-11 rounded-xl border border-forest-200 px-4 text-sm font-semibold text-charcoal transition hover:bg-soft">
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* Step 3 — slot */}
        <section aria-label="Delivery slot" className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
          <StepHeader n={3} title="Delivery slot" hint="Dawn-picked produce rides straight to you." />
          <div className="grid gap-2.5 sm:grid-cols-3" role="radiogroup" aria-label="Choose delivery slot">
            {DELIVERY_SLOTS.map((s: DeliverySlot) => (
              <button
                key={s.id}
                role="radio"
                aria-checked={slotId === s.id}
                disabled={s.capacity === "full"}
                onClick={() => setSlotId(s.id)}
                className={cn(
                  "rounded-2xl border p-3.5 text-left transition disabled:cursor-not-allowed disabled:opacity-45",
                  slotId === s.id ? "border-forest-800 bg-forest-50/70 ring-1 ring-forest-800" : "border-forest-100 hover:border-forest-300"
                )}
              >
                <span className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-forest-800">{s.day}</span>
                  {s.capacity === "filling-fast" && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">Filling fast</span>
                  )}
                  {s.capacity === "full" && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">Full</span>
                  )}
                </span>
                <span className="mt-1 flex items-center gap-1.5 text-sm font-bold text-charcoal">
                  <Clock className="size-3.5 text-graymute" aria-hidden />
                  {s.window}
                </span>
                <span className={cn("mt-1 block text-[11px] font-semibold", s.fee === 0 ? "text-success" : "text-charcoal")}>
                  {s.fee === 0 ? "Free delivery" : `+${formatPrice(s.fee)} express`}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Step 4 — payment */}
        <section aria-label="Payment method" className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
          <StepHeader n={4} title="Payment method" hint="All payments are simulated in this demo." />
          <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Choose payment method">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.id}
                role="radio"
                aria-checked={payment === pm.id}
                onClick={() => setPayment(pm.id)}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border p-4 text-left transition",
                  payment === pm.id ? "border-forest-800 bg-forest-50/70 ring-1 ring-forest-800" : "border-forest-100 hover:border-forest-300"
                )}
              >
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-800">
                  {pm.id === "upi" && <Zap className="size-4" aria-hidden />}
                  {pm.id === "card" && <CreditCard className="size-4" aria-hidden />}
                  {pm.id === "wallet" && <Wallet className="size-4" aria-hidden />}
                  {pm.id === "cod" && <ShoppingBasket className="size-4" aria-hidden />}
                </span>
                <span>
                  <span className="block text-sm font-bold text-charcoal">{pm.label}</span>
                  <span className="mt-0.5 block text-xs text-graymute">{pm.hint}</span>
                </span>
                {payment === pm.id && <CheckCircle2 className="ml-auto size-5 shrink-0 text-forest-700" aria-hidden />}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* summary column */}
      <aside aria-label="Order summary" className="lg:sticky lg:top-40 lg:self-start">
        <div className="space-y-4">
          <OrderSummary ctaLabel="Place order" onCta={placeOrderNow} disabled={placing} sticky={false} />
          {slotFee > 0 && (
            <p className="rounded-xl bg-soft px-3.5 py-2.5 text-xs text-graymute">
              Includes {formatPrice(slotFee)} express slot fee for {selectedSlot?.day} {selectedSlot?.window}.
            </p>
          )}
          {placing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass flex items-center justify-center gap-2 rounded-2xl p-4 text-sm font-semibold text-forest-900"
              role="status"
            >
              <span className="size-4 animate-spin rounded-full border-2 border-forest-700 border-t-transparent" aria-hidden />
              Simulating payment & farmer confirmation…
            </motion.div>
          )}
        </div>
      </aside>

      {/* mobile sticky place-order */}
      <div className="glass-strong fixed inset-x-3 bottom-20 z-40 flex items-center justify-between gap-3 rounded-2xl p-3 lg:hidden">
        <div className="pl-1">
          <p className="text-[11px] text-graymute">Total to pay</p>
          <p className="text-base font-extrabold text-charcoal">{formatPrice(grandTotal)}</p>
        </div>
        <button
          onClick={placeOrderNow}
          disabled={placing}
          className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-forest-900 px-5 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60"
        >
          {placing ? "Placing…" : "Place order"}
          {!placing && <ChevronRight className="size-4" aria-hidden />}
        </button>
      </div>
    </div>
  );
}
