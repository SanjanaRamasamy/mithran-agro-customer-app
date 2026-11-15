"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PackageSearch, ShoppingBasket, UserRound } from "lucide-react";
import { useOrders } from "@/contexts/OrdersContext";
import { useAuth } from "@/contexts/AuthContext";
import { OrderCard } from "@/components/orders/order-card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";
import { ProtectedRoute } from "@/components/auth/protected-route";

const TABS: { key: string; label: string; statuses?: OrderStatus[] }[] = [
  { key: "all", label: "All orders" },
  { key: "active", label: "In progress", statuses: ["placed", "confirmed", "packed", "out-for-delivery", "return-requested"] },
  { key: "delivered", label: "Delivered", statuses: ["delivered"] },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled", "returned"] },
];

function OrdersInner() {
  const { orders } = useOrders();
  const { isAuthenticated, user } = useAuth();
  const [tab, setTab] = useState("all");

  const filtered = useMemo(() => {
    const def = TABS.find((t) => t.key === tab);
    if (!def?.statuses) return orders;
    return orders.filter((o) => def.statuses!.includes(o.status));
  }, [orders, tab]);

  /* guest gate — friendly, one-click demo sign-in */
  if (!isAuthenticated) {
    return (
      <EmptyState
        icon={UserRound}
        title="Sign in to see your orders"
        description="Sign in to view orders associated with your demo account."
        action={{ label: "Sign in", href: "/login?redirect=%2Forders" }}
        secondaryAction={{ label: "Start shopping", href: "/search" }}
        className="mt-6"
      />
    );
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Order filters">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition active:scale-95",
              tab === t.key
                ? "border-forest-900 bg-forest-900 text-white shadow-soft"
                : "border-forest-100 bg-white/80 text-charcoal hover:border-forest-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {filtered.length === 0 ? (
          <EmptyState
            icon={tab === "all" ? ShoppingBasket : PackageSearch}
            title={tab === "all" ? "No orders yet" : `No ${TABS.find((t) => t.key === tab)?.label.toLowerCase()} orders`}
            description={
              tab === "all"
                ? `${user?.name ?? "You"} hasn't placed an order in this demo session yet. The freshest harvest is one tap away.`
                : "Try another tab — orders move through tabs as their status changes."
            }
            action={{ label: "Browse fresh produce", href: "/search" }}
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <motion.div key={order.id} layout>
                <OrderCard order={order} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-xs text-graymute">
          <ol className="flex items-center gap-1.5">
            <li><Link href="/" className="hover:text-forest-800">Home</Link></li>
            <li aria-hidden>/</li>
            <li className="font-semibold text-charcoal">My orders</li>
          </ol>
        </nav>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl">My orders</h1>
        <p className="mt-1 text-sm text-graymute">
          Track deliveries, download invoices, reorder favourites — all simulated with local data.
        </p>
        <OrdersInner />
      </div>
    </ProtectedRoute>
  );
}
