"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import type { AppNotification } from "@/types";
import { MOCK_NOTIFICATIONS } from "@/data/offers";
import { readStorage, writeStorage } from "@/utils/storage";

/* ================= Toasts (ephemeral, animated) ================= */

type ToastKind = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (t: { kind?: ToastKind; title: string; description?: string }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_STYLE: Record<ToastKind, { icon: React.ElementType; ring: string; bar: string }> = {
  success: { icon: CheckCircle2, ring: "ring-forest-200", bar: "bg-forest-500" },
  error: { icon: XCircle, ring: "ring-red-200", bar: "bg-red-500" },
  warning: { icon: TriangleAlert, ring: "ring-amber-200", bar: "bg-amber-500" },
  info: { icon: Info, ring: "ring-blue-200", bar: "bg-blue-500" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    ({ kind = "success", title, description }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, kind, title, description }]);
      window.setTimeout(() => dismiss(id), 3600);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast viewport — bottom center on mobile, bottom right on desktop */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[95] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end sm:px-0"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const S = TOAST_STYLE[t.kind];
            const Icon = S.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl bg-white/95 shadow-glass ring-1 ${S.ring} backdrop-blur-xl`}
                role="status"
              >
                <div className={`absolute inset-y-0 left-0 w-1 ${S.bar}`} aria-hidden />
                <div className="flex items-start gap-3 py-3.5 pl-5 pr-10">
                  <Icon className="mt-0.5 size-5 shrink-0 text-forest-700" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-charcoal">{t.title}</p>
                    {t.description && (
                      <p className="mt-0.5 text-xs leading-relaxed text-graymute">{t.description}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="absolute right-2 top-2 rounded-md p-1.5 text-graymute transition hover:bg-soft hover:text-charcoal"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/* ============= Notification centre (persistent list) ============= */

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  push: (n: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);
const NTF_KEY = "verdant.notifications.v1";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setNotifications(readStorage<AppNotification[]>(NTF_KEY, MOCK_NOTIFICATIONS));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(NTF_KEY, notifications);
  }, [notifications, hydrated]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const remove = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const push = useCallback((n: Omit<AppNotification, "id" | "timestamp" | "read">) => {
    setNotifications((prev) => [
      {
        ...n,
        id: `ntf-${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo(
    () => ({ notifications, unreadCount, markRead, markAllRead, remove, push }),
    [notifications, unreadCount, markRead, markAllRead, remove, push]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}
