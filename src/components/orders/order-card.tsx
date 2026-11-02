"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, RotateCcw } from "lucide-react";
import type { Order } from "@/types";
import { ORDER_STATUS_CONFIG } from "@/constants";
import { SmartImage } from "@/components/ui/smart-image";
import { formatDateTime, formatPrice } from "@/utils/format";
import { useOrders } from "@/contexts/OrdersContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/NotificationContext";
import { PRODUCT_BY_ID } from "@/data/products";
import { cn } from "@/lib/utils";

export function OrderCard({ order }: { order: Order }) {
  const statusCfg = ORDER_STATUS_CONFIG[order.status];
  const { reorder } = useOrders();
  const cart = useCart();
  const { toast } = useToast();
  const preview = order.items.slice(0, 4);

  const handleReorder = () => {
    const res = reorder(order.id);
    let added = 0;
    for (const item of order.items) {
      if (PRODUCT_BY_ID[item.productId]) {
        cart.addItem(item.productId, item.variantId, item.quantity);
        added += 1;
      }
    }
    if (added) {
      cart.openDrawer();
      toast({
        title: res.message,
        description: "Simulated reorder — basket restored from order items.",
      });
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-forest-50 bg-white p-4 shadow-soft transition-shadow hover:shadow-lift sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-extrabold text-charcoal">{order.id}</p>
          <p className="mt-0.5 text-xs text-graymute">
            Placed {formatDateTime(order.placedAt)} · {order.items.length} {order.items.length === 1 ? "item" : "items"}
          </p>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold", statusCfg.className)}>
          <span className={cn("size-1.5 rounded-full", statusCfg.dotClassName)} aria-hidden />
          {statusCfg.label}
        </span>
      </div>

      <div className="mt-3.5 flex items-center gap-2">
        {preview.map((item) => (
          <SmartImage
            key={item.id}
            src={item.image || PRODUCT_BY_ID[item.productId]?.images[0]}
            alt={item.name}
            emojiSeed={item.name}
            rounded="rounded-xl"
            className="size-12 shrink-0"
            sizes="48px"
          />
        ))}
        {order.items.length > 4 && (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-soft text-xs font-bold text-forest-800">
            +{order.items.length - 4}
          </span>
        )}
        <div className="ml-auto text-right">
          <p className="text-[11px] text-graymute">Total</p>
          <p className="text-sm font-extrabold text-charcoal">{formatPrice(order.totals.total)}</p>
        </div>
      </div>

      <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-forest-50 pt-3.5">
        <p className="mr-auto text-xs text-graymute">
          Slot: <span className="font-semibold text-charcoal">{order.scheduledSlot}</span>
        </p>
        <button
          onClick={handleReorder}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-forest-700 transition hover:bg-forest-50"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Reorder
        </button>
        <Link
          href={`/orders/${order.id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-forest-900 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-forest-800 active:scale-95"
        >
          {order.status === "delivered" || order.status === "cancelled" ? "View details" : "Track order"}
          <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </motion.article>
  );
}
