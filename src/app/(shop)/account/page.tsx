"use client";

import { FormEvent, useState } from "react";
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
import { RelativeTime } from "@/components/ui/relative-time";
import { formatDate } from "@/utils/format";
import { cn } from "@/lib/utils";
import { ProtectedRoute } from "@/components/auth/protected-route";
import {
  INDIAN_STATES,
  validateAddressFields,
  validateIndianMobile,
  validatePersonName,
} from "@/lib/validation";
import type { Address, User as CustomerUser } from "@/types";

const TABS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "settings", label: "Settings", icon: ShieldCheck },
] as const;

const inputCls =
  "h-11 w-full rounded-xl border border-forest-100 bg-white px-3.5 text-sm text-charcoal outline-none transition focus:border-forest-300 focus:ring-2 focus:ring-forest-200";

type AddressDraft = Omit<Address, "id">;

const EMPTY_ADDRESS: AddressDraft = {
  label: "Home",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  type: "home",
  isDefault: false,
};

function ProfileForm({
  user,
  onSave,
}: {
  user: CustomerUser;
  onSave: (patch: Partial<Pick<CustomerUser, "name" | "phone">>) => Promise<void>;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [saving, setSaving] = useState(false);

  const validateField = (field: "name" | "phone", value: string) => {
    const res =
      field === "name"
        ? validatePersonName(value, { min: 2, max: 80, requireFullName: true, label: "Full name" })
        : validateIndianMobile(value);
    setErrors((prev) => {
      const next = { ...prev };
      if (res.ok) delete next[field];
      else if (res.error) next[field] = res.error;
      return next;
    });
    return res;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const nameRes = validatePersonName(name, { min: 2, max: 80, requireFullName: true, label: "Full name" });
    const phoneRes = validateIndianMobile(phone);
    const nextErrors: { name?: string; phone?: string } = {};
    if (!nameRes.ok && nameRes.error) nextErrors.name = nameRes.error;
    if (!phoneRes.ok && phoneRes.error) nextErrors.phone = phoneRes.error;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstId = nextErrors.name ? "pf-name" : "pf-phone";
      document.getElementById(firstId)?.focus();
      return;
    }
    setSaving(true);
    try {
      await onSave({ name: nameRes.value, phone: phoneRes.value });
      toast({ title: "Profile updated." });
    } catch (error) {
      toast({ kind: "error", title: error instanceof Error ? error.message : "Unable to update your profile." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate aria-label="Edit profile" className="rounded-2xl border border-forest-50 bg-white p-5 shadow-soft sm:p-6">
      <h2 className="text-base font-bold text-charcoal">Personal information</h2>
      <p className="mt-0.5 text-xs text-graymute">Your name and phone number are saved to your PrestaShop customer profile.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pf-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-graymute">Full name *</label>
          <input
            id="pf-name"
            required
            maxLength={80}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "pf-name-err" : undefined}
            className={cn(inputCls, errors.name && "border-red-400 focus:border-red-400 focus:ring-red-200")}
            value={name}
            onChange={(event) => {
              const v = event.target.value;
              setName(v);
              if (errors.name) validateField("name", v);
            }}
            onBlur={() => validateField("name", name)}
          />
          {errors.name && <p id="pf-name-err" role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="pf-phone" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-graymute">Mobile number *</label>
          <input
            id="pf-phone"
            type="tel"
            inputMode="numeric"
            required
            maxLength={10}
            autoComplete="tel-national"
            placeholder="9876543210"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "pf-phone-err" : undefined}
            className={cn(inputCls, errors.phone && "border-red-400 focus:border-red-400 focus:ring-red-200")}
            value={phone}
            onChange={(event) => {
              const v = event.target.value;
              setPhone(v);
              if (errors.phone) validateField("phone", v);
            }}
            onBlur={() => validateField("phone", phone)}
          />
          {errors.phone && <p id="pf-phone-err" role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.phone}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="pf-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-graymute">Email</label>
          <input id="pf-email" type="email" className={inputCls} value={user.email} readOnly aria-readonly="true" />
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="mt-5 inline-flex h-11 items-center rounded-xl bg-forest-900 px-6 text-sm font-bold text-white transition hover:bg-forest-800 active:scale-95 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function AccountInner() {
  const params = useSearchParams();
  const initialTab = params.get("tab") ?? "profile";
  const [tab, setTab] = useState<string>(TABS.some((t) => t.key === initialTab) ? initialTab : "profile");
  const { user, isAuthenticated, isLoading, logout, updateProfile, addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress, paymentMethods } = useAuth();
  const { notifications, markRead, markAllRead, remove } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [addressDraft, setAddressDraft] = useState<AddressDraft>(EMPTY_ADDRESS);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [addressSubmitError, setAddressSubmitError] = useState("");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressSaving, setAddressSaving] = useState(false);

  const validateSingleAddressField = (field: keyof AddressDraft, nextDraft: AddressDraft) => {
    const check = validateAddressFields(nextDraft);
    setAddressErrors((prev) => {
      const next = { ...prev };
      if (check.errors[field]) next[field] = check.errors[field];
      else delete next[field];
      return next;
    });
  };

  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (addressSaving) return;
    setAddressSubmitError("");
    const check = validateAddressFields(addressDraft);
    setAddressErrors(check.errors);
    if (!check.ok) {
      const order = ["label", "name", "phone", "line1", "line2", "city", "state", "pincode"];
      const firstKey = order.find((k) => check.errors[k]);
      if (firstKey) document.getElementById(`addr-${firstKey}`)?.focus();
      return;
    }
    setAddressSaving(true);
    try {
      const payload: AddressDraft = {
        ...addressDraft,
        ...check.values,
        line2: check.values.line2 || undefined,
      };
      if (editingAddressId) {
        await updateAddress(editingAddressId, payload);
      } else {
        await addAddress(payload);
      }
      setAddressDraft(EMPTY_ADDRESS);
      setAddressErrors({});
      setAddressSubmitError("");
      setEditingAddressId(null);
      toast({ title: editingAddressId ? "Address updated." : "Address saved to your account." });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unable to save address.";
      setAddressSubmitError(msg);
      toast({ kind: "error", title: msg });
    } finally {
      setAddressSaving(false);
    }
  };

  const signOut = async () => {
    try {
      await logout();
      toast({ title: "Signed out." });
    } catch (error) {
      toast({
        kind: "error",
        title: error instanceof Error ? error.message : "Unable to sign out.",
        description: "The server session could not be confirmed as closed.",
      });
    }
  };

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
        description="Sign in to manage your PrestaShop customer profile and saved delivery addresses."
        action={{ label: "Sign in", href: "/login?redirect=%2Faccount" }}
        className="mt-8"
      />
    );
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
          <ProfileForm user={user} onSave={updateProfile} />
        )}

        {/* ADDRESSES */}
        {tab === "addresses" && (
          <section aria-label="Saved addresses" className="space-y-4">
            <form onSubmit={saveAddress} noValidate className="grid gap-3 rounded-2xl border border-forest-100 bg-white p-5 shadow-soft sm:grid-cols-2">
              <h2 className="text-base font-bold text-charcoal sm:col-span-2">{editingAddressId ? "Edit delivery address" : "Add a delivery address"}</h2>
              <div>
                <label htmlFor="addr-label" className="mb-1 block text-xs font-bold uppercase tracking-wide text-graymute">Address label *</label>
                <input
                  id="addr-label"
                  required
                  maxLength={30}
                  placeholder="Home, Work"
                  aria-invalid={Boolean(addressErrors.label)}
                  aria-describedby={addressErrors.label ? "addr-label-err" : undefined}
                  className={cn(inputCls, addressErrors.label && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                  value={addressDraft.label}
                  onChange={(event) => {
                    const next = { ...addressDraft, label: event.target.value };
                    setAddressDraft(next);
                    if (addressErrors.label) validateSingleAddressField("label", next);
                  }}
                  onBlur={() => validateSingleAddressField("label", addressDraft)}
                />
                {addressErrors.label && <p id="addr-label-err" role="alert" className="mt-1 text-xs font-medium text-red-600">{addressErrors.label}</p>}
              </div>
              <div>
                <label htmlFor="addr-name" className="mb-1 block text-xs font-bold uppercase tracking-wide text-graymute">Full name *</label>
                <input
                  id="addr-name"
                  required
                  maxLength={80}
                  autoComplete="name"
                  placeholder="Recipient full name"
                  aria-invalid={Boolean(addressErrors.name)}
                  aria-describedby={addressErrors.name ? "addr-name-err" : undefined}
                  className={cn(inputCls, addressErrors.name && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                  value={addressDraft.name}
                  onChange={(event) => {
                    const next = { ...addressDraft, name: event.target.value };
                    setAddressDraft(next);
                    if (addressErrors.name) validateSingleAddressField("name", next);
                  }}
                  onBlur={() => validateSingleAddressField("name", addressDraft)}
                />
                {addressErrors.name && <p id="addr-name-err" role="alert" className="mt-1 text-xs font-medium text-red-600">{addressErrors.name}</p>}
              </div>
              <div>
                <label htmlFor="addr-phone" className="mb-1 block text-xs font-bold uppercase tracking-wide text-graymute">Mobile number *</label>
                <input
                  id="addr-phone"
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  autoComplete="tel-national"
                  placeholder="9876543210"
                  aria-invalid={Boolean(addressErrors.phone)}
                  aria-describedby={addressErrors.phone ? "addr-phone-err" : undefined}
                  className={cn(inputCls, addressErrors.phone && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                  value={addressDraft.phone}
                  onChange={(event) => {
                    const next = { ...addressDraft, phone: event.target.value };
                    setAddressDraft(next);
                    if (addressErrors.phone) validateSingleAddressField("phone", next);
                  }}
                  onBlur={() => validateSingleAddressField("phone", addressDraft)}
                />
                {addressErrors.phone && <p id="addr-phone-err" role="alert" className="mt-1 text-xs font-medium text-red-600">{addressErrors.phone}</p>}
              </div>
              <div>
                <label htmlFor="addr-line1" className="mb-1 block text-xs font-bold uppercase tracking-wide text-graymute">Address line 1 *</label>
                <input
                  id="addr-line1"
                  required
                  maxLength={150}
                  autoComplete="address-line1"
                  placeholder="House/flat no., building, street"
                  aria-invalid={Boolean(addressErrors.line1)}
                  aria-describedby={addressErrors.line1 ? "addr-line1-err" : undefined}
                  className={cn(inputCls, addressErrors.line1 && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                  value={addressDraft.line1}
                  onChange={(event) => {
                    const next = { ...addressDraft, line1: event.target.value };
                    setAddressDraft(next);
                    if (addressErrors.line1) validateSingleAddressField("line1", next);
                  }}
                  onBlur={() => validateSingleAddressField("line1", addressDraft)}
                />
                {addressErrors.line1 && <p id="addr-line1-err" role="alert" className="mt-1 text-xs font-medium text-red-600">{addressErrors.line1}</p>}
              </div>
              <div>
                <label htmlFor="addr-line2" className="mb-1 block text-xs font-bold uppercase tracking-wide text-graymute">Address line 2 (optional)</label>
                <input
                  id="addr-line2"
                  maxLength={150}
                  autoComplete="address-line2"
                  placeholder="Apartment, landmark, floor"
                  aria-invalid={Boolean(addressErrors.line2)}
                  aria-describedby={addressErrors.line2 ? "addr-line2-err" : undefined}
                  className={cn(inputCls, addressErrors.line2 && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                  value={addressDraft.line2 ?? ""}
                  onChange={(event) => {
                    const next = { ...addressDraft, line2: event.target.value };
                    setAddressDraft(next);
                    if (addressErrors.line2) validateSingleAddressField("line2", next);
                  }}
                  onBlur={() => validateSingleAddressField("line2", addressDraft)}
                />
                {addressErrors.line2 && <p id="addr-line2-err" role="alert" className="mt-1 text-xs font-medium text-red-600">{addressErrors.line2}</p>}
              </div>
              <div>
                <label htmlFor="addr-city" className="mb-1 block text-xs font-bold uppercase tracking-wide text-graymute">City *</label>
                <input
                  id="addr-city"
                  required
                  maxLength={60}
                  autoComplete="address-level2"
                  placeholder="Bengaluru"
                  aria-invalid={Boolean(addressErrors.city)}
                  aria-describedby={addressErrors.city ? "addr-city-err" : undefined}
                  className={cn(inputCls, addressErrors.city && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                  value={addressDraft.city}
                  onChange={(event) => {
                    const next = { ...addressDraft, city: event.target.value };
                    setAddressDraft(next);
                    if (addressErrors.city) validateSingleAddressField("city", next);
                  }}
                  onBlur={() => validateSingleAddressField("city", addressDraft)}
                />
                {addressErrors.city && <p id="addr-city-err" role="alert" className="mt-1 text-xs font-medium text-red-600">{addressErrors.city}</p>}
              </div>
              <div>
                <label htmlFor="addr-state" className="mb-1 block text-xs font-bold uppercase tracking-wide text-graymute">State / UT *</label>
                <select
                  id="addr-state"
                  required
                  autoComplete="address-level1"
                  aria-invalid={Boolean(addressErrors.state)}
                  aria-describedby={addressErrors.state ? "addr-state-err" : undefined}
                  className={cn(inputCls, addressErrors.state && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                  value={addressDraft.state}
                  onChange={(event) => {
                    const next = { ...addressDraft, state: event.target.value };
                    setAddressDraft(next);
                    validateSingleAddressField("state", next);
                  }}
                  onBlur={() => validateSingleAddressField("state", addressDraft)}
                >
                  <option value="">Select state or UT</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                {addressErrors.state && <p id="addr-state-err" role="alert" className="mt-1 text-xs font-medium text-red-600">{addressErrors.state}</p>}
              </div>
              <div>
                <label htmlFor="addr-pincode" className="mb-1 block text-xs font-bold uppercase tracking-wide text-graymute">PIN code *</label>
                <input
                  id="addr-pincode"
                  required
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="postal-code"
                  placeholder="641035"
                  aria-invalid={Boolean(addressErrors.pincode)}
                  aria-describedby={addressErrors.pincode ? "addr-pincode-err" : undefined}
                  className={cn(inputCls, addressErrors.pincode && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                  value={addressDraft.pincode}
                  onChange={(event) => {
                    const next = { ...addressDraft, pincode: event.target.value };
                    setAddressDraft(next);
                    if (addressErrors.pincode) validateSingleAddressField("pincode", next);
                  }}
                  onBlur={() => validateSingleAddressField("pincode", addressDraft)}
                />
                {addressErrors.pincode && <p id="addr-pincode-err" role="alert" className="mt-1 text-xs font-medium text-red-600">{addressErrors.pincode}</p>}
              </div>
              <label className="flex items-center gap-2 text-sm text-charcoal sm:col-span-2">
                <input type="checkbox" checked={addressDraft.isDefault} onChange={(event) => setAddressDraft({ ...addressDraft, isDefault: event.target.checked })} />
                Set as default delivery address
              </label>
              {addressSubmitError && (
                <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 sm:col-span-2">
                  {addressSubmitError}
                </p>
              )}
              <div className="flex gap-2 sm:col-span-2">
                <button type="submit" disabled={addressSaving} className="h-10 rounded-xl bg-forest-900 px-4 text-sm font-bold text-white disabled:opacity-60">
                  {addressSaving ? "Saving…" : editingAddressId ? "Save address" : "Add address"}
                </button>
                {editingAddressId && (
                  <button type="button" onClick={() => { setEditingAddressId(null); setAddressDraft(EMPTY_ADDRESS); setAddressErrors({}); }} className="h-10 rounded-xl border border-forest-200 px-4 text-sm font-semibold text-charcoal">
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {addresses.length === 0 ? (
              <p className="rounded-2xl bg-soft px-4 py-3 text-sm text-graymute">No saved delivery addresses yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
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
                          onClick={async () => {
                            try { await setDefaultAddress(a.id); }
                            catch (error) { toast({ kind: "error", title: error instanceof Error ? error.message : "Unable to update address." }); }
                          }}
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
                        onClick={() => {
                          setEditingAddressId(a.id);
                          setAddressDraft({
                            label: a.label,
                            name: a.name,
                            phone: a.phone,
                            line1: a.line1,
                            line2: a.line2 ?? "",
                            city: a.city,
                            state: a.state,
                            pincode: a.pincode,
                            type: a.type,
                            isDefault: a.isDefault,
                            deliveryInstructions: a.deliveryInstructions,
                          });
                        }}
                        className="text-xs font-bold text-forest-700 hover:text-forest-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          try { await deleteAddress(a.id); toast({ title: "Address removed." }); }
                          catch (error) { toast({ kind: "error", title: error instanceof Error ? error.message : "Unable to remove address." }); }
                        }}
                        aria-label={`Delete ${a.label} address`}
                        className="rounded-lg p-1.5 text-graymute transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PAYMENTS */}
        {tab === "payments" && (
          <section aria-label="Saved payment methods" className="space-y-3">
            {paymentMethods.length === 0 && (
              <p className="rounded-2xl bg-soft px-4 py-3 text-sm text-graymute">
                No saved payment methods are stored in this customer account. Available payment options are shown during checkout.
              </p>
            )}
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
                    <p className="mt-1 text-[11px] text-graymute/70"><RelativeTime timestamp={n.timestamp} /></p>
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
              <p className="mt-2 text-sm leading-relaxed text-graymute">
                Notification preference controls are not available yet. Account notifications are stored with your customer account and shown in the Notifications tab.
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-soft">
              <h2 className="text-base font-bold text-red-600">Session</h2>
              <p className="mt-1 text-xs text-graymute">Sign out ends your server-side customer session on this device.</p>
              <button
                onClick={() => void signOut()}
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
