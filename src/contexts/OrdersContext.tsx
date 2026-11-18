"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Order } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { parseCustomerOrder, parseCustomerOrders } from "@/lib/customer-order";

interface OrdersContextValue {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  getOrder: (id: string) => Order | undefined;
  placeOrder: (order: Order) => void;
}

interface OrdersPayload {
  success: boolean;
  orders?: unknown;
  order?: unknown;
  message?: string;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

function isOrdersPayload(value: unknown): value is OrdersPayload {
  return typeof value === "object" && value !== null;
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);

  useEffect(() => {
    if (authLoading) return;
    const version = ++requestVersion.current;
    if (!isAuthenticated || !user) {
      setOrders([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    void fetch("/api/customer/orders", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          throw new Error("Order service returned an invalid response.");
        }
        if (!response.ok || !isOrdersPayload(payload) || payload.success !== true) {
          throw new Error(
            isOrdersPayload(payload) && typeof payload.message === "string"
              ? payload.message
              : "Unable to load your Mithran Agro orders.",
          );
        }
        const parsed = parseCustomerOrders(payload.orders);
        if (!parsed) throw new Error("Order service returned invalid order data.");
        if (parsed.some((order) => order.userId !== user.id)) {
          throw new Error("Order service returned data for a different customer.");
        }
        if (version !== requestVersion.current) return;
        setOrders(parsed);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted || version !== requestVersion.current) return;
        setOrders([]);
        setError(cause instanceof Error ? cause.message : "Unable to load your orders.");
      })
      .finally(() => {
        if (!controller.signal.aborted && version === requestVersion.current) setIsLoading(false);
      });

    return () => controller.abort();
  }, [authLoading, isAuthenticated, user]);

  const getOrder = useCallback(
    (id: string) => orders.find((order) => order.id === id),
    [orders],
  );

  const placeOrder = useCallback((value: Order) => {
    const order = parseCustomerOrder(value);
    if (!order || order.userId !== user?.id || !isAuthenticated) {
      throw new Error("The confirmed order could not be verified for this account.");
    }
    requestVersion.current += 1;
    setIsLoading(false);
    setError(null);
    setOrders((previous) => [order, ...previous.filter((item) => item.id !== order.id)]);
  }, [isAuthenticated, requestVersion, user]);

  const value = useMemo(
    () => ({ orders, isLoading, error, getOrder, placeOrder }),
    [orders, isLoading, error, getOrder, placeOrder],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used inside <OrdersProvider>");
  return ctx;
}
