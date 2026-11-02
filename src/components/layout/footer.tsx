"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Leaf, Recycle, ShieldCheck, Truck } from "lucide-react";
import { FOOTER_LINKS, SITE } from "@/config/site";

const BADGES = [
  { icon: Leaf, label: "100% Organic" },
  { icon: Truck, label: "24h Delivery" },
  { icon: Recycle, label: "Zero-Waste Packs" },
  { icon: ShieldCheck, label: "Secure Payments" },
];

export function Footer() {
  const [year] = useState(() => new Date().getFullYear());

  return (
    <footer className="mt-auto border-t border-forest-100/60 bg-white/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <Image src="/logo-mark.png" alt="" width={86} height={86} className="size-10" />
              <span className="text-lg font-extrabold tracking-tight text-forest-950">{SITE.name}</span>
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

          {FOOTER_LINKS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal">{group.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-graymute transition hover:text-forest-800"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-forest-50 pt-6 sm:flex-row">
          <p className="text-xs text-graymute">
            © {year} {SITE.fullName} — a frontend demo. All data is mocked locally; no real orders, payments, or accounts exist.
          </p>
          <p className="text-xs text-graymute">
            {SITE.city} · {SITE.supportEmail} · {SITE.supportPhone}
          </p>
        </div>
      </div>
    </footer>
  );
}
