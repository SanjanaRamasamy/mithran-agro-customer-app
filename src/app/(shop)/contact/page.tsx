"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { SITE } from "@/config/site";
import { useToast } from "@/contexts/NotificationContext";
import { validateEmail, validatePersonName, validateTextLength } from "@/lib/validation";

/**
 * Contact page — support channels plus a fully simulated enquiry form
 * (no backend; submissions show a confirmation toast only).
 */
export default function ContactPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("general");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    const nameRes = validatePersonName(name, { min: 2, max: 80, label: "Your name" });
    if (!nameRes.ok && nameRes.error) next.name = nameRes.error;
    const emailRes = validateEmail(email);
    if (!emailRes.ok && emailRes.error) next.email = emailRes.error;
    const msgRes = validateTextLength(message, { min: 10, max: 2000, label: "Message" });
    if (!msgRes.ok && msgRes.error) next.message = msgRes.error;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSending(true);
    /* simulated network send */
    window.setTimeout(() => {
      setSending(false);
      setSent(true);
      toast({
        title: "Message sent (simulated)",
        description: "This demo has no backend — your enquiry was recorded locally only.",
      });
    }, 900);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="text-xs text-graymute">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-forest-800">Home</Link></li>
          <li aria-hidden>/</li>
          <li className="font-semibold text-charcoal">Contact</li>
        </ol>
      </nav>

      <header className="mt-5 max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-widest text-forest-600">
          We reply within one working day
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-charcoal sm:text-4xl">
          Contact Agro
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-graymute sm:text-base">
          Questions about an order, bulk fertilizer pricing, or selling your farm&apos;s harvest
          and weaves on the marketplace? We&apos;d love to hear from you.
        </p>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* contact channels */}
        <div className="space-y-4">
          {[
            {
              icon: Phone,
              title: "Call us",
              lines: [SITE.supportPhone, "Mon–Sat, 8 AM – 8 PM IST"],
            },
            {
              icon: Mail,
              title: "Email",
              lines: [SITE.supportEmail, "We reply within 24 hours"],
            },
            {
              icon: MapPin,
              title: "Visit us",
              lines: [SITE.address, "Farm pickup by appointment"],
            },
            {
              icon: Clock,
              title: "Delivery hours",
              lines: ["6 AM – 9 PM, daily", "Same-day slots close at 2 PM"],
            },
          ].map(({ icon: Icon, title, lines }) => (
            <div
              key={title}
              className="flex items-start gap-3.5 rounded-2xl border border-forest-50 bg-white p-4 shadow-soft"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-forest-800">
                <Icon className="size-4.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-charcoal">{title}</p>
                <p className="mt-0.5 truncate text-xs font-semibold text-forest-800">{lines[0]}</p>
                <p className="text-[11px] text-graymute">{lines[1]}</p>
              </div>
            </div>
          ))}
        </div>

        {/* form */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          aria-label="Contact form"
          className="rounded-3xl border border-forest-50 bg-white p-6 shadow-soft sm:p-8"
        >
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-forest-50 text-forest-700">
                <Send className="size-6" aria-hidden />
              </span>
              <h2 className="mt-4 text-xl font-extrabold text-charcoal">Message received!</h2>
              <p className="mt-2 max-w-sm text-sm text-graymute">
                Thanks {name.split(" ")[0]} — our team will reply to {email} within one working
                day. (Simulated — no message actually left your browser.)
              </p>
              <button
                onClick={() => {
                  setSent(false);
                  setName("");
                  setEmail("");
                  setMessage("");
                }}
                className="mt-6 inline-flex h-10 items-center rounded-xl border border-forest-200 px-5 text-xs font-bold text-forest-800 transition hover:bg-forest-50"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" error={errors.name}>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    autoComplete="name"
                    className="h-11 w-full rounded-xl border border-forest-100 bg-warm/60 px-3.5 text-sm text-charcoal outline-none transition focus:border-forest-300 focus:bg-white"
                  />
                </Field>
                <Field label="Email" error={errors.email}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="h-11 w-full rounded-xl border border-forest-100 bg-warm/60 px-3.5 text-sm text-charcoal outline-none transition focus:border-forest-300 focus:bg-white"
                  />
                </Field>
              </div>

              <Field label="Topic">
                <div className="flex flex-wrap gap-2">
                  {[
                    ["general", "General enquiry"],
                    ["order", "Order support"],
                    ["bulk", "Bulk / fertilizer pricing"],
                    ["sell", "Sell with us"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTopic(value)}
                      aria-pressed={topic === value}
                      className={
                        topic === value
                          ? "rounded-full border border-forest-900 bg-forest-900 px-3.5 py-1.5 text-xs font-bold text-white"
                          : "rounded-full border border-forest-100 bg-white px-3.5 py-1.5 text-xs font-bold text-charcoal transition hover:border-forest-300"
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Message" error={errors.message}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us how we can help…"
                  rows={5}
                  className="w-full resize-none rounded-xl border border-forest-100 bg-warm/60 p-3.5 text-sm text-charcoal outline-none transition focus:border-forest-300 focus:bg-white"
                />
              </Field>

              <button
                type="submit"
                disabled={sending}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-forest-900 text-sm font-bold text-white shadow-soft transition hover:bg-forest-800 active:scale-[0.98] disabled:opacity-60"
              >
                <Send className="size-4" aria-hidden />
                {sending ? "Sending…" : "Send message"}
              </button>
              <p className="text-center text-[11px] text-graymute">
                Demo environment — form submissions are simulated and never leave your browser.
              </p>
            </form>
          )}
        </motion.section>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-graymute">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-[11px] font-semibold text-red-600">{error}</span>}
    </label>
  );
}
