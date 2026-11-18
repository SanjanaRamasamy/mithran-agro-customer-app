"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import type { AppNotification } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { safeReturnPath } from "@/utils/safe-redirect";

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
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function parseNotifications(value: unknown): AppNotification[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const record = entry as Record<string, unknown>;
    if (
      typeof record.id !== "string" ||
      typeof record.title !== "string" ||
      typeof record.body !== "string" ||
      typeof record.timestamp !== "string" ||
      !Number.isFinite(Date.parse(record.timestamp)) ||
      typeof record.read !== "boolean"
    ) return [];
    const type = ["order", "offer", "delivery", "system", "price"].includes(String(record.type))
      ? record.type as AppNotification["type"]
      : "system";
    return [{
      id: record.id,
      type,
      title: record.title,
      body: record.body,
      timestamp: record.timestamp,
      read: record.read,
      ...(typeof record.actionLabel === "string" ? { actionLabel: record.actionLabel } : {}),
      ...(typeof record.actionHref === "string"
        ? { actionHref: safeReturnPath(record.actionHref) }
        : {}),
    }];
  });
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    if (!user) {
      setNotifications([]);
      return () => { cancelled = true; };
    }
    void fetch("/api/customer/notifications", { cache: "no-store" })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (
          !response.ok ||
          typeof payload !== "object" ||
          payload === null ||
          !("notifications" in payload)
        ) throw new Error("Unable to load your account notifications.");
        const next = parseNotifications(payload.notifications);
        if (!cancelled) setNotifications(next);
      })
      .catch(() => {
        if (!cancelled) {
          setNotifications([]);
          toast({ kind: "error", title: "Your account notifications could not be loaded." });
        }
      });
    return () => { cancelled = true; };
  }, [authLoading, user?.id, toast]);

  const updateRemote = useCallback(async (body: { id?: string; readAll?: boolean; remove?: boolean }) => {
    try {
      const response = await fetch("/api/customer/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(body),
      });
      const payload: unknown = await response.json();
      if (
        !response.ok ||
        typeof payload !== "object" ||
        payload === null ||
        !("notifications" in payload)
      ) throw new Error("Unable to update your account notifications.");
      setNotifications(parseNotifications(payload.notifications));
    } catch {
      toast({ kind: "error", title: "Your notification changes could not be saved." });
    }
  }, [toast]);

  const markRead = useCallback((id: string) => {
    void updateRemote({ id });
  }, [updateRemote]);

  const markAllRead = useCallback(() => {
    void updateRemote({ readAll: true });
  }, [updateRemote]);

  const remove = useCallback((id: string) => {
    void updateRemote({ id, remove: true });
  }, [updateRemote]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo(
    () => ({ notifications, unreadCount, markRead, markAllRead, remove }),
    [notifications, unreadCount, markRead, markAllRead, remove]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}
