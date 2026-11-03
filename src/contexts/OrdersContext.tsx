"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Order } from "@/types";
import { MOCK_ORDERS } from "@/data/orders";
import { readStorage, writeStorage } from "@/utils/storage";

const ORDERS_KEY = "verdant.orders.v1";

interface OrdersContextValue {
  orders: Order[];
  getOrder: (id: string) => Order | undefined;
  placeOrder: (order: Order) => void;
  cancelOrder: (id: string) => void;
  requestReturn: (id: string) => void;
  reorder: (id: string) => { ok: boolean; message: string; outOfStock: string[] };
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStorage<Order[] | null>(ORDERS_KEY, null);
    if (stored && stored.length) setOrders(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(ORDERS_KEY, orders);
  }, [orders, hydrated]);

  const getOrder = useCallback((id: string) => orders.find((o) => o.id === id), [orders]);

  const placeOrder = useCallback((order: Order) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const cancelOrder = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: "cancelled",
              canCancel: false,
              canReturn: false,
              tracking: [
                ...o.tracking,
                {
                  id: `${o.id}-cancel`,
                  status: "cancelled" as const,
                  title: "Order cancelled",
                  description: "Refund of the full amount initiated to the original payment method (simulated).",
                  timestamp: new Date().toISOString(),
                  completed: true,
                },
              ],
            }
          : o
      )
    );
  }, []);

  const requestReturn = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: "return-requested",
              canReturn: false,
              tracking: [
                ...o.tracking,
                {
                  id: `${o.id}-return`,
                  status: "return-requested" as const,
                  title: "Return requested",
                  description: "Instant refund to Mithren Agro Wallet once approved (simulated).",
                  timestamp: new Date().toISOString(),
                  completed: true,
                },
              ],
            }
          : o
      )
    );
  }, []);

  const reorder = useCallback(
    (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (!order) return { ok: false, message: "Order not found", outOfStock: [] };
      const outOfStock: string[] = [];
      for (const item of order.items) {
        // The caller adds items to cart; here we only detect availability issues.
        const unavailable = item.quantity > 0 && item.price <= 0;
        if (unavailable) outOfStock.push(item.name);
      }
      return {
        ok: true,
        message: `${order.items.length} item${order.items.length > 1 ? "s" : ""} added back to your basket`,
        outOfStock,
      };
    },
    [orders]
  );

  const value = useMemo(
    () => ({ orders, getOrder, placeOrder, cancelOrder, requestReturn, reorder }),
    [orders, getOrder, placeOrder, cancelOrder, requestReturn, reorder]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used inside <OrdersProvider>");
  return ctx;
}
