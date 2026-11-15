"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Order } from "@/types";
import { MOCK_ORDERS } from "@/data/orders";
import { readStorage, writeStorage } from "@/utils/storage";
import { useAuth } from "@/contexts/AuthContext";
import { canPlaceOrderForCustomer, getCustomerOrders } from "@/utils/customer-access";

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
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [hydrated, setHydrated] = useState(false);
  const customerOrders = useMemo(
    () => isAuthenticated && user ? getCustomerOrders(orders, user.id) : [],
    [orders, user, isAuthenticated]
  );

  useEffect(() => {
    const stored = readStorage<Order[] | null>(ORDERS_KEY, null);
    if (stored && stored.length) setOrders(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(ORDERS_KEY, orders);
  }, [orders, hydrated]);

  const getOrder = useCallback(
    (id: string) => customerOrders.find((order) => order.id === id),
    [customerOrders]
  );

  const placeOrder = useCallback((order: Order) => {
    if (!canPlaceOrderForCustomer(isAuthenticated, user?.id, order.userId)) return;
    setOrders((prev) => [order, ...prev]);
  }, [isAuthenticated, user]);

  const cancelOrder = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id && o.userId === user?.id
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
  }, [user]);

  const requestReturn = useCallback((id: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id && o.userId === user?.id
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
  }, [user]);

  const reorder = useCallback(
    (id: string) => {
      const order = customerOrders.find((o) => o.id === id);
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
    [customerOrders]
  );

  const value = useMemo(
    () => ({ orders: customerOrders, getOrder, placeOrder, cancelOrder, requestReturn, reorder }),
    [customerOrders, getOrder, placeOrder, cancelOrder, requestReturn, reorder]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used inside <OrdersProvider>");
  return ctx;
}
