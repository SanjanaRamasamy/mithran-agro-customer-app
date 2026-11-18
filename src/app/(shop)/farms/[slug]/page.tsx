"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowDown,
  BadgeCheck,
  Mail,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  Sprout,
} from "lucide-react";
import { useCatalog } from "@/contexts/CatalogContext";
import { parseFarm, type Farm } from "@/lib/farms";
import { SmartImage } from "@/components/ui/smart-image";
import { ProductCard } from "@/components/product/product-card";
import { cn } from "@/lib/utils";

/**
 * Individual Farm Profile Page — `/farms/[slug]`
 * Displays farm cover, logo, location, story, verification record,
 * approved contact options, category filter, and ONLY products belonging
 * to this farm.
 */
export default function FarmProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { products, farmBySlug, farmsStatus, status: catalogStatus, reload } = useCatalog();
  const [directFarm, setDirectFarm] = useState<Farm | null>(null);
  const [directLoading, setDirectLoading] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const catalogFarm = slug ? farmBySlug[slug] : undefined;

  useEffect(() => {
    if (!slug || catalogFarm || farmsStatus === "loading") return;
    let active = true;
    setDirectLoading(true);
    setDirectError(null);
    fetch(`/api/farms/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Farm not found.");
        }
        const parsed = parseFarm(json.farm);
        if (!parsed) throw new Error("Farm not found.");
        if (active) setDirectFarm(parsed);
      })
      .catch((err) => {
        if (active) setDirectError(err instanceof Error ? err.message : "Unable to load farm.");
      })
      .finally(() => {
        if (active) setDirectLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug, catalogFarm, farmsStatus]);

  const farm = catalogFarm ?? directFarm;

  const farmProducts = useMemo(() => {
    if (!farm) return [];
    const allowedIds = new Set(farm.productIds);
    return products.filter((p) => allowedIds.has(p.id) || p.sellerId === farm.slug);
  }, [farm, products]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of farmProducts) {
      const catSlug = p.categoryId || p.prestaShop?.categorySlugs[0];
      const catName = p.prestaShop?.categoryName || catSlug;
      if (catSlug && catName) map.set(catSlug, catName);
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [farmProducts]);

  const visibleProducts = useMemo(() => {
    if (selectedCategory === "all") return farmProducts;
    return farmProducts.filter((p) => p.categoryId === selectedCategory);
  }, [farmProducts, selectedCategory]);

  if (catalogStatus === "loading" || farmsStatus === "loading" || directLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6" aria-label="Loading farm profile">
        <div className="shimmer h-64 w-full rounded-3xl" />
        <div className="shimmer h-8 w-1/3 rounded-xl" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Sprout className="mx-auto size-10 text-forest-600" aria-hidden />
        <h1 className="mt-3 text-2xl font-extrabold text-charcoal">Farm not found</h1>
        <p className="mt-2 text-sm text-graymute">
          {directError ?? "This farm profile is not published or could not be found."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/farms"
            className="inline-flex h-10 items-center rounded-xl bg-forest-900 px-5 text-xs font-bold text-white transition hover:bg-forest-800"
          >
            View All Farms
          </Link>
          <button
            type="button"
            onClick={reload}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-forest-200 bg-white px-4 text-xs font-bold text-forest-800 hover:bg-forest-50"
          >
            <RefreshCw className="size-3.5" aria-hidden /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-graymute">
        <ol className="flex items-center gap-1.5">
          <li><Link href="/" className="hover:text-forest-800">Home</Link></li>
          <li aria-hidden>/</li>
          <li><Link href="/farms" className="hover:text-forest-800">Our Farms</Link></li>
          <li aria-hidden>/</li>
          <li className="font-semibold text-charcoal">{farm.name}</li>
        </ol>
      </nav>

      {/* Farm Hero Banner */}
      <section className="overflow-hidden rounded-3xl border border-forest-50 bg-white shadow-soft">
        <div className="relative h-48 w-full sm:h-64">
          <SmartImage
            src={farm.coverUrl || farm.logoUrl}
            alt={`${farm.name} cover`}
            emojiSeed={farm.name}
            rounded="rounded-none"
            className="h-full w-full"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        <div className="relative px-5 pb-6 pt-4 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="-mt-12 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-soft">
                <SmartImage
                  src={farm.logoUrl || farm.coverUrl}
                  alt={farm.name}
                  emojiSeed={farm.name}
                  rounded="rounded-xl"
                  className="size-20 sm:size-24"
                  sizes="96px"
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl">
                    {farm.name}
                  </h1>
                  {farm.isVerified && (
                    <span
                      title={farm.verificationNote}
                      className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-3 py-1 text-xs font-bold text-forest-800"
                    >
                      <BadgeCheck className="size-3.5" aria-hidden />
                      Verified Farm
                    </span>
                  )}
                </div>
                {farm.ownerName && (
                  <p className="mt-0.5 text-sm font-semibold text-forest-700">{farm.ownerName}</p>
                )}
                {farm.location && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-graymute">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    {farm.location}
                  </p>
                )}
              </div>
            </div>

            <a
              href="#farm-products"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-forest-900 px-5 text-xs font-bold text-white shadow-soft transition hover:bg-forest-800 active:scale-[0.98]"
            >
              Shop This Farm ({farmProducts.length})
              <ArrowDown className="size-4" aria-hidden />
            </a>
          </div>

          {(farm.shortDescription || farm.story || farm.verificationNote || farm.contactEmail || farm.contactPhone) && (
            <div className="mt-6 grid gap-6 border-t border-forest-50 pt-5 lg:grid-cols-3">
              <div className="space-y-2 lg:col-span-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-graymute">
                  Farm story
                </h2>
                {farm.shortDescription && (
                  <p className="text-sm font-medium text-charcoal">{farm.shortDescription}</p>
                )}
                {farm.story && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-graymute">
                    {farm.story}
                  </p>
                )}
              </div>

              <div className="space-y-3 rounded-2xl bg-forest-50/60 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-forest-900">
                  Farm details
                </h3>
                <p className="flex items-center gap-2 text-xs font-semibold text-charcoal">
                  <Package className="size-4 text-forest-700" aria-hidden />
                  {farmProducts.length} active {farmProducts.length === 1 ? "product" : "products"} listed
                </p>
                {farm.isVerified && farm.verificationNote && (
                  <p className="flex items-start gap-2 text-xs text-forest-800">
                    <BadgeCheck className="mt-0.5 size-4 shrink-0 text-forest-700" aria-hidden />
                    <span>{farm.verificationNote}</span>
                  </p>
                )}
                {farm.contactEmail && (
                  <a
                    href={`mailto:${farm.contactEmail}`}
                    className="flex items-center gap-2 text-xs font-semibold text-forest-800 hover:underline"
                  >
                    <Mail className="size-4 shrink-0" aria-hidden />
                    {farm.contactEmail}
                  </a>
                )}
                {farm.contactPhone && (
                  <a
                    href={`tel:${farm.contactPhone}`}
                    className="flex items-center gap-2 text-xs font-semibold text-forest-800 hover:underline"
                  >
                    <Phone className="size-4 shrink-0" aria-hidden />
                    {farm.contactPhone}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Farm Products */}
      <section id="farm-products" className="mt-8 scroll-mt-24">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-charcoal sm:text-2xl">
              Products from {farm.name}
            </h2>
            <p className="mt-0.5 text-xs text-graymute">
              Showing {visibleProducts.length} of {farmProducts.length} farm products
            </p>
          </div>

          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter farm products by category">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-bold transition",
                  selectedCategory === "all"
                    ? "bg-forest-900 text-white"
                    : "border border-forest-100 bg-white text-charcoal hover:bg-forest-50"
                )}
              >
                All ({farmProducts.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-bold transition",
                    selectedCategory === cat.id
                      ? "bg-forest-900 text-white"
                      : "border border-forest-100 bg-white text-charcoal hover:bg-forest-50"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {visibleProducts.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-forest-100 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-charcoal">
              No active products are currently listed for this farm.
            </p>
            <Link
              href="/products"
              className="mt-4 inline-flex h-10 items-center rounded-xl bg-forest-900 px-5 text-xs font-bold text-white hover:bg-forest-800"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
