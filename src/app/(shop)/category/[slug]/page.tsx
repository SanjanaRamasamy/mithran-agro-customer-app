import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CATEGORIES, CATEGORY_BY_SLUG, CATEGORY_GROUPS, CATEGORY_GROUP_BY_ID } from "@/data/categories";
import { CategoryLanding } from "@/components/category/category-landing";

/**
 * Every department, collection and leaf category gets its own landing
 * page: /category/fresh-produce, /category/women, /category/sarees …
 */
export function generateStaticParams() {
  const catSlugs = CATEGORIES.map((c) => ({ slug: c.slug }));
  const groupSlugs = CATEGORY_GROUPS.map((g) => ({ slug: g.slug }));
  return [...catSlugs, ...groupSlugs];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cat = CATEGORY_BY_SLUG[slug];
  const group = CATEGORY_GROUP_BY_ID[slug];
  const name = cat?.name ?? group?.name;
  const description = cat?.description ?? group?.description;
  if (!name) return {};
  return {
    title: `${name} — Shop the best of Mithren Agro`,
    description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = CATEGORY_BY_SLUG[slug];
  const group = CATEGORY_GROUP_BY_ID[slug];

  if (!cat && !group) notFound();

  return <CategoryLanding slug={slug} />;
}
