import Link from "next/link";

export function EmptyAccountSection({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-graymute">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-forest-800">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/account" className="hover:text-forest-800">Account</Link></li>
          <li aria-hidden>/</li>
          <li className="font-semibold text-charcoal">{title}</li>
        </ol>
      </nav>
      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl">{title}</h1>
      <section className="mt-6 rounded-2xl border border-forest-50 bg-white p-6 shadow-soft">
        <p className="text-sm leading-relaxed text-graymute">{description}</p>
        <Link
          href={actionHref}
          className="mt-5 inline-flex h-11 items-center rounded-xl bg-forest-900 px-5 text-sm font-bold text-white transition hover:bg-forest-800"
        >
          {actionLabel}
        </Link>
      </section>
    </div>
  );
}
