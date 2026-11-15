"use client";

import React from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider, NotificationProvider } from "@/contexts/NotificationContext";
import { CatalogProvider } from "@/contexts/CatalogContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthPromptProvider } from "@/contexts/AuthPromptContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { OrdersProvider } from "@/contexts/OrdersContext";
import { ActivityProvider } from "@/contexts/ActivityContext";

/**
 * Single composition point for every client context.
 * Auth prompts and customer data depend on Auth; catalog-dependent shopping contexts follow Catalog.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <CatalogProvider>
          <AuthProvider>
            <AuthPromptProvider>
              <NotificationProvider>
                <CartProvider>
                  <WishlistProvider>
                    <OrdersProvider>
                      <ActivityProvider>{children}</ActivityProvider>
                    </OrdersProvider>
                  </WishlistProvider>
                </CartProvider>
              </NotificationProvider>
            </AuthPromptProvider>
          </AuthProvider>
        </CatalogProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
