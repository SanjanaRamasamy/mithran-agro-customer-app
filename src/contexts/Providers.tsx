"use client";

import React from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider, NotificationProvider } from "@/contexts/NotificationContext";
import { CatalogProvider } from "@/contexts/CatalogContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { OrdersProvider } from "@/contexts/OrdersContext";
import { ActivityProvider } from "@/contexts/ActivityContext";

/**
 * Single composition point for every client context.
 * Order matters: Theme → Toast → Catalog → Notification → Auth → Cart → Wishlist → Orders → Activity.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <CatalogProvider>
          <AuthProvider>
            <NotificationProvider>
              <CartProvider>
                <WishlistProvider>
                  <OrdersProvider>
                    <ActivityProvider>{children}</ActivityProvider>
                  </OrdersProvider>
                </WishlistProvider>
              </CartProvider>
            </NotificationProvider>
          </AuthProvider>
        </CatalogProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
