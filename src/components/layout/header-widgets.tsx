"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Headset,
  Heart,
  LogOut,
  Package,
  Settings,
  ShoppingBasket,
  Sparkles,
  Star,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useNotifications, useToast } from "@/contexts/NotificationContext";
import { useAuthPrompt } from "@/contexts/AuthPromptContext";
import { useDismissableDropdown } from "@/hooks/useDismissableDropdown";
import { cn } from "@/lib/utils";
import { RelativeTime } from "@/components/ui/relative-time";

/** Bell with unread badge + dismissable glass dropdown of notifications. */
export function NotificationsBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { user } = useAuth();
  const router = useRouter();
  const { open, toggle, close, containerRef } = useDismissableDropdown(true);

  const latest = notifications.slice(0, 6);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Notifications (${unreadCount} unread)`}
        className="relative flex size-10 items-center justify-center rounded-xl text-charcoal transition hover:bg-forest-50"
      >
        <Bell className="size-[18px]" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="glass-strong absolute right-0 top-[calc(100%+10px)] z-50 w-80 rounded-2xl p-2 shadow-lift sm:w-96"
        >
          <div className="flex items-center justify-between px-3 pb-2 pt-1.5">
            <p className="text-sm font-bold text-charcoal">
              Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
            </p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-semibold text-forest-700 hover:text-forest-900"
              >
                Mark all read
              </button>
            )}
          </div>
          {latest.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-graymute">
              No notifications yet.
            </p>
          ) : (
            <ul className="max-h-80 space-y-1 overflow-y-auto">
              {latest.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markRead(n.id);
                      close();
                      if (n.actionHref) router.push(n.actionHref);
                    }}
                    className={cn(
                      "w-full rounded-xl px-3 py-2.5 text-left transition hover:bg-soft",
                      !n.read && "bg-lime-soft/40",
                    )}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-charcoal">{n.title}</span>
                      {!n.read && (
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-forest-500" aria-label="unread" />
                      )}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-graymute">
                      {n.body}
                    </span>
                    <RelativeTime
                      timestamp={n.timestamp}
                      className="mt-1 block text-[11px] text-graymute/80"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!user && (
            <p className="px-3 pb-2 pt-1 text-[11px] text-graymute">
              Sign in to view notifications for your Agro account.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Account menu — avatar when signed in, "Sign in" pill otherwise. */
export function AccountMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const { open, toggle, close, containerRef } = useDismissableDropdown(true);

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-forest-900 px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-forest-800 active:scale-95"
      >
        <User className="size-4" aria-hidden />
        <span className="hidden sm:inline">Sign in</span>
      </Link>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-forest-50"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-forest-600 to-forest-900 text-xs font-bold text-white">
          {user?.name?.charAt(0).toUpperCase() ?? "M"}
        </span>
        <span className="hidden max-w-[80px] truncate text-sm font-semibold text-charcoal lg:block">
          {user?.name?.split(" ")[0]}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account options"
          className="glass-strong absolute right-0 top-[calc(100%+10px)] z-50 w-64 rounded-2xl p-2 shadow-lift"
        >
          <div className="border-b border-forest-50 px-3 pb-3 pt-1.5">
            <p className="truncate text-sm font-bold text-charcoal">{user?.name}</p>
            <p className="truncate text-xs text-graymute">{user?.email}</p>
            <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-lime-soft px-2 py-0.5 text-[10px] font-bold text-lime-deep">
              <Sparkles className="size-3" aria-hidden />
              {user?.loyaltyPoints.toLocaleString("en-IN")} leaf points · {user?.tier}
            </p>
          </div>
          <ul className="pt-1.5">
            {[
              { label: "My Profile", href: "/account", icon: User },
              { label: "My Orders", href: "/orders", icon: Package },
              { label: "My Reviews", href: "/account/reviews", icon: Star },
              { label: "Support", href: "/account/support", icon: Headset },
              { label: "Settings & Privacy", href: "/account?tab=settings", icon: Settings },
            ].map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <Link
                  href={href}
                  role="menuitem"
                  onClick={close}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-charcoal transition hover:bg-soft"
                >
                  <Icon className="size-4 text-forest-700" aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
            <li className="border-t border-forest-50 pt-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={async () => {
                  close();
                  try {
                    await logout();
                    router.push("/");
                  } catch (error) {
                    toast({
                      kind: "error",
                      title: error instanceof Error ? error.message : "Unable to confirm sign out.",
                    });
                  }
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="size-4" aria-hidden />
                Log out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

/** Wishlist icon-link with live count. */
export function WishlistLink() {
  const { isAuthenticated } = useAuth();
  const { showAuthPrompt } = useAuthPrompt();
  if (!isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => showAuthPrompt({ kind: "wishlist", returnTo: "/wishlist" })}
        aria-label="Sign in to view wishlist"
        className="flex size-10 items-center justify-center rounded-xl text-charcoal transition hover:bg-forest-50 active:scale-90"
      >
        <Heart className="size-[18px]" aria-hidden />
      </button>
    );
  }

  return (
    <Link
      href="/wishlist"
      aria-label="View wishlist"
      className="flex size-10 items-center justify-center rounded-xl text-charcoal transition hover:bg-forest-50 active:scale-90"
    >
      <Heart className="size-[18px]" aria-hidden />
    </Link>
  );
}

/** Cart icon-link with live item count. */
export function CartLink() {
  const { itemCount } = useCart();
  return (
    <Link
      href="/cart"
      aria-label={`Basket, ${itemCount} items`}
      className="relative flex size-10 items-center justify-center rounded-xl text-charcoal transition hover:bg-forest-50 active:scale-90"
    >
      <ShoppingBasket className="size-[18px]" aria-hidden />
      <CartCountBadge count={itemCount} />
    </Link>
  );
}

export function CartCountBadge({ count }: { count: number }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.4, opacity: 0 }}
          className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-lime-natural px-1 text-[10px] font-bold text-forest-950"
          aria-hidden
        >
          {count > 99 ? "99+" : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
