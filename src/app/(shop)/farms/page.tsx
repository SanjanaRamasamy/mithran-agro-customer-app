import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MapPin, Package, Star } from "lucide-react";
import { FARMER_STORIES } from "@/data/banners";
import { SELLER_BY_ID } from "@/data/sellers";
import { SmartImage } from "@/components/ui/smart-image";

export const metadata: Metadata = {
  title: "Our Farms — Meet the growers behind Mithren Agro",
  description:
    "Certified organic farms and weaver clusters across South India — the people behind every Mithren Agro product.",
};

/** Our Farms — every verified seller, with a visit CTA into their catalogue. */
export default function FarmsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="text-xs text-graymute">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-forest-800">Home</Link></li>
          <li aria-hidden>/</li>
          <li className="font-semibold text-charcoal">Our Farms</li>
        </ol>
      </nav>

      <header className="mt-5 max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-widest text-forest-600">
          Farm transparency
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-charcoal sm:text-4xl">
          Our farms &amp; artisan clusters
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-graymute sm:text-base">
          Every basket, compost bag and saree on Mithren Agro traces back to a real farm or
          weaver cooperative. Meet the certified growers behind the marketplace — and shop
          directly from their harvest.
        </p>
      </header>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Partner farms">
        {FARMER_STORIES.map((farmer) => {
          const seller = SELLER_BY_ID[farmer.sellerId];
          if (!seller) return null;
          return (
            <article
              key={farmer.id}
              role="listitem"
              className="group flex flex-col overflow-hidden rounded-3xl border border-forest-50 bg-white shadow-soft transition-shadow hover:shadow-lift"
            >
              <div className="relative">
                <SmartImage
                  src={farmer.image}
                  alt={`${farmer.name} — ${farmer.farmName}`}
                  emojiSeed="farmer"
                  rounded="rounded-none"
                  className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority
                />
                {seller.isOrganicCertified && (
                  <span className="glass absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-forest-900">
                    <BadgeCheck className="size-3 shrink-0" aria-hidden />
                    Certified Organic
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-base font-extrabold text-charcoal">{farmer.farmName}</h2>
                <p className="mt-0.5 text-xs font-semibold text-forest-700">
                  {farmer.name} · since {seller.since}
                </p>
                <p className="mt-1.5 flex items-center gap-1 text-xs text-graymute">
                  <MapPin className="size-3.5 shrink-0" aria-hidden />
                  {seller.location} · {seller.distanceKm} km away
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {seller.certifications.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-2 py-0.5 text-[10px] font-bold text-forest-800"
                    >
                      <BadgeCheck className="size-3" aria-hidden /> {c}
                    </span>
                  ))}
                </div>
                <p className="mt-3 flex-1 text-xs leading-relaxed text-graymute">{farmer.story}</p>
                <div className="mt-4 flex items-center justify-between border-t border-forest-50 pt-4">
                  <span className="flex items-center gap-3 text-xs font-semibold text-charcoal">
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
                      {seller.rating}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Package className="size-3.5 text-forest-600" aria-hidden />
                      {seller.productsCount} products
                    </span>
                  </span>
                  <Link
                    href={`/search?seller=${seller.id}`}
                    className="inline-flex h-9 items-center rounded-xl bg-forest-900 px-4 text-xs font-bold text-white transition hover:bg-forest-800 active:scale-95"
                  >
                    Visit Farm
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-graymute">
        {FARMER_STORIES.length} verified partner farms &amp; clusters ·{" "}
        <Link href="/contact" className="font-bold text-forest-700 hover:underline">
          Want to partner with us? Get in touch →
        </Link>
      </p>
    </div>
  );
}
