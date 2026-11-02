"use client";

import { Suspense } from "react";
import { Header } from "./header";
import { AnnouncementBar } from "./announcement-bar";
import { Footer } from "./footer";
import { CartDrawer } from "./cart-drawer";
import { MobileTabBar } from "./mobile-tab-bar";

/**
 * Global chrome shared by every route:
 * announcement ticker → glass header → content → sticky footer.
 * The basket drawer and mobile tab bar are portal-style overlays.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Suspense fallback={<div className="h-16 border-b border-forest-50 bg-warm/80" aria-hidden />}>
        <Header />
      </Suspense>
      <main id="main-content" className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <MobileTabBar />
    </div>
  );
}
