"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MailCheck, Send } from "lucide-react";
import { useToast } from "@/contexts/NotificationContext";

/** Newsletter signup — simulated subscription with validation + toast. */
export function Newsletter() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!valid) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setDone(true);
    toast({
      title: "You're on the list! 🌱",
      description: "Simulated subscription — weekly harvest emails will land every Friday.",
    });
  };

  return (
    <section aria-label="Newsletter" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest-100 via-lime-soft to-white p-6 ring-1 ring-forest-100 sm:p-10">
      <div
        className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-lime-natural/20 blur-2xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-forest-100 bg-white/80 px-3 py-1 text-xs font-bold text-forest-800">
            <MailCheck className="size-3.5" aria-hidden />
            The Sunday Harvest
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-forest-950 sm:text-3xl">
            One email. Every Sunday. Only what&apos;s in season.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-graymute">
            Peak-season picks, farmer stories and members-only harvest boxes — no spam, unsubscribe anytime.
          </p>

          {done ? (
            <div className="mx-auto mt-6 max-w-md rounded-2xl border border-forest-200 bg-white/90 px-5 py-4 text-sm font-semibold text-forest-800 shadow-soft">
              🌿 Welcome to the club! Check your inbox for a welcome note (simulated).
            </div>
          ) : (
            <form onSubmit={submit} className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row" noValidate>
              <div className="flex-1">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-invalid={!!error}
                  aria-describedby={error ? "newsletter-error" : undefined}
                  className="h-12 w-full rounded-2xl border border-forest-100 bg-white/90 px-4 text-sm text-charcoal outline-none transition placeholder:text-graymute/70 focus:border-forest-300 focus:ring-2 focus:ring-forest-200"
                />
                {error && (
                  <p id="newsletter-error" className="mt-1.5 text-left text-xs font-medium text-red-600">
                    {error}
                  </p>
                )}
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-forest-900 px-6 text-sm font-bold text-white shadow-soft transition hover:bg-forest-800"
              >
                Subscribe
                <Send className="size-4" aria-hidden />
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
