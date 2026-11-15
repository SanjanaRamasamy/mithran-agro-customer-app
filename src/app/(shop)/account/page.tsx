"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  CreditCard,
  LogOut,
  MapPin,
  Moon,
  Package,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/NotificationContext";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/switch";
import { timeAgo, formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/components/auth/protected-route";

const TABS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "settings", label: "Settings", icon: ShieldCheck },
] as const;

const inputCls =
  "h-11 w-full rounded-xl border border-forest-100 bg-white px-3.5 text-sm text-charcoal outline-none transition focus:border-forest-300 focus:ring-2 focus:ring-forest-200";

function AccountInner() {
  const params = useSearchParams();
  const initialTab = params.get("tab") ?? "profile";
  const [tab, setTab] = useState<string>(TABS.some((t) => t.key === initialTab) ? initialTab : "profile");
  const { user, isAuthenticated, isLoading, logout, updateProfile, addresses, deleteAddress, setDefaultAddress, paymentMethods } = useAuth();
  const { notifications, markRead, markAllRead, remove } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });
  const [profileReady, setProfileReady] = useState(false);
  const [prefs, setPrefs] = useState({ orderUpdates: true, offers: true, harvestNewsletter: false, priceDrops: true });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
        <div className="shimmer h-24 rounded-2xl" />
        <div className="shimmer h-64 rounded-2xl" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <EmptyState
        icon={User}
        title="Sign in to manage your account"
        description="Profile, addresses, saved payments and settings live in your account. Everything is stored locally in this demo."
        action={{ label: "Sign in", href: "/login?redirect=%2Faccount" }}
        className="mt-8"
      />
    );
  }

  if (!profileReady) {
    setProfileForm({ name: user.name, email: user.email, phone: user.phone });
    setProfileReady(true);
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* loyalty header card */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-3xl bg-gradient-to-br from-forest-900 to-forest-700 p-6 text-white shadow-glass sm:p-8"
      >
        <div className="flex flex-wrap items-center gap-5">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-white/10 text-2xl font-extrabold ring-1 ring-white/20">
            {user.name.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{user.name}</h1>
            <p className="mt-0.5 truncate text-sm text-forest-50/80">{user.email} · {user.phone}</p>
            <p className="mt-1 text-xs text-forest-50/60">
              Member since {formatDate(user.memberSince, "long")}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 px-5 py-3.5 text-center ring-1 ring-white/15 backdrop-blur-sm">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-lime-natural">
              <Sparkles className="size-3.5" aria-hidden />
              {user.tier} tier
            </p>
            <p className="mt-1 text-2xl font-extrabold">{user.loyaltyPoints.toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-forest-50/70">leaf points (₹ = 1 pt)</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/orders" className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-4 text-xs font-bold ring-1 ring-white/20 transition hover:bg-white/15">
            <Package className="size-3.5" aria-hidden />
            My orders
          </Link>
          <Link href="/wishlist" className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/10 px-4 text-xs font-bold ring-1 ring-white/20 transition hover:bg-white/15">
            Wishlist
          </Link>
        </div>
      </motion.section>

      {/* tabs */}
      <div className="no-scrollbar mt-6 flex gap-1.5 overflow-x-auto" role="tablist" aria-label="Account sections">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
              tab === key ? "bg-forest-900 text-white shadow-soft" : "text-charcoal hover:bg-forest-50"
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
        {/* PROFILE */}
        {tab === "profile" && (
          <section aria-label="Edit profile" className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-base font-bold text-charcoal">Personal information</h2>
            <p className="mt-0.5 text-xs text-graymute">Changes save to your local demo session only.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="pf-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-graymute">Full name</label>
                <input id="pf-name" className={inputCls} value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
              </div>
              <div>
                <label htmlFor="pf-phone" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-graymute">Phone</label>
                <input id="pf-phone" className={inputCls} value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="pf-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-graymute">Email</label>
                <input id="pf-email" type="email" className={inputCls} value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
              </div>
            </div>
            <button
              onClick={() => {
                updateProfile(profileForm);
                toast({ title: "Profile updated", description: "Saved to your local demo session." });
              }}
              className="mt-5 inline-flex h-11 items-center rounded-xl bg-forest-900 px-6 text-sm font-bold text-white transition hover:bg-forest-800 active:scale-95"
            >
              Save changes
            </button>
          </section>
        )}

        {/* ADDRESSES */}
        {tab === "addresses" && (
          <section aria-label="Saved addresses" className="grid gap-3 sm:grid-cols-2">
            {addresses.map((a) => (
              <article key={a.id} className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-forest-800">
                    <MapPin className="size-3.5" aria-hidden />
                    {a.label}
                  </span>
                  {a.isDefault ? (
                    <span className="rounded-full bg-lime-soft px-2 py-0.5 text-[10px] font-bold text-lime-deep">Default</span>
                  ) : (
                    <button
                      onClick={() => setDefaultAddress(a.id)}
                      className="text-[11px] font-bold text-forest-700 hover:text-forest-900"
                    >
                      Make default
                    </button>
                  )}
                </div>
                <p className="mt-2 text-sm font-bold text-charcoal">{a.name}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-graymute">
                  {a.line1}{a.line2 ? `, ${a.line2}` : ""}
                  <br />
                  {a.city}, {a.state} — {a.pincode}
                  <br />
                  {a.phone}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-forest-50 pt-3">
                  <button
                    onClick={() => toast({ kind: "info", title: "Edit address (simulated)", description: "Address editing form would open here." })}
                    className="text-xs font-bold text-forest-700 hover:text-forest-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteAddress(a.id)}
                    aria-label={`Delete ${a.label} address`}
                    className="rounded-lg p-1.5 text-graymute transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </article>
            ))}
            <button
              onClick={() => toast({ kind: "info", title: "Add address (simulated)", description: "Use checkout to add a new address in this demo." })}
              className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-forest-200 text-forest-800 transition hover:bg-forest-50"
            >
              <span className="text-2xl" aria-hidden>＋</span>
              <span className="text-sm font-bold">Add new address</span>
            </button>
          </section>
        )}

        {/* PAYMENTS */}
        {tab === "payments" && (
          <section aria-label="Saved payment methods" className="space-y-3">
            {paymentMethods.map((pm) => (
              <article key={pm.id} className="flex items-center gap-4 rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-800">
                  <CreditCard className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-charcoal">{pm.label}</p>
                  <p className="text-xs text-graymute">
                    {pm.masked}
                    {pm.expiry ? ` · expires ${pm.expiry}` : ""}
                  </p>
                </div>
                {pm.isDefault && (
                  <span className="rounded-full bg-lime-soft px-2.5 py-1 text-[10px] font-bold text-lime-deep">Default</span>
                )}
              </article>
            ))}
            <p className="rounded-2xl bg-soft px-4 py-3 text-xs leading-relaxed text-graymute">
              🔒 Card storage is UI-only in this demo — a real build would tokenise via a PCI-compliant gateway.
            </p>
          </section>
        )}

        {/* NOTIFICATIONS */}
        {tab === "notifications" && (
          <section aria-label="Notification history" className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-charcoal">Notification history</h2>
              <button onClick={markAllRead} className="text-xs font-bold text-forest-700 hover:text-forest-900">
                Mark all read
              </button>
            </div>
            <ul className="mt-3 divide-y divide-forest-50">
              {notifications.map((n) => (
                <li key={n.id} className={cn("flex items-start gap-3 py-3.5", !n.read && "bg-lime-soft/30 -mx-3 rounded-xl px-3")}>
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-gray-300" : "bg-forest-500")} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-charcoal">{n.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-graymute">{n.body}</p>
                    <p className="mt-1 text-[11px] text-graymute/70">{timeAgo(n.timestamp)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {n.actionHref && (
                      <Link
                        href={n.actionHref}
                        onClick={() => markRead(n.id)}
                        className="rounded-lg bg-forest-50 px-2.5 py-1 text-[11px] font-bold text-forest-800 transition hover:bg-forest-100"
                      >
                        {n.actionLabel ?? "View"}
                      </Link>
                    )}
                    <button
                      onClick={() => remove(n.id)}
                      aria-label="Dismiss notification"
                      className="rounded-lg p-1 text-graymute transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* SETTINGS */}
        {tab === "settings" && (
          <section aria-label="App settings" className="space-y-3">
            <div className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
              <h2 className="text-base font-bold text-charcoal">Appearance</h2>
              <label className="mt-3 flex items-center justify-between rounded-xl bg-soft/70 px-4 py-3.5">
                <span className="flex items-center gap-2.5 text-sm font-semibold text-charcoal">
                  {theme === "light" ? <Sun className="size-4 text-amber-500" aria-hidden /> : <Moon className="size-4 text-forest-700" aria-hidden />}
                  {theme === "light" ? "Light (sage)" : "Dark forest"}
                </span>
                <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} aria-label="Toggle dark mode" />
              </label>
            </div>

            <div className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft">
              <h2 className="text-base font-bold text-charcoal">Notification preferences</h2>
              <div className="mt-3 space-y-1">
                {(
                  [
                    ["orderUpdates", "Order & delivery updates"],
                    ["offers", "Seasonal offers and harvest boxes"],
                    ["priceDrops", "Wishlist price-drop alerts"],
                    ["harvestNewsletter", "Sunday Harvest newsletter"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 transition hover:bg-soft/70">
                    <span className="text-sm font-medium text-charcoal">{label}</span>
                    <Switch
                      checked={prefs[key]}
                      onCheckedChange={(v: boolean) => {
                        setPrefs((p) => ({ ...p, [key]: v }));
                        toast({ kind: "info", title: `${label}: ${v ? "on" : "off"}`, description: "Simulated preference — stored locally." });
                      }}
                      aria-label={label}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-soft">
              <h2 className="text-base font-bold text-red-600">Session</h2>
              <p className="mt-1 text-xs text-graymute">Sign out clears your local demo session data.</p>
              <button
                onClick={() => {
                  logout();
                  toast({ kind: "info", title: "Signed out", description: "Simulated logout — session cleared." });
                }}
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl border border-red-200 px-5 text-sm font-bold text-red-600 transition hover:bg-red-50 active:scale-95"
              >
                <LogOut className="size-4" aria-hidden />
                Log out
              </button>
            </div>
          </section>
        )}
      </motion.div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <div className="px-4 py-8 sm:px-6">
        <Suspense fallback={<div className="mx-auto max-w-4xl"><div className="shimmer h-32 rounded-3xl" /></div>}>
          <AccountInner />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
}
