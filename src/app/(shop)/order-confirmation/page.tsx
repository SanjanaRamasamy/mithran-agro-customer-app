"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, Package, Sprout, Truck } from "lucide-react";
import { useOrders } from "@/contexts/OrdersContext";
import { formatPrice, formatDate } from "@/utils/format";
import { ProtectedRoute } from "@/components/auth/protected-route";

function ConfirmationInner() {
  const params = useSearchParams();
  const orderId = params.get("id");
  const { getOrder, isLoading, error } = useOrders();
  const order = orderId ? getOrder(orderId) : undefined;

  if (!order) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-dashed border-forest-200 bg-white/60 px-6 py-16 text-center">
        <span className="text-5xl" aria-hidden>🌱</span>
        <h1 className="mt-4 text-xl font-bold text-charcoal">
          {isLoading ? "Loading your order…" : error ? "Order confirmation unavailable" : "Order not found"}
        </h1>
        <p className="mt-1.5 text-sm text-graymute">
          {error ?? "We could not find this order in your Agro customer account."}
        </p>
        <Link
          href="/orders"
          className="mt-6 inline-flex h-12 items-center rounded-2xl bg-forest-900 px-6 text-sm font-bold text-white transition hover:bg-forest-800"
        >
          View your orders
        </Link>
      </div>
    );
  }

  const eta = order.scheduledSlot;

  return (
    <div className="mx-auto max-w-2xl">
      {/* success hero */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="rounded-3xl bg-gradient-to-br from-forest-900 to-forest-700 p-8 text-center text-white shadow-glass sm:p-10"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 14 }}
          className="mx-auto flex size-16 items-center justify-center rounded-full bg-lime-natural text-forest-950"
        >
          <Leaf className="size-8" aria-hidden />
        </motion.span>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Order placed
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-forest-50/90">
          Your Agro order <strong>{order.reference ?? order.id}</strong> has been placed. Cash on Delivery is due when the order arrives.
        </p>
        <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-2xl bg-white/10 px-5 py-3 text-sm backdrop-blur-sm">
          <span className="flex items-center gap-2">
            <Truck className="size-4 text-lime-natural" aria-hidden />
            {eta}
          </span>
          <span className="flex items-center gap-2">
            <Package className="size-4 text-lime-natural" aria-hidden />
            {order.items.length} {order.items.length === 1 ? "item" : "items"}
          </span>
          <span className="font-bold">{formatPrice(order.totals.total)}</span>
        </div>
      </motion.div>

      {/* actions */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href={`/orders/${order.id}`}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-forest-900 text-sm font-bold text-white transition hover:bg-forest-800 active:scale-[0.98]"
        >
          Track order
          <ArrowRight className="size-4" aria-hidden />
        </Link>
        <Link
          href="/"
          className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-forest-200 bg-white text-sm font-bold text-forest-800 transition hover:bg-forest-50 active:scale-[0.98]"
        >
          <Sprout className="size-4" aria-hidden />
          Keep shopping
        </Link>
      </div>

      {/* mini summary */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 rounded-2xl border border-forest-50 bg-white p-5 shadow-soft"
        aria-label="Order summary"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-charcoal">Order summary</h2>
          <span className="text-xs text-graymute">Placed {formatDate(order.placedAt)}</span>
        </div>
        <ul className="mt-3 divide-y divide-forest-50">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0 truncate text-charcoal">
                {item.name} <span className="text-graymute">× {item.quantity}</span>
              </span>
              <span className="shrink-0 font-semibold text-charcoal">{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-forest-50 pt-3 text-sm">
          <span className="font-bold text-charcoal">
            {order.paymentMethod} · {order.paymentStatus === "paid" ? "Paid" : "Payment due on delivery"}
          </span>
          <span className="font-extrabold text-charcoal">{formatPrice(order.totals.total)}</span>
        </div>
        <p className="mt-3 text-center text-[11px] text-graymute">
          Payment is due on delivery and will be updated once collection is recorded.
        </p>
      </motion.section>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <ProtectedRoute>
      <div className="px-4 py-10 sm:py-14">
        <Suspense
          fallback={
            <div className="mx-auto max-w-2xl">
              <div className="shimmer h-64 rounded-3xl" />
            </div>
          }
        >
          <ConfirmationInner />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}
