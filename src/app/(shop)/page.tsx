import { PRODUCTS } from "@/data/products";
import { expandCategoryIds } from "@/data/categories";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductRail } from "@/components/home/product-rail";
import { ProductCard } from "@/components/product/product-card";
import { Hero } from "@/components/home/hero";
import { CategoryGrid } from "@/components/home/category-grid";
import { DealsStrip } from "@/components/home/deals-strip";
import { FarmerStories } from "@/components/home/farmer-stories";
import { Testimonials } from "@/components/home/testimonials";
import { TrustSection } from "@/components/home/home-sections";
import { Newsletter } from "@/components/home/newsletter";
import { getMaxDiscount } from "@/utils/product";

const inCat = (id: string) =>
  PRODUCTS.filter((p) => expandCategoryIds([id]).includes(p.categoryId));

/**
 * Mithren Agro homepage — exactly the business: fresh fruits, fresh
 * vegetables, organic fertilizers, organic groceries and women's apparel.
 */
export default function HomePage() {
  const featured = [...PRODUCTS]
    .sort(
      (a, b) =>
        b.rating * Math.log10(b.reviewCount + 10) - a.rating * Math.log10(a.reviewCount + 10)
    )
    .slice(0, 12);

  const fruits = inCat("fruits")
    .sort((a, b) => (b.unitsSold ?? 0) - (a.unitsSold ?? 0))
    .slice(0, 12);

  const vegetables = inCat("vegetables")
    .sort((a, b) => (b.unitsSold ?? 0) - (a.unitsSold ?? 0))
    .slice(0, 12);

  const fertilizers = inCat("organic-fertilizers")
    .sort((a, b) => (b.unitsSold ?? 0) - (a.unitsSold ?? 0))
    .slice(0, 12);

  const grocery = inCat("organic-grocery")
    .sort((a, b) => (b.unitsSold ?? 0) - (a.unitsSold ?? 0))
    .slice(0, 12);

  const women = inCat("women")
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);

  const seasonalOffers = [...PRODUCTS]
    .sort((a, b) => getMaxDiscount(b) - getMaxDiscount(a))
    .slice(0, 12);

  return (
    <>
      <Hero />

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-6 sm:space-y-14 sm:px-6 sm:py-8">
      <section aria-label="Shop by category">
        <SectionHeading
          eyebrow="Everything Mithren Agro grows, makes & sells"
          title="Shop by category"
          viewAllHref="/search"
          viewAllLabel="All products"
        />
        <CategoryGrid />
      </section>

      <section aria-label="Featured products">
        <SectionHeading
          eyebrow="Loved across the marketplace"
          title="Featured products"
          viewAllHref="/search?sort=relevance"
        />
        <ProductRail products={featured} priority />
      </section>

      <section aria-label="Fresh fruits">
        <SectionHeading
          eyebrow="Picked this morning"
          title="Fresh fruits"
          subtitle="Tree-ripened and delivered within 24 hours of harvest"
          viewAllHref="/category/fruits"
        />
        <ProductRail products={fruits} />
      </section>

      <section aria-label="Fresh vegetables">
        <SectionHeading
          eyebrow="Graded and packed the same morning"
          title="Fresh vegetables"
          subtitle="From partner farms around Bengaluru"
          viewAllHref="/category/vegetables"
        />
        <ProductRail products={vegetables} />
      </section>

      <section aria-label="Organic fertilizers">
        <SectionHeading
          eyebrow="Feed your soil, naturally"
          title="Organic fertilizers"
          subtitle="Compost, vermicompost, manure, neem cake and bio boosters — lab-tested"
          viewAllHref="/category/organic-fertilizers"
        />
        <ProductRail products={fertilizers} />
      </section>

      <section aria-label="Organic grocery">
        <SectionHeading
          eyebrow="Pantry staples, the clean way"
          title="Organic grocery"
          subtitle="Single-origin rice, stone-ground flours and spices from farmer producer organisations"
          viewAllHref="/category/organic-grocery"
        />
        <ProductRail products={grocery} />
      </section>

      <section aria-label="Women's collection">
        <SectionHeading
          eyebrow="Woven by artisan clusters"
          title="Women's collection"
          subtitle="Handloom sarees, kurtis, leggings, dupattas and dresses at honest prices"
          viewAllHref="/category/women"
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5" role="list">
          {women.map((p, i) => (
            <div key={p.id} role="listitem">
              <ProductCard product={p} priority={i < 5} />
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Featured farmers">
        <SectionHeading
          eyebrow="Farm transparency"
          title="Featured farmers"
          subtitle="Meet the certified growers and collectives behind every basket"
        />
        <FarmerStories />
      </section>

      <TrustSection />

      <section aria-label="Seasonal offers">
        <SectionHeading
          eyebrow="Seasonal offers"
          title="Deals of the season"
          viewAllHref="/search?onsale=1"
        />
        <DealsStrip />
      </section>

      <section aria-label="Customer testimonials">
        <SectionHeading
          eyebrow="From kitchens, gardens & wardrobes"
          title="What our customers say"
        />
        <Testimonials />
      </section>

      <Newsletter />
      </div>
    </>
  );
}
