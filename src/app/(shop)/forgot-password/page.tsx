"use client";

import { useState } from "react";
import Link from "next/link";
import { validateEmail } from "@/lib/validation";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const checkEmail = (val: string) => {
    const res = validateEmail(val);
    setFieldError(res.ok ? "" : (res.error ?? "Enter a valid email address."));
    return res;
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    const check = checkEmail(email);
    if (!check.ok) {
      document.getElementById("reset-email")?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/customer/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ email: check.value }),
      });
      const payload: unknown = await response.json();
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("success" in payload) ||
        payload.success !== true
      ) {
        const detail =
          typeof payload === "object" &&
          payload !== null &&
          "message" in payload &&
          typeof payload.message === "string"
            ? payload.message
            : "Unable to request a password reset.";
        throw new Error(detail);
      }
      setMessage(
        "If an active account uses that email, PrestaShop will send its password reset link.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to request a password reset.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <section className="rounded-3xl border border-forest-100 bg-white p-6 shadow-soft sm:p-8">
        <h1 className="text-2xl font-extrabold text-charcoal">Reset your password</h1>
        <p className="mt-2 text-sm leading-relaxed text-graymute">
          Enter your store-account email. PrestaShop will email its native password-reset link
          if the account is active and eligible for a reset.
        </p>
        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          <div>
            <label htmlFor="reset-email" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-graymute">
              Email address *
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              maxLength={254}
              value={email}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "reset-email-err" : undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                if (fieldError) checkEmail(event.target.value);
              }}
              onBlur={() => checkEmail(email)}
              className={cn(
                "h-11 w-full rounded-xl border border-forest-100 bg-white px-3.5 text-sm text-charcoal outline-none focus:border-forest-300 focus:ring-2 focus:ring-forest-200",
                fieldError && "border-red-400 focus:border-red-400 focus:ring-red-200",
              )}
            />
            {fieldError && <p id="reset-email-err" role="alert" className="mt-1 text-xs font-medium text-red-600">{fieldError}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-xl bg-forest-900 px-4 text-sm font-bold text-white transition hover:bg-forest-800 disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? "Sending request…" : "Send reset link"}
          </button>
        </form>
        {message && <p className="mt-4 rounded-xl bg-forest-50 px-3.5 py-3 text-sm text-forest-900" role="status">{message}</p>}
        {error && <p className="mt-4 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-800" role="alert">{error}</p>}
        <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-forest-800 hover:text-forest-950">
          Return to sign in
        </Link>
      </section>
    </main>
  );
}
