"use client";

import Link from "next/link";
import { Leaf, Recycle, ShieldCheck, Truck } from "lucide-react";
import { FOOTER_LINKS, SITE } from "@/config/site";
import { AgroBrandMark } from "@/components/ui/brand-mark";
import { useHydrated } from "@/hooks/useHydrated";

const BADGES = [
  { icon: Leaf, label: "100% Organic" },
  { icon: Truck, label: "24h Delivery" },
  { icon: Recycle, label: "Zero-Waste Packs" },
  { icon: ShieldCheck, label: "Secure Customer Accounts" },
];

export function Footer() {
  const hydrated = useHydrated();
  const year = hydrated ? new Date().getFullYear() : "";

  return (
    <footer className="mt-auto border-t border-forest-100/60 bg-white/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center" aria-label={`${SITE.name} home`}>
              <AgroBrandMark />
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-graymute">{SITE.tagline}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {BADGES.map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-forest-100 bg-forest-50/60 px-3 py-1.5 text-xs font-semibold text-forest-800"
                >
                  <Icon className="size-3.5" aria-hidden />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {FOOTER_LINKS.map((group) => {
            const isPromiseGroup = group.title === "Our Promise";
            return (
              <div key={group.title} aria-label={group.title}>
                <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal">{group.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {isPromiseGroup ? (
                        <span className="text-sm text-graymute">{link.label}</span>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-graymute transition hover:text-forest-800"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-forest-50 pt-6 sm:flex-row">
          <p className="text-xs text-graymute">
            © {year} {SITE.fullName} — live catalog, customer accounts, and Cash on Delivery orders are handled securely by {SITE.name}. Online card payments are not collected.
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-graymute">
            <span>{SITE.city} · {SITE.supportEmail} · {SITE.supportPhone}</span>
            <span aria-hidden>·</span>
            <a
              href="https://shriprocraft.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-forest-800 transition hover:underline"
            >
              Powered by Shri Procraft
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
