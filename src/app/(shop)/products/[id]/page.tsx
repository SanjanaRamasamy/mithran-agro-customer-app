import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCT_BY_ID } from "@/data/products";
import ProductDetailsContent from "@/components/product/product-details";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return Object.values(PRODUCT_BY_ID).map((p) => ({ id: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = Object.values(PRODUCT_BY_ID).find((p) => p.slug === id || p.id === id);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.tagline,
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 150),
    },
  };
}

/** Resolves by slug or raw id, then renders the client detail experience. */
export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = Object.values(PRODUCT_BY_ID).find((p) => p.slug === id || p.id === id);
  if (!product) notFound();
  return <ProductDetailsContent product={product} />;
}
