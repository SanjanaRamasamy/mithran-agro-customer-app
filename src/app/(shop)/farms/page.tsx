"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin, Package, RefreshCw, Sprout } from "lucide-react";
import { useCatalog } from "@/contexts/CatalogContext";
import { SmartImage } from "@/components/ui/smart-image";

/**
 * Our Farms — displays real published farms from the PrestaShop
 * `mithranagroapp` module. Never fabricates farm profiles, ratings, or counts.
 */
export default function FarmsPage() {
  const { farms, farmsStatus, products, reload } = useCatalog();

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
          Our farms &amp; grower collectives
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-graymute sm:text-base">
          Explore verified partner farms and collectives registered in Agro. Visit a farm
          profile to learn its story and shop only the harvest grown and listed by that farm.
        </p>
      </header>

      {farmsStatus === "loading" ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading farms">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="shimmer h-96 rounded-3xl" />
          ))}
        </div>
      ) : farmsStatus === "unavailable" ? (
        <div className="mt-8 rounded-3xl border border-forest-100 bg-white p-8 text-center shadow-soft">
          <Sprout className="mx-auto size-10 text-forest-600" aria-hidden />
          <h2 className="mt-3 text-lg font-extrabold text-charcoal">
            Farm directory is not published yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-graymute">
            Partner farm profiles are not published yet. Meanwhile, you can browse all available Agro products directly.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-forest-900 px-5 text-xs font-bold text-white transition hover:bg-forest-800"
            >
              Browse All Products
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <button
              type="button"
              onClick={reload}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-forest-200 bg-white px-4 text-xs font-bold text-forest-800 transition hover:bg-forest-50"
            >
              <RefreshCw className="size-3.5" aria-hidden />
              Retry
            </button>
          </div>
        </div>
      ) : farms.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-forest-100 bg-white p-8 text-center shadow-soft">
          <Sprout className="mx-auto size-10 text-forest-600" aria-hidden />
          <h2 className="mt-3 text-lg font-extrabold text-charcoal">No farms published yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-graymute">
            There are currently no active partner farms published in the marketplace directory.
          </p>
          <Link
            href="/products"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-forest-900 px-5 text-xs font-bold text-white transition hover:bg-forest-800"
          >
            Shop All Products
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Partner farms">
          {farms.map((farm) => {
            const farmProducts = products.filter((p) => farm.productIds.includes(p.id));
            const categoryNames = [...new Set(
              farmProducts
                .map((p) => p.prestaShop?.categoryName)
                .filter((name): name is string => Boolean(name))
            )];

            return (
              <article
                key={farm.id}
                role="listitem"
                className="group flex flex-col overflow-hidden rounded-3xl border border-forest-50 bg-white shadow-soft transition-shadow hover:shadow-lift"
              >
                <div className="relative">
                  <SmartImage
                    src={farm.coverUrl || farm.logoUrl}
                    alt={farm.name}
                    emojiSeed={farm.name}
                    rounded="rounded-none"
                    className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  {farm.isVerified && (
                    <span
                      title={farm.verificationNote}
                      className="glass absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-forest-900"
                    >
                      <BadgeCheck className="size-3 shrink-0" aria-hidden />
                      Verified Farm
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-base font-extrabold text-charcoal">{farm.name}</h2>
                  {farm.ownerName && (
                    <p className="mt-0.5 text-xs font-semibold text-forest-700">
                      {farm.ownerName}
                    </p>
                  )}
                  {farm.location && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-graymute">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
                      {farm.location}
                    </p>
                  )}

                  {categoryNames.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {categoryNames.map((categoryName) => (
                        <span
                          key={categoryName}
                          className="rounded-full bg-forest-50 px-2.5 py-0.5 text-[10px] font-bold text-forest-800"
                        >
                          {categoryName}
                        </span>
                      ))}
                    </div>
                  )}

                  {farm.shortDescription && (
                    <p className="mt-3 flex-1 text-xs leading-relaxed text-graymute">
                      {farm.shortDescription}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-forest-50 pt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal">
                      <Package className="size-3.5 text-forest-600" aria-hidden />
                      {farmProducts.length} {farmProducts.length === 1 ? "product" : "products"}
                    </span>
                    <Link
                      href={`/farms/${farm.slug}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-forest-900 px-4 text-xs font-bold text-white transition hover:bg-forest-800 active:scale-95"
                    >
                      Visit Farm
                      <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-graymute">
        {farms.length > 0 ? `${farms.length} active partner ${farms.length === 1 ? "farm" : "farms"} · ` : ""}
        <Link href="/contact" className="font-bold text-forest-700 hover:underline">
          Want to partner with us? Get in touch →
        </Link>
      </p>
    </div>
  );
}
