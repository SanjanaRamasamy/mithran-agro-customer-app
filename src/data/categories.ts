import type { Category, CategoryGroup, Product } from "@/types";
import {
  Apple, Carrot, ShoppingBasket, FlaskConical, Shirt, Gem, Flower,
  Palette, Star, Ruler, Scissors, Sparkles, Grid3X3, Store, Tags,
  type LucideIcon,
} from "lucide-react";
import { PRODUCTS } from "./products";
import { img } from "./images";

/* ================================================================
   Mithren Agro — marketplace taxonomy.
   Four departments mirroring the actual business:
     Fresh Produce (Fruits · Vegetables) · Agriculture (Organic
     Fertilizers) · Grocery (Organic Groceries) · Fashion (Women's
   Apparels). itemCount is derived from PRODUCTS so counts stay
   truthful, and every slug resolves to /category/[slug].
   ================================================================ */

interface CatDef {
  id: string;
  name: string;
  icon: LucideIcon;
  kind: Category["kind"];
  image: string;
  description: string;
  featured?: boolean;
  childIds?: string[];
  /** Leaf categories that live inside a collection (sarees → women)
   *  are excluded from the department's direct listing. */
  hidden?: boolean;
}

const DEPARTMENTS: {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  image: string;
  cats: CatDef[];
}[] = [
  {
    id: "fresh-produce",
    slug: "fresh-produce",
    name: "Fresh Produce",
    tagline: "Harvested this morning",
    description:
      "Farm-fresh fruits and vegetables from certified organic growers around Bengaluru — picked at dawn and delivered within 24 hours.",
    icon: Apple,
    image: img("hero-main"),
    cats: [
      { id: "fruits", name: "Fresh Fruits", icon: Apple, kind: "produce", image: img("c-fruits"), description: "Orchard-fresh, tree-ripened seasonal fruits from certified organic farms.", featured: true },
      { id: "vegetables", name: "Fresh Vegetables", icon: Carrot, kind: "produce", image: img("c-vegetables"), description: "Daily-harvested vegetables, graded and packed the same morning.", featured: true },
    ],
  },
  {
    id: "agriculture",
    slug: "agriculture",
    name: "Agriculture",
    tagline: "Feed your soil, naturally",
    description:
      "Certified organic fertilizers, composts and plant boosters blended for Indian soils — for farms, kitchens gardens and everything between.",
    icon: FlaskConical,
    image: img("cat-fertilizer"),
    cats: [
      { id: "organic-fertilizers", name: "Organic Fertilizers", icon: FlaskConical, kind: "agri-input", image: img("cat-fertilizer"), description: "Organic compost, vermicompost, manure, neem cake and bio plant boosters — lab-tested and certified.", featured: true },
    ],
  },
  {
    id: "grocery",
    slug: "grocery",
    name: "Grocery",
    tagline: "Pantry staples, the clean way",
    description:
      "Certified organic groceries — single-origin rice, stone-ground flours, spices and natural sweeteners from farmer producer organisations.",
    icon: ShoppingBasket,
    image: img("cat-grocery"),
    cats: [
      { id: "organic-grocery", name: "Organic Groceries", icon: ShoppingBasket, kind: "grocery", image: img("cat-grocery"), description: "Organic rice, wheat flour, turmeric, chilli powder, coriander powder, jaggery and millet flour.", featured: true },
    ],
  },
  {
    id: "fashion",
    slug: "fashion",
    name: "Fashion",
    tagline: "Woven by artisan clusters",
    description:
      "Handpicked women's apparel from weaver cooperatives and ethical brands — natural fibres, honest prices, weaver-first sourcing.",
    icon: Shirt,
    image: img("cat-fashion"),
    cats: [
      {
        id: "women", name: "Women's Apparels", icon: Shirt, kind: "fashion", image: img("cat-fashion"),
        description: "Sarees, kurtis, leggings, dupattas and dresses from artisan clusters.",
        featured: true,
        childIds: [
          "sarees", "silk-sarees", "cotton-sarees", "kurti",
          "leggings", "dupatta", "tops-women", "dresses",
        ],
      },
      { id: "sarees", name: "Sarees", icon: Gem, kind: "fashion", image: img("p-saree"), description: "Everyday and festive sarees from handloom clusters.", hidden: true },
      { id: "silk-sarees", name: "Silk Sarees", icon: Sparkles, kind: "fashion", image: img("p-saree-silk"), description: "Kanjivaram and soft-silk weaves for celebrations.", hidden: true },
      { id: "cotton-sarees", name: "Cotton Sarees", icon: Shirt, kind: "fashion", image: img("p-saree-cotton2"), description: "Breathable handloom cottons for daily elegance.", hidden: true },
      { id: "kurti", name: "Kurtis", icon: Shirt, kind: "fashion", image: img("p-kurti"), description: "Straight, A-line and printed kurtis in breathable fabrics.", hidden: true },
      { id: "leggings", name: "Leggings", icon: Scissors, kind: "fashion", image: img("p-leggings"), description: "Cotton Lycra leggings that keep their shape.", hidden: true },
      { id: "dupatta", name: "Dupattas", icon: Palette, kind: "fashion", image: img("p-dupatta"), description: "Chiffon, cotton and silk dupattas to finish every look.", hidden: true },
      { id: "tops-women", name: "Tops", icon: Star, kind: "fashion", image: img("p-women-top"), description: "Versatile cotton and rayon tops for work and weekends.", hidden: true },
      { id: "dresses", name: "Dresses", icon: Flower, kind: "fashion", image: img("p-dress"), description: "Day dresses and occasion wear in flowy natural fabrics.", hidden: true },
    ],
  },
];

/* --------------------------- build flat list -------------------- */

function buildTaxonomy(): { CATEGORIES: Category[]; CATEGORY_GROUPS: CategoryGroup[] } {
  const counts: Record<string, number> = {};
  for (const p of PRODUCTS) counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1;

  const categories: Category[] = [];
  const groups: CategoryGroup[] = [];

  for (const dept of DEPARTMENTS) {
    const groupCats: Category[] = dept.cats.map((c) => ({
      id: c.id,
      slug: c.id,
      name: c.name,
      description: c.description,
      image: c.image,
      itemCount: counts[c.id] ?? 0,
      group: dept.id,
      kind: c.kind,
      icon: c.icon,
      childIds: c.childIds,
      featured: c.featured,
    }));
    categories.push(...groupCats);

    groups.push({
      id: dept.id,
      slug: dept.slug,
      name: dept.name,
      tagline: dept.tagline,
      description: dept.description,
      icon: dept.icon,
      image: dept.image,
      categoryIds: dept.cats.filter((c) => !c.hidden).map((c) => c.id),
    });
  }

  return { CATEGORIES: categories, CATEGORY_GROUPS: groups };
}

const built = buildTaxonomy();

export const CATEGORIES: Category[] = built.CATEGORIES;
export const CATEGORY_GROUPS: CategoryGroup[] = built.CATEGORY_GROUPS;

export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
);
export const CATEGORY_BY_SLUG: Record<string, Category> = CATEGORY_BY_ID;

export const CATEGORY_GROUP_BY_ID: Record<string, CategoryGroup> = Object.fromEntries(
  CATEGORY_GROUPS.map((g) => [g.id, g])
);

/** All category ids that live inside a collection (women). */
const COLLECTION_CHILDREN: Record<string, string> = {};
for (const c of CATEGORIES) {
  for (const child of c.childIds ?? []) COLLECTION_CHILDREN[child] = c.id;
}

/**
 * Expand selected category ids to leaf ids — a collection ("women")
 * filters to all of its child categories. Departments expand to every
 * category they contain. Keeps filtering consistent across tabs,
 * filter panel and category landing pages.
 */
export function expandCategoryIds(ids: string[]): string[] {
  const out = new Set<string>();
  const walk = (id: string) => {
    const cat = CATEGORY_BY_ID[id];
    if (cat?.childIds?.length) {
      out.add(id);
      for (const child of cat.childIds) walk(child);
      return;
    }
    out.add(id);
    const parent = COLLECTION_CHILDREN[id];
    if (parent) out.add(parent);
  };
  for (const id of ids) {
    const group = CATEGORY_GROUP_BY_ID[id];
    if (group) {
      out.add(id);
      for (const catId of group.categoryIds) walk(catId);
      continue;
    }
    walk(id);
  }
  return [...out];
}

/** True category count for a category (collections include children). */
export function effectiveItemCount(cat: Category): number {
  if (!cat.childIds?.length) return cat.itemCount;
  return cat.childIds.reduce((sum, id) => sum + (CATEGORY_BY_ID[id]?.itemCount ?? 0), 0);
}

/** Kind lookup used by cards & detail pages. */
export function categoryKind(product: Product): Category["kind"] {
  return CATEGORY_BY_ID[product.categoryId]?.kind ?? "produce";
}

/** Department for a category id. */
export function groupOf(categoryId: string): CategoryGroup | undefined {
  const cat = CATEGORY_BY_ID[categoryId];
  return cat ? CATEGORY_GROUP_BY_ID[cat.group] : undefined;
}

/** Category strip order for the shop tabs & nav. */
export const PRIMARY_TAB_CATEGORIES = [
  "fruits", "vegetables", "organic-fertilizers", "organic-grocery", "women",
];

/** Store icon for mega-menu parity. */
export const SHOP_ICON = Grid3X3;
export const STORE_ICON = Store;
export const OFFERS_ICON = Tags;
