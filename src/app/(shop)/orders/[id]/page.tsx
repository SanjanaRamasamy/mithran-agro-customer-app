"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  RotateCcw,
  ReceiptText,
} from "lucide-react";
import { useOrders } from "@/contexts/OrdersContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/NotificationContext";
import { TrackingTimeline } from "@/components/orders/tracking-timeline";
import { ORDER_STATUS_CONFIG } from "@/constants";
import { SmartImage } from "@/components/ui/smart-image";
import { formatDateTime, formatDate, formatPrice } from "@/utils/format";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useCatalog } from "@/contexts/CatalogContext";

function OrderDetailInner({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { getOrder, isLoading, error } = useOrders();
  const cart = useCart();
  const { products } = useCatalog();
  const { toast } = useToast();
  const order = getOrder(orderId);

  if (!order) {
    if (isLoading) {
      return <div className="mx-auto max-w-4xl shimmer h-72 rounded-2xl" role="status" aria-label="Loading order" />;
    }
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-dashed border-forest-200 bg-white/60 px-6 py-16 text-center">
        <span className="text-5xl" aria-hidden>📦</span>
        <h1 className="mt-4 text-xl font-bold text-charcoal">{error ? "Unable to load order" : "Order not found"}</h1>
        <p className="mt-1.5 text-sm text-graymute">
          {error ?? "This order is unavailable for your customer account."}
        </p>
        <Link
          href="/orders"
          className="mt-6 inline-flex h-12 items-center rounded-2xl bg-forest-900 px-6 text-sm font-bold text-white transition hover:bg-forest-800"
        >
          Back to my orders
        </Link>
      </div>
    );
  }

  const statusCfg = ORDER_STATUS_CONFIG[order.status];

  const handleReorder = () => {
    const unavailable: string[] = [];
    let added = 0;
    for (const item of order.items) {
      const product = products.find((entry) => entry.id === item.productId);
      const variant = product?.variants[0];
      if (!product || !variant) {
        unavailable.push(item.name);
        continue;
      }
      const result = cart.addItem(product.id, variant.id, item.quantity);
      if (result.ok) {
        added += 1;
      } else {
        unavailable.push(item.name);
      }
    }
    if (added) {
      cart.openDrawer();
      toast({
        title: `${added} item${added === 1 ? "" : "s"} added to your basket.`,
        description: unavailable.length
          ? `Unavailable or changed: ${unavailable.join(", ")}.`
          : "Review current availability and prices before checkout.",
      });
    } else {
      toast({
        kind: "error",
        title: "No order items could be added.",
        description: unavailable.length ? `Unavailable or changed: ${unavailable.join(", ")}.` : undefined,
      });
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* header */}
      <button
        onClick={() => router.push("/orders")}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-graymute transition hover:text-forest-800"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        All orders
      </button>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl">{order.reference ?? order.id}</h1>
          <p className="mt-1 text-sm text-graymute">
            Placed {formatDateTime(order.placedAt)} · Invoice {order.invoiceNo}
          </p>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold", statusCfg.className)}>
          <span className={cn("size-1.5 rounded-full", statusCfg.dotClassName)} aria-hidden />
          {statusCfg.label}
        </span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* left column */}
        <div className="space-y-6">
          {/* live tracking */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            aria-label="Tracking"
            className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-charcoal">Tracking timeline</h2>
              <span className="text-xs font-semibold text-forest-700">
                {order.deliveryPartner ?? "Store carrier"}
              </span>
            </div>
            <TrackingTimeline events={order.tracking} />
          </motion.section>

          {/* items */}
          <section aria-label="Items" className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
            <h2 className="mb-4 text-base font-bold text-charcoal">
              Items ({order.items.length})
            </h2>
            <ul className="divide-y divide-forest-50">
              {order.items.map((item) => {
                const productImage = item.image || products.find((p) => p.id === item.productId)?.images[0] || "";
                return (
                <li key={item.id} className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0">
                  <SmartImage
                    src={productImage}
                    alt={item.name}
                    emojiSeed={item.name}
                    rounded="rounded-xl"
                    className="size-16 shrink-0"
                    sizes="64px"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${item.productId}`}
                      className="block truncate text-sm font-bold text-charcoal hover:text-forest-800"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-graymute">
                      {item.packLabel} · Qty {item.quantity} · by {item.sellerName.replace(/-/g, " ")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-charcoal">{formatPrice(item.lineTotal)}</p>
                    {item.mrp > item.price && (
                      <p className="text-[11px] text-graymute line-through">{formatPrice(item.mrp * item.quantity)}</p>
                    )}
                  </div>
                </li>
                );
              })}
            </ul>

            {/* payment summary */}
            <dl className="mt-4 space-y-2 border-t border-forest-50 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-graymute">Subtotal</dt>
                <dd className="font-semibold text-charcoal">{formatPrice(order.totals.subtotal)}</dd>
              </div>
              {order.totals.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-graymute">Coupon {order.couponCode ? `(${order.couponCode})` : ""}</dt>
                  <dd className="font-semibold text-success">−{formatPrice(order.totals.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-graymute">Delivery + handling + packing</dt>
                <dd className="font-semibold text-charcoal">
                  {formatPrice(order.totals.deliveryFee + order.totals.handlingFee + order.totals.greenFee)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-graymute">GST</dt>
                <dd className="font-semibold text-charcoal">{formatPrice(order.totals.tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-forest-50 pt-2.5 text-base">
                <dt className="font-bold text-charcoal">Order total</dt>
                <dd className="font-extrabold text-charcoal">{formatPrice(order.totals.total)}</dd>
              </div>
            </dl>
          </section>
        </div>

        {/* right column */}
        <div className="space-y-4">
          {/* address & payment */}
          <section aria-label="Delivery and payment" className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
            <h2 className="flex items-center gap-2 text-sm font-bold text-charcoal">
              <MapPin className="size-4 text-forest-700" aria-hidden />
              Delivery address
            </h2>
            <p className="mt-2 text-sm font-semibold text-charcoal">
              {order.address.name} · {order.address.label}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-graymute">
              {order.address.line1}
              {order.address.line2 ? `, ${order.address.line2}` : ""}
              <br />
              {order.address.city}, {order.address.state} — {order.address.pincode}
              <br />
              {order.address.phone}
            </p>
            {order.address.deliveryInstructions && (
              <p className="mt-2 rounded-lg bg-soft px-3 py-2 text-[11px] text-graymute">
                📝 {order.address.deliveryInstructions}
              </p>
            )}
            <div className="mt-4 border-t border-forest-50 pt-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-charcoal">
                <ReceiptText className="size-4 text-forest-700" aria-hidden />
                Payment
              </h2>
              <p className="mt-2 text-xs text-graymute">{order.paymentMethod}</p>
              <p className="text-xs text-graymute">
                Payment status: {order.paymentStatus === "paid" ? "Paid" : "Pending"}
              </p>
              <p className="text-xs text-graymute">Order reference: {order.reference ?? order.id}</p>
            </div>
            <div className="mt-4 border-t border-forest-50 pt-3">
              <p className="text-xs text-graymute">Delivery slot</p>
              <p className="text-xs font-bold text-charcoal">{order.scheduledSlot}</p>
              {order.deliveredAt && (
                <p className="mt-1 text-xs text-success">
                  Delivered on {formatDate(order.deliveredAt, "long")}
                </p>
              )}
            </div>
          </section>

          <section aria-label="Order actions" className="space-y-2.5 rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
            <h2 className="text-sm font-bold text-charcoal">Actions</h2>
            <button
              onClick={handleReorder}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-forest-900 text-sm font-bold text-white transition hover:bg-forest-800 active:scale-[0.98]"
            >
              <RotateCcw className="size-4" aria-hidden />
              Reorder items
            </button>
            <p className="text-xs leading-relaxed text-graymute">
              Contact store support for order changes or invoices. Cash on Delivery orders remain unpaid until collection is recorded by the store.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
  return (
    <ProtectedRoute>
      <div className="px-4 py-8 sm:px-6">
        <OrderDetailInner orderId={orderId} />
      </div>
    </ProtectedRoute>
  );
}
