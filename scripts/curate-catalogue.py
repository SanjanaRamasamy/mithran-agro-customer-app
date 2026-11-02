#!/usr/bin/env python3
"""Build src/data/extensions/curated.ts by extracting kept product blocks
from the old extension files, applying category/image/name patches, and
appending two new grocery products. Then trim products.ts base list."""
import re, pathlib

EXT = pathlib.Path("src/data/extensions")

KEEP = {
    # id: (source file, patches{})
    "prd-guava-01": ("produce-extra", {"imgKey": "p-guava"}),
    "prd-mosambi-01": ("produce-extra", {"imgKey": "p-mosambi"}),
    "prd-jamun-01": ("produce-extra", {"imgKey": "p-jamun"}),
    "prd-okra-01": ("produce-extra", {"imgKey": "p-okra"}),
    "prd-brinjal-01": ("produce-extra", {"imgKey": "p-brinjal"}),
    "prd-green-chilli-01": ("produce-extra", {"imgKey": "p-chilli"}),
    "prd-french-beans-01": ("produce-extra", {"imgKey": "p-beans"}),
    "prd-cabbage-01": ("produce-extra", {"imgKey": "p-cabbage"}),
    "agr-cow-dung-compost-01": ("agri", {
        "categoryId": "organic-fertilizers", "imgKey": "p-compost",
        "name": "Organic Compost (Desi Cow Dung)",
    }),
    "agr-vermicompost-01": ("agri", {"categoryId": "organic-fertilizers"}),
    "agr-fym-01": ("agri", {
        "categoryId": "organic-fertilizers", "imgKey": "p-manure",
        "name": "Organic Farmyard Manure",
    }),
    "agr-neem-cake-powder-01": ("agri", {"categoryId": "organic-fertilizers", "imgKey": "p-neemcake"}),
    "agr-seaweed-01": ("agri", {
        "categoryId": "organic-fertilizers", "imgKey": "p-booster",
        "name": "Bio Plant Booster (Seaweed Extract)",
    }),
    "grc-sona-rice-01": ("grocery", {"name": "Organic Sona Masoori Rice"}),
    "grc-atta-01": ("grocery", {"imgKey": "p-atta"}),
    "grc-lakadong-turmeric-01": ("grocery", {"name": "Organic Lakadong Turmeric Powder", "imgKey": "p-turmeric"}),
    "grc-guntur-chilli-01": ("grocery", {"name": "Organic Guntur Chilli Powder", "imgKey": "p-chillipowder"}),
    "grc-jaggery-01": ("grocery", {"name": "Organic Jaggery Blocks"}),
    "fsn-chettinad-saree-01": ("fashion", {}),
    "fsn-mysore-soft-silk-saree-01": ("fashion", {"imgKey": "p-saree-silk2"}),
    "fsn-kanchi-cotton-saree-01": ("fashion", {"imgKey": "p-saree-cotton2"}),
    "fsn-kanjivaram-silk-saree-01": ("fashion", {}),
    "fsn-chettinad-straight-kurti-01": ("fashion", {}),
    "fsn-printed-rayon-kurti-01": ("fashion", {"imgKey": "p-kurti2"}),
    "fsn-cotton-lycra-leggings-01": ("fashion", {}),
    "fsn-chiffon-dupatta-01": ("fashion", {}),
    "fsn-schiffli-top-01": ("fashion", {}),
    "fsn-rayon-peplum-top-01": ("fashion", {"imgKey": "p-women-top2"}),
    "fsn-shirt-midi-dress-01": ("fashion", {}),
    "fsn-floral-maxi-dress-01": ("fashion", {"imgKey": "p-dress2"}),
}

SUITABLE_CROPS = {
    "agr-cow-dung-compost-01": "Vegetables, paddy nurseries, fruit trees, flowers and potting mixes.",
    "agr-vermicompost-01": "Vegetables, leafy greens, fruits, flowers and all house plants.",
    "agr-fym-01": "Field crops, vegetables, orchards and as a base dose before every sowing.",
    "agr-neem-cake-powder-01": "Vegetables, pulses, cotton, paddy and fruit orchards; also potting mixes.",
    "agr-seaweed-01": "All vegetables, fruits, flowers and lawns — foliar spray or soil drench.",
}

FERT_NAMES = {"agr-cow-dung-compost-01", "agr-vermicompost-01", "agr-fym-01",
              "agr-neem-cake-powder-01", "agr-seaweed-01"}

blocks: dict[str, str] = {}
for fid in ["produce-extra", "grocery", "agri", "fashion"]:
    src = (EXT / f"{fid}.ts").read_text()
    # split into simple({ ... }), blocks
    for m in re.finditer(r"  simple\(\{\n(.*?)\n  \}\),", src, re.S):
        body = m.group(1)
        idm = re.search(r'id: "([a-z0-9-]+)"', body)
        if idm:
            blocks[idm.group(1)] = body

out_blocks = []
missing = []
for pid, (fid, patches) in KEEP.items():
    body = blocks.get(pid)
    if not body:
        missing.append(pid)
        continue
    for field, val in patches.items():
        body, n = re.subn(rf'(\n    {field}: )"[^"]*"', rf'\1"{val}"', body, count=1)
        if n == 0:
            print(f"WARN: field {field} not found in {pid}")
    if pid in FERT_NAMES:
        crops = SUITABLE_CROPS[pid]
        # insert suitableCrops after the application field
        body, n = re.subn(
            r'(\n    application:\n?\s*"[^"]*",)',
            rf'\1\n    suitableCrops: "{crops}",',
            body, count=1,
        )
        if n == 0:
            print(f"WARN: could not add suitableCrops to {pid}")
    out_blocks.append(f"  simple({{{body}\n  }}),")

NEW_BLOCKS = '''  simple({
    id: "grc-coriander-powder-01",
    name: "Organic Coriander Powder",
    tagline: "Stone-ground dhania with a citrusy aroma",
    description:
      "Sun-dried Rajasthani coriander seeds, stone-ground in small weekly batches so the volatile oils never burn out. Bright, citrusy and slightly sweet — the backbone of every everyday masala.",
    categoryId: "organic-grocery",
    sellerId: "golden-harvest",
    imgKey: "p-corianderpowder",
    variants: gv([
      ["100 g", 100, 68, 85],
      ["250 g", 250, 149, 185],
      ["500 g", 500, 269, 335],
    ]),
    rating: 4.7,
    reviewCount: 930,
    badges: ["organic"],
    tags: ["coriander powder", "dhania powder", "masala", "spices", "kothamalli"],
    isOrganic: true,
    harvestDaysAgo: 25,
    origin: "Jalore, Rajasthan",
    storage: "Store airtight away from sunlight; use within 6 months for peak aroma.",
    storageLifeDays: 365,
    organicDetails: "Certified organic coriander, sun-dried and stone-ground with zero additives or fillers.",
    unitsSold: 7400,
    createdHoursAgo: 110,
  }),
  simple({
    id: "grc-millet-flour-01",
    name: "Organic Millet Flour",
    tagline: "Five-millet roti flour, unpolished and stone-ground",
    description:
      "A roti-ready blend of foxtail, little, kodo, barnyard and proso millets, milled fresh every week from unpolished grains. Naturally gluten-light and rich in fibre — a wholesome swap for plain wheat flour.",
    categoryId: "organic-grocery",
    sellerId: "golden-harvest",
    imgKey: "p-milletflour",
    variants: gv([
      ["500 g", 500, 95, 120],
      ["1 kg", 1000, 175, 220],
    ]),
    rating: 4.6,
    reviewCount: 610,
    badges: ["organic", "new"],
    tags: ["millet flour", "siridhanya flour", "millet atta", "gluten friendly", "roti"],
    isOrganic: true,
    isNew: true,
    harvestDaysAgo: 12,
    origin: "Ballingal, Karnataka",
    storage: "Store airtight in a cool, dry place; refrigerate in summer for longer freshness.",
    storageLifeDays: 150,
    organicDetails: "Certified organic five-millet blend, unpolished grains stone-ground weekly with no preservatives.",
    unitsSold: 5200,
    createdHoursAgo: 84,
  }),'''

header = '''import { simple, gv, sv } from "../product-builders";
import type { Product } from "@/types";

/* ================================================================
   Curated Mithren Agro catalogue — only products that match the
   company's actual business lines: fresh produce, organic
   fertilizers, organic groceries and women's apparel.
   ================================================================ */

export const CURATED_EXTRA: Product[] = [
'''

(EXT / "curated.ts").write_text(header + "\n".join(out_blocks) + ",\n" + NEW_BLOCKS + "\n];\n")
print(f"curated.ts written with {len(out_blocks) + 2} products; missing: {missing}")

# ---- trim products.ts base list ----
REMOVE_BASE = {
    "prd-spinach-01", "prd-broccoli-01", "prd-avocado-01", "prd-bellpepper-01",
    "prd-garlic-01", "prd-lettuce-01", "prd-kale-01", "prd-blueberry-01",
    "prd-pineapple-01", "prd-mushroom-01", "prd-ginger-01", "prd-greenpeas-01",
    "prd-beetroot-01",
}
p = pathlib.Path("src/data/products.ts")
s = p.read_text()
removed = 0
for pid in REMOVE_BASE:
    m = re.search(r"  build\(\{\n(.*?)\n  \}\),\n", s, re.S)
    # find the block containing this id
    for match in re.finditer(r"  build\(\{\n(.*?)\n  \}\),\n", s, re.S):
        if f'id: "{pid}"' in match.group(1):
            s = s[: match.start()] + s[match.end():]
            removed += 1
            break
# point imports at curated.ts
s = s.replace('''import { PRODUCE_EXTRA } from "./extensions/produce-extra";
import { GROCERY_EXTRA } from "./extensions/grocery";
import { AGRI_EXTRA } from "./extensions/agri";
import { SEEDS_PLANTS_EXTRA } from "./extensions/seeds-plants";
import { GARDEN_FARM_EXTRA } from "./extensions/garden-farm";
import { FASHION_EXTRA } from "./extensions/fashion";''',
'''import { CURATED_EXTRA } from "./extensions/curated";''')
s = s.replace('''export const PRODUCTS: Product[] = [
  ...BASE_PRODUCTS,
  ...PRODUCE_EXTRA,
  ...GROCERY_EXTRA,
  ...AGRI_EXTRA,
  ...SEEDS_PLANTS_EXTRA,
  ...GARDEN_FARM_EXTRA,
  ...FASHION_EXTRA,
];''',
'''export const PRODUCTS: Product[] = [...BASE_PRODUCTS, ...CURATED_EXTRA];''')
p.write_text(s)
print(f"products.ts trimmed: removed {removed} base products")
