import Link from "next/link";
import { Leaf } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-warm px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-3xl bg-forest-900 text-white shadow-glass">
        <Leaf className="size-7" aria-hidden />
      </span>
      <p className="mt-6 text-xs font-bold uppercase tracking-widest text-forest-600">404 — fresh out of this page</p>
      <h1 className="mt-2 max-w-md text-balance text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl">
        This shelf is empty — but the farm stand is full.
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-graymute">
        The page you were looking for doesn&apos;t exist (or got harvested). Try today&apos;s fresh picks instead.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-2xl bg-forest-900 px-6 text-sm font-bold text-white shadow-soft transition hover:bg-forest-800"
        >
          Back to home
        </Link>
        <Link
          href="/search"
          className="inline-flex h-12 items-center rounded-2xl border border-forest-200 bg-white px-6 text-sm font-bold text-forest-800 transition hover:bg-forest-50"
        >
          Browse produce
        </Link>
      </div>
    </div>
  );
}
