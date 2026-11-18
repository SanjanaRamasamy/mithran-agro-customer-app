"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Leaf, Lock, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/NotificationContext";
import { cn } from "@/lib/utils";
import { useCatalog } from "@/contexts/CatalogContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { safeReturnPath } from "@/utils/safe-redirect";
import { requestedWishlistAddition } from "@/utils/customer-access";
import { validateEmail, validatePassword, validatePersonName } from "@/lib/validation";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safeReturnPath(params.get("redirect"));
  const { login, register, authError } = useAuth();
  const { products } = useCatalog();
  const wishlist = useWishlist();
  const { toast } = useToast();
  const requestedWishlistProduct = params.get("wishlistProductId");

  const [mode, setMode] = useState<"login" | "signup">(
    params.get("mode") === "signup" ? "signup" : "login"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    name?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  const finishSignIn = () => {
    const wishlistProductId = requestedWishlistAddition(
      requestedWishlistProduct,
      products.map((product) => product.id),
      wishlist.entries.map((entry) => entry.productId)
    );
    if (wishlistProductId) {
      wishlist.toggle(wishlistProductId);
    }
    router.replace(redirect);
  };

  const validateField = (
    field: "name" | "email" | "password" | "confirmPassword",
    nextVal?: string,
  ) => {
    const val =
      nextVal !== undefined
        ? nextVal
        : field === "name"
          ? name
          : field === "email"
            ? email
            : field === "password"
              ? password
              : confirmPassword;

    let err: string | undefined;
    if (field === "name" && mode === "signup") {
      const r = validatePersonName(val, { min: 2, max: 80, requireFullName: true, label: "Full name" });
      if (!r.ok) err = r.error;
    } else if (field === "email") {
      const r = validateEmail(val);
      if (!r.ok) err = r.error;
    } else if (field === "password") {
      if (mode === "signup") {
        const r = validatePassword(val);
        if (!r.ok) err = r.error;
      } else if (!val) {
        err = "Password is required.";
      }
    } else if (field === "confirmPassword" && mode === "signup") {
      if (!val) err = "Confirm your password.";
      else if (val !== password) err = "Passwords do not match.";
    }

    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (mode === "signup") {
      const nameCheck = validatePersonName(name, { min: 2, max: 80, requireFullName: true, label: "Full name" });
      if (!nameCheck.ok && nameCheck.error) errs.name = nameCheck.error;
    }
    const emailCheck = validateEmail(email);
    if (!emailCheck.ok && emailCheck.error) errs.email = emailCheck.error;
    if (mode === "signup") {
      const pwCheck = validatePassword(password);
      if (!pwCheck.ok && pwCheck.error) errs.password = pwCheck.error;
      if (!confirmPassword) errs.confirmPassword = "Confirm your password.";
      else if (confirmPassword !== password) errs.confirmPassword = "Passwords do not match.";
    } else if (!password) {
      errs.password = "Password is required.";
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const firstId = errs.name
        ? "login-name"
        : errs.email
          ? "login-email"
          : errs.password
            ? "login-password"
            : "login-confirm-password";
      document.getElementById(firstId)?.focus();
      return false;
    }
    return true;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      toast({ title: mode === "signup" ? "Your account is ready." : "Welcome back." });
      finishSignIn();
    } catch (error) {
      toast({
        kind: "error",
        title: error instanceof Error ? error.message : "Unable to sign in.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "h-12 w-full rounded-xl border border-forest-100 bg-white pl-11 pr-4 text-sm text-charcoal outline-none transition placeholder:text-graymute/70 focus:border-forest-300 focus:ring-2 focus:ring-forest-200";

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* brand panel */}
      <div className="relative hidden overflow-hidden bg-forest-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-lime-natural/15 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-emerald-500/10 blur-3xl"
          aria-hidden
        />
        <Link href="/" className="relative inline-flex items-center gap-2 text-white">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <Image src="/logo-mark.png" alt="" width={86} height={86} className="size-7" />
          </span>
          <span className="text-xl font-extrabold tracking-tight">Mithren Agro</span>
        </Link>
        <div className="relative">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white">
            The basket that knows its farmer.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-forest-50/80">
            Sign in to view your Mithran Agro orders and manage saved delivery addresses.
          </p>
          <ul className="mt-8 space-y-3">
            {["View orders associated with your store account", "Manage saved delivery addresses", "Place Cash on Delivery orders"].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-sm text-forest-50/90">
                <ShieldCheck className="size-4 shrink-0 text-lime-natural" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-forest-50/60">
          Your account is securely verified by the Mithran Agro store.
        </p>
      </div>

      {/* form panel */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <Image src="/logo-mark.png" alt="" width={86} height={86} className="size-9" />
            <span className="text-lg font-extrabold text-forest-950">Mithren Agro</span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-charcoal">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-graymute">
            {mode === "login"
              ? "Sign in to continue your organic journey."
              : "Create a Mithran Agro customer account to place orders."}
          </p>

          <div className="mb-5 mt-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-forest-100" aria-hidden />
            <span className="text-xs font-medium text-graymute">Store account</span>
            <span className="h-px flex-1 bg-forest-100" aria-hidden />
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {mode === "signup" && (
              <div>
                <label htmlFor="login-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-graymute">Full name *</label>
                <input
                  id="login-name"
                  maxLength={80}
                  className={cn(inputCls, "pl-4", errors.name && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                  placeholder="First and last name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) validateField("name", e.target.value);
                  }}
                  onBlur={() => validateField("name")}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "login-name-err" : undefined}
                />
                {errors.name && <p id="login-name-err" role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.name}</p>}
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-graymute">Email address *</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-graymute" aria-hidden />
                <input
                  id="login-email"
                  type="email"
                  maxLength={254}
                  className={cn(inputCls, errors.email && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) validateField("email", e.target.value);
                  }}
                  onBlur={() => validateField("email")}
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "login-email-err" : undefined}
                />
              </div>
              {errors.email && <p id="login-email-err" role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-graymute">Password *</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-graymute" aria-hidden />
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  maxLength={72}
                  className={cn(inputCls, "pr-12", errors.password && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                  placeholder={mode === "signup" ? "8–72 characters" : "Enter your password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) validateField("password", e.target.value);
                    if (mode === "signup" && errors.confirmPassword && confirmPassword === e.target.value) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.confirmPassword;
                        return next;
                      });
                    }
                  }}
                  onBlur={() => validateField("password")}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "login-password-err" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-graymute transition hover:bg-soft"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                </button>
              </div>
              {errors.password && <p id="login-password-err" role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.password}</p>}
            </div>

            {mode === "signup" && (
              <div>
                <label htmlFor="login-confirm-password" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-graymute">Confirm password *</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-graymute" aria-hidden />
                  <input
                    id="login-confirm-password"
                    type={showPw ? "text" : "password"}
                    maxLength={72}
                    className={cn(inputCls, errors.confirmPassword && "border-red-400 focus:border-red-400 focus:ring-red-200")}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) validateField("confirmPassword", e.target.value);
                    }}
                    onBlur={() => validateField("confirmPassword")}
                    autoComplete="new-password"
                    aria-invalid={Boolean(errors.confirmPassword)}
                    aria-describedby={errors.confirmPassword ? "login-confirm-password-err" : undefined}
                  />
                </div>
                {errors.confirmPassword && <p id="login-confirm-password-err" role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.confirmPassword}</p>}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-xs font-bold text-forest-700 hover:text-forest-900"
                onClick={() => router.push("/forgot-password")}
              >
                Forgot password?
              </button>
              {mode === "login" ? (
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-xs font-semibold text-graymute transition hover:text-charcoal"
                >
                  New here? <span className="font-bold text-forest-700">Create account</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-xs font-semibold text-graymute transition hover:text-charcoal"
                >
                  Have an account? <span className="font-bold text-forest-700">Sign in</span>
                </button>
              )}
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={submitting}
              type="submit"
              className="h-12 w-full rounded-xl bg-forest-900 text-sm font-bold text-white shadow-soft transition hover:bg-forest-800 disabled:cursor-wait disabled:opacity-60"
            >
              {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </motion.button>
          </form>

          {authError && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-900" role="status">
              {authError}
            </p>
          )}
          <p className="mt-5 text-center text-xs leading-relaxed text-graymute">
            Passwords are sent only to our secure server connection and are never saved in this browser.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <LoginInner />
    </Suspense>
  );
}
