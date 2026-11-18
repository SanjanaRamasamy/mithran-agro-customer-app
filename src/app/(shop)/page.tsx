import { Hero } from "@/components/home/hero";
import { CategoryGrid } from "@/components/home/category-grid";
import { StorefrontProductSections } from "@/components/home/storefront-product-sections";
import { SectionHeading } from "@/components/ui/section-heading";
import { FarmerStories } from "@/components/home/farmer-stories";
import { Testimonials } from "@/components/home/testimonials";
import { TrustSection } from "@/components/home/home-sections";
import { Newsletter } from "@/components/home/newsletter";

/**
 * Mithren Agro homepage — exactly the business: fresh fruits, fresh
 * vegetables, organic fertilizers, organic groceries and women's apparel.
 */
export default function HomePage() {
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

      <StorefrontProductSections />

      <section aria-label="Featured farmers">
        <SectionHeading
          eyebrow="Farm transparency"
          title="Featured farmers"
          subtitle="Meet the certified growers and collectives behind every basket"
          viewAllHref="/farms"
          viewAllLabel="View all farms"
        />
        <FarmerStories />
      </section>

      <TrustSection />

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
