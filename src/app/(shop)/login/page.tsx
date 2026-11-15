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

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safeReturnPath(params.get("redirect"));
  const { login, loginWithGoogle } = useAuth();
  const { products } = useCatalog();
  const wishlist = useWishlist();
  const { toast } = useToast();
  const requestedWishlistProduct = params.get("wishlistProductId");

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("aarav.sharma@example.com");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

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

  const validate = () => {
    const errs: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Enter a valid email address.";
    if (password.length < 6) errs.password = "Password must be at least 6 characters (mock rule).";
    if (mode === "signup" && name.trim().length < 2) errs.name = "Please tell us your name.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    login(email, mode === "signup" ? name : undefined);
    toast({
      title: mode === "signup" ? `Welcome to Mithren Agro, ${name.split(" ")[0]}! 🌱` : "Welcome back! 🌱",
      description: "Simulated session — credentials are never sent anywhere.",
    });
    finishSignIn();
  };

  const googleLogin = () => {
    loginWithGoogle();
    toast({ title: "Signed in with Google (simulated)", description: "No real OAuth happened — this is a demo." });
    finishSignIn();
  };

  const demoLogin = () => {
    login("aarav.sharma@example.com");
    toast({ title: "Exploring as demo user", description: "Aarav's mock profile, orders and addresses are loaded." });
    finishSignIn();
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
            Sign in to track orders, sync your wishlist, unlock member harvest boxes and earn leaf points on every organic rupee.
          </p>
          <ul className="mt-8 space-y-3">
            {["Track farm-to-door deliveries in real time", "Members-only seasonal boxes", "Instant freshness refunds"].map((t) => (
              <li key={t} className="flex items-center gap-2.5 text-sm text-forest-50/90">
                <ShieldCheck className="size-4 shrink-0 text-lime-natural" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-forest-50/60">
          Demo environment — authentication is fully simulated, nothing leaves your browser.
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
              : "Join thousands of households eating farm-direct."}
          </p>

          <button
            onClick={googleLogin}
            className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-forest-100 bg-white text-sm font-semibold text-charcoal shadow-soft transition hover:bg-soft active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
              <path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.46 1.8 14.96.72 12 .72 7.44.72 3.56 3.36 1.72 7.16l3.66 2.84C6.26 7.14 8.88 5.04 12 5.04z"/>
              <path fill="#4285F4" d="M23.28 12.26c0-.92-.08-1.6-.26-2.3H12v4.34h6.44c-.13 1.08-.83 2.7-2.39 3.79l3.57 2.77c2.14-1.98 3.66-4.89 3.66-8.6z"/>
              <path fill="#FBBC05" d="M5.4 14.2a6.9 6.9 0 0 1 0-4.4L1.72 6.96a11.28 11.28 0 0 0 0 10.08l3.66-2.84z"/>
              <path fill="#34A853" d="M12 23.28c3.04 0 5.6-1 7.46-2.73l-3.57-2.77c-.95.66-2.23 1.13-3.89 1.13-3.12 0-5.74-2.1-6.62-4.96l-3.66 2.84c1.84 3.8 5.72 6.49 10.28 6.49z"/>
            </svg>
            Continue with Google
            <span className="rounded-full bg-soft px-2 py-0.5 text-[10px] font-bold text-graymute">mock</span>
          </button>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-forest-100" aria-hidden />
            <span className="text-xs font-medium text-graymute">or with email</span>
            <span className="h-px flex-1 bg-forest-100" aria-hidden />
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {mode === "signup" && (
              <div>
                <label htmlFor="login-name" className="sr-only">Full name</label>
                <input
                  id="login-name"
                  className={cn(inputCls, errors.name && "border-red-300")}
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
                {errors.name && <p className="mt-1 text-xs font-medium text-red-600">{errors.name}</p>}
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="sr-only">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-graymute" aria-hidden />
                <input
                  id="login-email"
                  type="email"
                  className={cn(inputCls, errors.email && "border-red-300")}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs font-medium text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="login-password" className="sr-only">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-graymute" aria-hidden />
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  className={cn(inputCls, "pr-12", errors.password && "border-red-300")}
                  placeholder="Password (any 6+ characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  aria-invalid={!!errors.password}
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
              {errors.password && <p className="mt-1 text-xs font-medium text-red-600">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-xs font-bold text-forest-700 hover:text-forest-900"
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
              type="submit"
              className="h-12 w-full rounded-xl bg-forest-900 text-sm font-bold text-white shadow-soft transition hover:bg-forest-800"
            >
              {mode === "login" ? "Sign in" : "Create account"}
            </motion.button>
          </form>

          <div className="mt-6 rounded-2xl bg-soft/70 p-4 text-center">
            <p className="text-xs leading-relaxed text-graymute">
              Just exploring? Skip the form —
            </p>
            <button
              onClick={demoLogin}
              className="mt-2 inline-flex h-10 items-center rounded-xl border border-forest-200 bg-white px-4 text-xs font-bold text-forest-800 transition hover:bg-forest-50"
            >
              Continue as demo user
            </button>
          </div>

          {/* forgot password dialog (UI only) */}
          {forgotOpen && (
            <div
              className="fixed inset-0 z-[70] flex items-center justify-center bg-forest-950/30 p-4 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
              aria-label="Reset password"
              onClick={() => setForgotOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-glass"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-charcoal">Reset your password</h3>
                <p className="mt-1.5 text-sm text-graymute">
                  Enter your account email and we&apos;ll send a reset link (simulated — nothing is actually sent).
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-4 h-11 w-full rounded-xl border border-forest-100 px-3.5 text-sm outline-none focus:border-forest-300 focus:ring-2 focus:ring-forest-200"
                />
                <div className="mt-5 flex gap-2.5">
                  <button
                    onClick={() => setForgotOpen(false)}
                    className="h-11 flex-1 rounded-xl border border-forest-200 text-sm font-semibold text-charcoal transition hover:bg-soft"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setForgotOpen(false);
                      toast({
                        title: "Reset link sent (simulated)",
                        description: `If ${forgotEmail || "that email"} exists, a reset link is on its way.`,
                      });
                    }}
                    className="h-11 flex-1 rounded-xl bg-forest-900 text-sm font-bold text-white transition hover:bg-forest-800"
                  >
                    Send link
                  </button>
                </div>
              </motion.div>
            </div>
          )}
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
