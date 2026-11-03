import { simple, gv, v } from "../product-builders";
import type { Product } from "@/types";

/* ================================================================
   AGRI_INPUTS extension — 27 SKUs of organic farming inputs:
   fertilizers, bio-cultures, composts, cocopeat, manures, neem,
   growth promoters, bio-pesticides and seed-treatment cultures.
   ================================================================ */

export const AGRI_EXTRA: Product[] = [
  /* ------------------------- organic-fertilizers (3) ------------------------ */
  simple({
    id: "agr-organic-npk-01",
    name: "Organic NPK 4:3:3 Granules",
    tagline: "Plant-based granular fertilizer with a steady 4:3:3 release",
    description:
      "Homogeneous granules made from composted neem cake, castor cake and rock minerals — no animal by-products. Nitrogen releases slowly over about 60 days, keeping leafy growth steady without burning roots.",
    categoryId: "organic-fertilizers",
    sellerId: "terrablend",
    imgKey: "p-fertilizer",
    variants: gv([
      ["1 kg bag", 1000, 120, 150],
      ["5 kg bag", 5000, 525, 650],
      ["25 kg bag", 25000, 2100, 2500],
    ]),
    rating: 4.7,
    reviewCount: 890,
    badges: ["organic", "bestseller"],
    tags: ["npk khad", "organic fertilizer", "4:3:3", "basal dose", "plant food"],
    isOrganic: true,
    isBestSeller: true,
    harvestDaysAgo: 25,
    origin: "Coimbatore, Tamil Nadu",
    storage:
      "Store in a dry shed on a pallet; reseal the liner — granules cake in humidity.",
    storageLifeDays: 730,
    organicDetails:
      "Approved organic input (ECOCERT-input listed); heavy metals within FCO Schedule-4 limits.",
    unitsSold: 6200,
    createdHoursAgo: 72,
    composition:
      "NPK 4 : 3 : 3 w/w from castor cake, neem cake and rock minerals; organic carbon 22%, moisture ≤ 10%.",
    application:
      "Basal: 25–50 kg per acre broadcast before the last ploughing. Pots: 30–50 g per 15 L pot every 45 days, mixed into the topsoil.",
  }),
  simple({
    id: "agr-bone-meal-01",
    name: "Bone Meal Powder (Steamed)",
    tagline: "Steamed bone meal for strong roots, stems and big blooms",
    description:
      "Fine steamed bone meal powder with slow-release phosphorus and 24% calcium — the classic rose, bulb and fruiting-crop booster. Odour-controlled and pathogen-free, it mixes cleanly into potting soil.",
    categoryId: "organic-fertilizers",
    sellerId: "terrablend",
    imgKey: "p-fertilizer",
    variants: gv([
      ["500 g pouch", 500, 75, 95],
      ["1 kg pouch", 1000, 135, 165],
      ["5 kg bag", 5000, 525, 650],
    ]),
    rating: 4.6,
    reviewCount: 640,
    badges: ["organic"],
    tags: ["bone meal", "haddi khad", "phosphorus", "flowering", "root growth"],
    isOrganic: true,
    harvestDaysAgo: 30,
    origin: "Hassan, Karnataka",
    storage: "Keep dry and sealed; a lump-free powder means it is still good.",
    storageLifeDays: 730,
    organicDetails:
      "Steamed at 130°C for pathogen control; citrate-soluble phosphorus ≥ 90%.",
    unitsSold: 3400,
    createdHoursAgo: 120,
    composition:
      "Steamed bone meal — N 3% : P₂O₅ 15% : K 0%, calcium 24%, finely ground powder.",
    application:
      "50–100 g per planting hole for roses, bulbs and fruit trees; 100–150 kg per acre for phosphorus-hungry field crops at sowing.",
  }),
  simple({
    id: "agr-rock-phosphate-01",
    name: "Rock Phosphate Powder",
    tagline: "Natural phosphorus rock for long-term soil P banking",
    description:
      "Finely ground sedimentary rock phosphate (28% total P₂O₅) that releases phosphorus slowly across 2–3 seasons. Ideal for orchard basins and acidic soils, where it also feeds soil microbes.",
    categoryId: "organic-fertilizers",
    sellerId: "green-acres",
    imgKey: "p-fertilizer",
    variants: gv([
      ["1 kg bag", 1000, 90, 110],
      ["5 kg bag", 5000, 375, 450],
      ["25 kg bag", 25000, 1500, 1800, false],
    ]),
    rating: 4.4,
    reviewCount: 210,
    badges: ["organic"],
    tags: ["rock phosphate", "phosphorus", "soil amendment", "orchard", "khad"],
    isOrganic: true,
    harvestDaysAgo: 60,
    origin: "Guntur, Andhra Pradesh",
    storage: "Store dry; powder dusts when moved — keep the bag folded tight.",
    storageLifeDays: 730,
    unitsSold: 900,
    createdHoursAgo: 200,
    composition:
      "Sedimentary rock phosphate — total P₂O₅ 28%, citric-acid soluble P₂O₅ 9%, CaO 45%, fluorine < 1.5%.",
    application:
      "200 kg per acre broadcast along with 2 t FYM before sowing; 200–500 g per tree basin twice a year for mango, guava and coconut.",
  }),

  /* -------------------------- bio-fertilizers (2) -------------------------- */
  simple({
    id: "agr-rhizobium-01",
    name: "Rhizobium Biofertilizer (Legume Root Nodulator)",
    tagline: "Live Rhizobium culture for fat pink nodules on pulses",
    description:
      "Peat-based Rhizobium leguminosarum culture for chickpea, groundnut, cowpea, green gram and soybean. Fixes 40–80 kg atmospheric nitrogen per hectare through healthy pink nodules and cuts the urea bill.",
    categoryId: "bio-fertilizers",
    sellerId: "mithran-inputs",
    imgKey: "p-biopest",
    variants: gv([
      ["250 g pack", 250, 220, 270],
      ["500 g pack", 500, 380, 460],
      ["1 kg pack", 1000, 590, 720],
    ]),
    rating: 4.5,
    reviewCount: 320,
    badges: ["organic"],
    tags: [
      "rhizobium",
      "biofertilizer",
      "legume",
      "pulses",
      "nitrogen fixation",
      "jeevamrut friendly",
    ],
    isOrganic: true,
    harvestDaysAgo: 10,
    origin: "Hosur, Tamil Nadu",
    storage:
      "Store culture below 25 °C, away from direct sunlight — never freeze or leave it in a hot vehicle.",
    storageLifeDays: 180,
    organicDetails:
      "Live culture — CFU guaranteed till pack date; pair with jaggery slurry for best stickiness.",
    unitsSold: 1400,
    createdHoursAgo: 24,
    composition:
      "Rhizobium leguminosarum 1 × 10⁹ CFU/g on sterile peat carrier, moisture 35–40%, pH 6.8–7.2.",
    application:
      "10 g per kg seed as a slurry in 5% jaggery solution; shade-dry 30 minutes and sow the same evening. 2 kg per acre for soil drill with FYM.",
  }),
  simple({
    id: "agr-psb-01",
    name: "PSB Phosphate-Solubilizing Bacteria Culture",
    tagline: "Liquid PSB that unlocks phosphorus locked in your soil",
    description:
      "Liquid culture of Bacillus megaterium that dissolves fixed phosphates and makes them crop-available season-long. One litre treats soil for 5–10 acres or all the seed for an acre of cereals.",
    categoryId: "bio-fertilizers",
    sellerId: "mithran-inputs",
    imgKey: "p-biopest",
    variants: [
      v("v1", "500 ml bottle", "ml", 500, 280, 340),
      v("v2", "1 L bottle", "ml", 1000, 480, 580),
    ],
    rating: 4.4,
    reviewCount: 260,
    badges: ["organic", "new"],
    tags: ["psb", "phosphate solubilizer", "biofertilizer", "liquid culture", "drip"],
    isOrganic: true,
    isNew: true,
    harvestDaysAgo: 8,
    origin: "Coimbatore, Tamil Nadu",
    storage:
      "Store culture below 25 °C in shade; do not puncture — live liquid needs room to breathe.",
    storageLifeDays: 180,
    unitsSold: 1100,
    createdHoursAgo: 48,
    composition:
      "Bacillus megaterium + Pseudomonas putida, 2 × 10⁹ CFU/ml each, carrier-free liquid, pH 6.5–7.0.",
    application:
      "Soil/drip: 1 L per acre in 200 L water. Seed treatment: 10 ml per kg seed with jaggery slurry; seedling root dip 100 ml in 10 L for 20 min.",
  }),

  /* --------------------------- vermicompost (2) ---------------------------- */
  simple({
    id: "agr-vermicompost-01",
    name: "Premium Screened Vermicompost",
    tagline: "Double-screened worm castings — dark, crumbly, odour-free",
    description:
      "Hand-turned vermicompost from cow dung and crop residue, double-screened to 3 mm and sun-cured. Black crumbly castings that revive tired pot soil within a fortnight.",
    categoryId: "vermicompost",
    sellerId: "terrablend",
    imgKey: "p-vermicompost",
    variants: gv([
      ["5 kg bag", 5000, 225, 280],
      ["10 kg bag", 10000, 420, 520],
      ["25 kg bag", 25000, 1000, 1250],
    ]),
    rating: 4.8,
    reviewCount: 1120,
    badges: ["organic", "bestseller"],
    tags: ["vermicompost", "worm castings", "soil", "organic manure", "khad"],
    isOrganic: true,
    isBestSeller: true,
    harvestDaysAgo: 15,
    origin: "Hosur, Tamil Nadu",
    storage:
      "Keep moist, shaded and breathable — never store airtight while wet.",
    storageLifeDays: 180,
    organicDetails:
      "OCF Grade-1; lab-tested NPK 1.8-1.2-1.5 with batch report included in every 25 kg lot.",
    unitsSold: 5400,
    createdHoursAgo: 48,
    composition:
      "NPK 1.8 : 1.2 : 1.5 + humic substances and beneficial microbes; EC < 2 dS/m, pH 6.8.",
    application:
      "200–400 g per plant monthly; 2 tonnes per acre before sowing; 20% by volume in potting mixes.",
  }),
  simple({
    id: "agr-vermiwash-01",
    name: "Vermiwash Liquid Concentrate",
    tagline: "Coir-filtered vermiwash — foliar tonic and soft pest deterrent",
    description:
      "Brown-gold leachate collected through live worm beds and coir filters, rich in enzymes, humates and natural growth hormones. Doubles as a foliar tonic and a mild deterrent for sap-sucking pests.",
    categoryId: "vermicompost",
    sellerId: "green-acres",
    imgKey: "p-vermicompost",
    variants: [
      v("v1", "500 ml bottle", "ml", 500, 180, 220),
      v("v2", "1 L bottle", "ml", 1000, 320, 390),
      v("v3", "5 L can", "ml", 5000, 1450, 1750),
    ],
    rating: 4.5,
    reviewCount: 380,
    badges: ["organic"],
    tags: ["vermiwash", "foliar tonic", "liquid manure", "jeevamrut partner"],
    isOrganic: true,
    harvestDaysAgo: 12,
    origin: "Erode, Tamil Nadu",
    storage:
      "Keep the bottle closed in shade; use within 6 months — live enzymes fade with time.",
    storageLifeDays: 180,
    unitsSold: 2100,
    createdHoursAgo: 96,
    composition:
      "Vermi-leachate with dissolved humates, auxins and amino acids; TDS 1.5–2%, pH 7.0–7.5.",
    application:
      "Foliar: 100 ml per litre of water every 10 days at dusk. Drench: 250 ml per litre weekly for pots; 5 L per acre through irrigation.",
  }),

  /* ------------------------------ compost (2) ------------------------------ */
  simple({
    id: "agr-cow-dung-compost-01",
    name: "Cow Dung Compost (Fully Decomposed)",
    tagline: "Six-month pit-composted govya khad, weed-seed free",
    description:
      "Desi cow dung composted in lined pits for 180 days with regular turning — fully decomposed, dark, earthy-smelling and free of viable weed seeds. The safest all-round khad for vegetables and paddy nurseries.",
    categoryId: "compost",
    sellerId: "green-acres",
    imgKey: "p-manure",
    variants: gv([
      ["5 kg bag", 5000, 110, 135],
      ["10 kg bag", 10000, 200, 245],
      ["25 kg bag", 25000, 450, 550],
    ]),
    rating: 4.6,
    reviewCount: 540,
    badges: ["organic"],
    tags: ["govya", "cow dung", "khad", "compost", "desi cow"],
    isOrganic: true,
    harvestDaysAgo: 20,
    origin: "Hassan, Karnataka",
    storage: "Store under a roof on bare soil and keep it damp — it is live compost.",
    storageLifeDays: 365,
    organicDetails:
      "Composted 180+ days; thermophilic phase killed weed seeds and pathogens.",
    unitsSold: 4800,
    createdHoursAgo: 120,
    composition:
      "NPK 1.0 : 0.6 : 1.2, organic carbon 18–22%, C:N ratio 18:1, moisture 25–30%.",
    application:
      "2–4 tonnes per acre before sowing; 500 g per fruit tree twice a year; 10% by volume in potting mixes.",
  }),
  simple({
    id: "agr-city-compost-01",
    name: "City Compost (Waste-to-Compost)",
    tagline: "FCO-grade compost from fully segregated city wet waste",
    description:
      "Windrow-composted for 60 days under FCO norms from 100% segregated municipal wet waste, then screened to 6 mm. An economical organic-carbon builder for field crops, lawns and avenue planting.",
    categoryId: "compost",
    sellerId: "mithran-inputs",
    imgKey: "p-manure",
    variants: gv([
      ["5 kg bag", 5000, 90, 110],
      ["10 kg bag", 10000, 165, 200],
      ["25 kg bag", 25000, 350, 430],
    ]),
    rating: 4.2,
    reviewCount: 190,
    badges: ["organic", "deal"],
    tags: ["city compost", "municipal compost", "organic carbon", "khad", "budget manure"],
    isOrganic: true,
    harvestDaysAgo: 35,
    origin: "Guntur, Andhra Pradesh",
    storage: "Store dry and covered; if lumps form it is curing — spread and air it out.",
    storageLifeDays: 365,
    organicDetails: "Meets FCO city-compost norms; heavy metals within notified limits.",
    unitsSold: 700,
    createdHoursAgo: 168,
    composition:
      "NPK 1.0 : 0.7 : 0.9, organic carbon ≥ 16%, C:N < 20:1, screened to 6 mm.",
    application:
      "1–2 tonnes per acre with the basal dose; 100 g per sq ft for lawns before monsoon; safe at any crop stage.",
  }),

  /* ----------------------------- cocopeat (2) ------------------------------ */
  simple({
    id: "agr-cocopeat-block-01",
    name: "Cocopeat Block 5 kg (Low EC, Washed)",
    tagline: "Washed low-EC coco block — expands to ~70 L of fluffy media",
    description:
      "5 kg compressed block of double-washed, sieved coco pith with EC below 0.5 mS/cm. Expands to roughly 70 litres of airy substrate when hydrated with 20–25 L of water.",
    categoryId: "cocopeat",
    sellerId: "terrablend",
    imgKey: "p-cocopeat",
    variants: [
      v("v1", "1 block (5 kg)", "pc", 1, 290, 350),
      v("v2", "3 blocks", "pc", 3, 810, 1000),
    ],
    rating: 4.7,
    reviewCount: 980,
    badges: ["organic", "bestseller"],
    tags: ["cocopeat", "coco block", "hydroponics", "potting media", "low ec"],
    isOrganic: true,
    isBestSeller: true,
    harvestDaysAgo: 40,
    origin: "Coimbatore, Tamil Nadu",
    storage:
      "Keep blocks dry; once expanded, hold media moist and shaded — never leave it soaking wet in a closed bag.",
    storageLifeDays: 730,
    unitsSold: 8200,
    createdHoursAgo: 60,
    composition:
      "100% washed coco pith — EC < 0.5 mS/cm, pH 5.8–6.8, expansion 65–70 L per block, sodium < 0.4 meq/g.",
    application:
      "Soak the block in 20–25 L water for 30 minutes, fluff up, and use 25–40% by volume in potting mix; hydroponics: blend 70% pith + 30% husk chips.",
  }),
  simple({
    id: "agr-cocopeat-buffered-01",
    name: "Buffered Coco Peat Bag (25 L)",
    tagline: "Calcium-buffered, ready-to-use coco peat — no N lock-up",
    description:
      "Coco peat treated with calcium nitrate to displace sodium and potassium, so it will not steal nitrogen or calcium from seedlings. Pre-fluffed and bagged — open, moisten and plant.",
    categoryId: "cocopeat",
    sellerId: "terrablend",
    imgKey: "p-cocopeat",
    variants: [
      v("v1", "10 L bag", "l", 10, 210, 260),
      v("v2", "25 L bag", "l", 25, 440, 540),
    ],
    rating: 4.6,
    reviewCount: 430,
    badges: ["organic"],
    tags: ["buffered cocopeat", "seed starting", "hydroponics", "soilless", "calcium buffered"],
    isOrganic: true,
    harvestDaysAgo: 30,
    origin: "Coimbatore, Tamil Nadu",
    storage:
      "Keep the bag closed and shaded; media is pre-moistened — avoid letting it dry out completely between uses.",
    storageLifeDays: 730,
    unitsSold: 2600,
    createdHoursAgo: 140,
    composition:
      "Calcium-nitrate buffered coco pith + 15% husk chips; EC < 0.3 mS/cm, Na < 0.15 meq/g, K < 0.4 meq/g, pH 5.9–6.5.",
    application:
      "Use as-is for seed starting; blend 50% media + 30% compost + 20% perlite for mature pots; add 2 g/L CaNO₃ in hydroponic solutions.",
  }),

  /* ---------------------------- potting-mix (2) ---------------------------- */
  simple({
    id: "agr-potting-mix-veg-01",
    name: "Organic Vegetable Potting Mix",
    tagline: "Open-and-plant mix for tomatoes, chillies and kitchen greens",
    description:
      "Balanced blend of buffered cocopeat, vermicompost, sterile red soil and neem cake, pre-fertilized for the first three weeks of growth. No raw bark or fresh manure — safe for indoor and terrace pots.",
    categoryId: "potting-mix",
    sellerId: "terrablend",
    imgKey: "p-potmix",
    variants: [
      v("v1", "5 L bag", "l", 5, 179, 220),
      v("v2", "10 L bag", "l", 10, 299, 360),
      v("v3", "25 L bag", "l", 25, 649, 780),
    ],
    rating: 4.8,
    reviewCount: 1350,
    badges: ["organic"],
    tags: ["potting mix", "kitchen garden", "terrace garden", "vegetable mix", "mitti mix"],
    isOrganic: true,
    harvestDaysAgo: 18,
    origin: "Hosur, Tamil Nadu",
    storage: "Keep the bag closed in shade; use within a year — microbial activity fades slowly.",
    storageLifeDays: 365,
    organicDetails: "Only composted/organic inputs; steam-treated soil component.",
    unitsSold: 9800,
    createdHoursAgo: 36,
    composition:
      "Cocopeat 40% + vermicompost 25% + red soil 20% + neem cake 5% + perlite 10%; NPK 0.8-0.5-0.8, EC 1.2 dS/m.",
    application:
      "Fill pots directly and sow or transplant — no manure needed for the first 3 weeks; top-dress 50 g of vermicompost per pot every 30 days.",
  }),
  simple({
    id: "agr-cactus-mix-01",
    name: "Cactus & Succulent Mix",
    tagline: "Fast-draining gritty mix — no more rotting succulents",
    description:
      "Chunky, quick-draining blend of cocopeat, pumice, perlite, coarse sand and a pinch of neem cake. Holds just enough moisture for succulents, cacti, haworthia and jade to root deep without rot.",
    categoryId: "potting-mix",
    sellerId: "terrablend",
    imgKey: "p-potmix",
    variants: [
      v("v1", "5 L bag", "l", 5, 199, 240),
      v("v2", "10 L bag", "l", 10, 329, 390, false),
    ],
    rating: 4.7,
    reviewCount: 620,
    badges: ["organic", "new"],
    tags: ["cactus mix", "succulent", "drainage", "pumice", "gritty mix"],
    isOrganic: true,
    isNew: true,
    harvestDaysAgo: 22,
    origin: "Hosur, Tamil Nadu",
    storage: "Keep dry in a sealed bag — this mix must stay bone-dry until potting.",
    storageLifeDays: 730,
    unitsSold: 3100,
    createdHoursAgo: 24,
    composition:
      "Pumice 30% + perlite 20% + coarse river sand 20% + washed cocopeat 25% + neem cake 5%; water retention < 35%.",
    application:
      "Pot as-is without adding garden soil; water only when the mix is fully dry. Refresh the top 5 cm every 12–18 months.",
  }),

  /* --------------------------- organic-manure (3) -------------------------- */
  simple({
    id: "agr-fym-01",
    name: "Farmyard Manure (FYM)",
    tagline: "Well-rotted cattle-shed manure — the farmer's original khad",
    description:
      "Six-month-old well-rotted farmyard manure from cattle sheds mixed with bedding straw — crumbly, dark and mild-smelling. The dependable base dose for field crops, orchards and new garden beds.",
    categoryId: "organic-manure",
    sellerId: "green-acres",
    imgKey: "p-manure",
    variants: gv([
      ["5 kg bag", 5000, 100, 120],
      ["10 kg bag", 10000, 180, 220],
      ["25 kg bag", 25000, 375, 450],
    ]),
    rating: 4.4,
    reviewCount: 410,
    badges: ["organic"],
    tags: ["fym", "farmyard manure", "khad", "cattle manure", "base dose"],
    isOrganic: true,
    harvestDaysAgo: 45,
    origin: "Hassan, Karnataka",
    storage:
      "Stack in shade on soil, keep moist and cover with mulch — live compost only improves with age.",
    storageLifeDays: 365,
    unitsSold: 7200,
    createdHoursAgo: 180,
    composition:
      "NPK 0.5 : 0.3 : 0.5, organic carbon 14–18%, C:N 20:1, moisture 20–25%, fully decomposed straw bedding.",
    application:
      "4–6 tonnes per acre before sowing for cereals; 10–15 kg per fruit tree annually; 20% by volume to loosen heavy garden soil.",
  }),
  simple({
    id: "agr-goat-manure-01",
    name: "Goat Manure Pellets",
    tagline: "Odour-free pellets — hot manure tamed into a slow feed",
    description:
      "Composted and pelletized goat droppings manure that feeds steadily for 8–10 weeks without burning roots. Nearly odourless and clean to handle — the terrace-garden favourite.",
    categoryId: "organic-manure",
    sellerId: "green-acres",
    imgKey: "p-manure",
    variants: gv([
      ["1 kg pouch", 1000, 95, 120],
      ["5 kg bag", 5000, 395, 480],
    ]),
    rating: 4.6,
    reviewCount: 350,
    badges: ["organic"],
    tags: ["goat manure", "sheep pellets", "khad", "slow release", "terrace garden"],
    isOrganic: true,
    harvestDaysAgo: 25,
    origin: "Guntur, Andhra Pradesh",
    storage: "Keep in a dry shed; pellets re-harden in damp weather but stay effective.",
    storageLifeDays: 730,
    unitsSold: 1900,
    createdHoursAgo: 150,
    composition:
      "NPK 2.5 : 1.4 : 1.7, organic carbon 28%, calcium 2%; composted and pelletized, moisture < 12%.",
    application:
      "50–100 g per plant every 45 days for vegetables and flowers; 200 g per fruit tree; 300–400 kg per acre for cash crops.",
  }),
  simple({
    id: "agr-sheep-manure-01",
    name: "Sheep Manure (Composted)",
    tagline: "Nitrogen-rich pen manure, aged and screened",
    description:
      "Sheep-pen manure aged 90 days with turning, then screened to remove stones and bedding — hotter than cow compost, so a little goes far. Classic dressing for leafy greens and maize.",
    categoryId: "organic-manure",
    sellerId: "green-acres",
    imgKey: "p-manure",
    variants: gv([
      ["1 kg pouch", 1000, 85, 105],
      ["5 kg bag", 5000, 350, 420],
    ]),
    rating: 4.4,
    reviewCount: 240,
    badges: ["organic"],
    tags: ["sheep manure", "khurak", "nitrogen", "leafy greens", "khad"],
    isOrganic: true,
    harvestDaysAgo: 38,
    origin: "Erode, Tamil Nadu",
    storage: "Store shaded and slightly moist; avoid airtight drums while fresh.",
    storageLifeDays: 365,
    unitsSold: 1200,
    createdHoursAgo: 210,
    composition:
      "NPK 1.8 : 1.0 : 1.2, organic carbon 24%; composted 90 days, screened to 8 mm.",
    application:
      "1–1.5 tonnes per acre three weeks before sowing; 100–150 g per plant worked into the topsoil monthly for greens.",
  }),

  /* ----------------------------- neem-cake (2) ----------------------------- */
  simple({
    id: "agr-neem-cake-powder-01",
    name: "Neem Cake Powder (Cold-Pressed)",
    tagline: "Pure cold-pressed neem khali — feed and soil guard in one",
    description:
      "Powdered residue of cold-pressed neem seed kernels — a slow organic fertilizer that also suppresses root grubs, nematodes and soil fungi. The same 5% neem cake line we use in our potting mixes.",
    categoryId: "neem-cake",
    sellerId: "mithran-inputs",
    imgKey: "p-neem",
    variants: gv([
      ["1 kg pouch", 1000, 120, 150],
      ["5 kg bag", 5000, 475, 580],
      ["25 kg bag", 25000, 1850, 2250],
    ]),
    rating: 4.8,
    reviewCount: 870,
    badges: ["organic"],
    tags: ["neem khali", "neem cake", "nematode", "organic fertilizer", "soil protector"],
    isOrganic: true,
    harvestDaysAgo: 28,
    origin: "Erode, Tamil Nadu",
    storage: "Store dry and sealed; keeps azadirachtin active for two seasons.",
    storageLifeDays: 730,
    organicDetails:
      "Single-press kernel cake, no de-oiled solvent extraction; azadirachtin ≥ 300 ppm verified per batch.",
    unitsSold: 6600,
    createdHoursAgo: 84,
    composition:
      "Neem seed kernel cake — NPK 5 : 1.4 : 1.2, azadirachtin ≥ 300 ppm, organic carbon 30%, oil content 4–6%.",
    application:
      "100–200 kg per acre with the basal dose for nematode control; 50 g per 15 L pot every 60 days; 5% of potting-mix volume.",
  }),
  simple({
    id: "agr-neem-cake-granules-01",
    name: "Neem Cake Granules (Azadirachtin 300+ PPM)",
    tagline: "Easy-spread neem granules for broadcast basal doses",
    description:
      "Granulated neem cake that spreads evenly without dust, degrades over 45–60 days and keeps releasing nitrogen and azadirachtin. Preferred by paddy and sugarcane growers for machine broadcasting.",
    categoryId: "neem-cake",
    sellerId: "mithran-inputs",
    imgKey: "p-neem",
    variants: gv([
      ["1 kg pouch", 1000, 135, 165],
      ["5 kg bag", 5000, 525, 640],
      ["25 kg bag", 25000, 1980, 2400, false],
    ]),
    rating: 4.5,
    reviewCount: 290,
    badges: ["organic"],
    tags: ["neem granules", "neem khali", "paddy", "slow release", "broadcast"],
    isOrganic: true,
    harvestDaysAgo: 32,
    origin: "Guntur, Andhra Pradesh",
    storage: "Keep sealed and dry; granules lose azadirachtin if stored wet.",
    storageLifeDays: 730,
    unitsSold: 1500,
    createdHoursAgo: 190,
    composition:
      "Granulated neem cake — NPK 4.9 : 1.3 : 1.1, azadirachtin 300–450 ppm, 2–4 mm granules, oil 5%.",
    application:
      "50–150 kg per acre broadcast at field preparation for paddy, sugarcane and vegetables; repeat mid-season at 50 kg per acre.",
  }),

  /* ---------------------------- panchagavya (1) ---------------------------- */
  simple({
    id: "agr-panchagavya-01",
    name: "Panchagavya Concentrate (21-Day Fermented)",
    tagline: "Classic five-product desi cow brew, fermented the full 21 days",
    description:
      "Traditional panchagavya from desi cow milk, curd, ghee, dung and urine, fermented 21 days with banana, jaggery and tender coconut water and stirred twice daily. The sour-sweet aroma is your quality check.",
    categoryId: "panchagavya",
    sellerId: "green-acres",
    imgKey: "p-panchagavya",
    variants: [
      v("v1", "500 ml bottle", "ml", 500, 220, 270),
      v("v2", "1 L bottle", "ml", 1000, 380, 460),
      v("v3", "5 L can", "ml", 5000, 1650, 2000),
    ],
    rating: 4.7,
    reviewCount: 460,
    badges: ["organic", "new"],
    tags: ["panchagavya", "desi cow", "gomutra", "jeevamrut", "growth promoter", "biodynamic"],
    isOrganic: true,
    isNew: true,
    harvestDaysAgo: 21,
    origin: "Erode, Tamil Nadu",
    storage:
      "Keep in a wide-mouthed non-metal container in shade and stir daily — it keeps improving up to 6 months.",
    storageLifeDays: 180,
    organicDetails:
      "Brewed from indigenous (desi) cow herd only; no metal contact during fermentation.",
    unitsSold: 2400,
    createdHoursAgo: 24,
    composition:
      "Fermented 20 L batch: cow dung 7 kg, gomutra 10 L, milk 3 L, curd 2 L, ghee 1 kg + banana, jaggery, tender coconut; pH 5.5–6.5.",
    application:
      "Spray 30 ml per litre every 15 days at dusk; 500 ml per acre through irrigation; dip seedling roots in 3% solution before transplanting.",
  }),

  /* ---------------------- plant-growth-promoters (2) ----------------------- */
  simple({
    id: "agr-seaweed-01",
    name: "Seaweed Extract Concentrate (Ascophyllum Nodosum)",
    tagline: "Cold-processed kelp — stress shield and fruit-set booster",
    description:
      "Cold-processed liquid extract of Ascophyllum nodosum kelp, rich in natural cytokinins, alginates and betaines. The go-to spray before heat waves and at flowering to hold fruit set.",
    categoryId: "plant-growth-promoters",
    sellerId: "terrablend",
    imgKey: "p-fertilizer",
    variants: [
      v("v1", "250 ml bottle", "ml", 250, 299, 360),
      v("v2", "500 ml bottle", "ml", 500, 525, 630),
      v("v3", "1 L bottle", "ml", 1000, 950, 1150),
    ],
    rating: 4.7,
    reviewCount: 780,
    badges: ["organic"],
    tags: ["seaweed extract", "ascophyllum", "growth promoter", "flowering", "kelp", "tonic"],
    isOrganic: true,
    harvestDaysAgo: 15,
    origin: "Coimbatore, Tamil Nadu",
    storage:
      "Store the bottle tightly closed below 30 °C in shade; crystals at the bottom are normal — shake well before use.",
    storageLifeDays: 730,
    organicDetails:
      "Cold-processed (no alkali hydrolysis) to retain native cytokinins; OMRI-listed input.",
    unitsSold: 4300,
    createdHoursAgo: 60,
    composition:
      "Ascophyllum nodosum extract 18% w/w (alginate 12%, mannitol 4%); K₂O 16% in solution, pH 8–9.",
    application:
      "Foliar 2–3 ml per litre at pre-flowering and fruit set, 15 days apart; drip 500 ml per acre; seed soak 5 ml per litre for 6 hours.",
  }),
  simple({
    id: "agr-humic-granules-01",
    name: "Humic Acid Granules (Shiny, 95%)",
    tagline: "Shiny black granules that open up hard, tired soils",
    description:
      "95% humic acid in shiny black leonardite-derived granules — improves soil structure, chelates nutrients and visibly darkens depleted soils within weeks. The diamond-shine gloss is the purity tell.",
    categoryId: "plant-growth-promoters",
    sellerId: "mithran-inputs",
    imgKey: "p-fertilizer",
    variants: gv([
      ["1 kg pouch", 1000, 260, 320],
      ["5 kg bag", 5000, 1050, 1280],
      ["25 kg bag", 25000, 4250, 5100],
    ]),
    rating: 4.5,
    reviewCount: 380,
    badges: ["organic", "deal"],
    tags: ["humic acid", "soil conditioner", "leonardite", "root growth", "black gold"],
    isOrganic: true,
    harvestDaysAgo: 50,
    origin: "Guntur, Andhra Pradesh",
    storage: "Store dry; granules are hygroscopic — reseal the bag firmly after every use.",
    storageLifeDays: 730,
    unitsSold: 2300,
    createdHoursAgo: 110,
    composition:
      "Humic acid ≥ 95% (leonardite-derived, granulated as K-humate), water-soluble ≥ 97%, fulvic fraction 8–12%.",
    application:
      "4–8 kg per acre broadcast or with the basal fertilizer; 2–5 g per pot monthly; dissolves slowly — pre-mix with moist soil.",
  }),

  /* --------------------------- micronutrients (1) -------------------------- */
  simple({
    id: "agr-chelated-micro-01",
    name: "Chelated Micronutrient Mix (Fe, Zn, Mn, B, Cu)",
    tagline: "Fully EDTA-chelated six-pack for yellow-leaf rescue",
    description:
      "Fully chelated EDTA mix of iron, zinc, manganese, boron, copper and molybdenum for quick correction of interveinal yellowing, little-leaf and flower drop. Works even in alkaline soils where sulphates fail.",
    categoryId: "micronutrients",
    sellerId: "terrablend",
    imgKey: "p-fertilizer",
    variants: gv([
      ["250 g pouch", 250, 225, 270],
      ["500 g pouch", 500, 395, 470],
      ["1 kg pouch", 1000, 690, 820],
    ]),
    rating: 4.6,
    reviewCount: 410,
    badges: ["organic"],
    tags: ["micronutrients", "chelated", "edta", "iron deficiency", "yellow leaves"],
    isOrganic: true,
    harvestDaysAgo: 20,
    origin: "Coimbatore, Tamil Nadu",
    storage: "Keep sealed in a dry place; chelates hold full strength for three years if kept dry.",
    storageLifeDays: 730,
    unitsSold: 1600,
    createdHoursAgo: 30,
    composition:
      "Fe 4%, Zn 5%, Mn 2%, B 1%, Cu 1%, Mo 0.1% — all as EDTA chelates, 100% water-soluble powder.",
    application:
      "Foliar 1–2 g per litre at vegetative and pre-flowering stages; drip 500 g per acre; never tank-mix with alkaline pesticides.",
  }),

  /* --------------------------- bio-pesticides (2) -------------------------- */
  simple({
    id: "agr-trichoderma-01",
    name: "Trichoderma Viride (Soil Application)",
    tagline: "Beneficial fungus that eats root-rot pathogens alive",
    description:
      "Trichoderma viride spore culture that colonizes roots and parasitizes Fusarium, Pythium and Rhizoctonia behind wilt and damping-off. Standard companion for FYM — never tank-mix with fungicides.",
    categoryId: "bio-pesticides",
    sellerId: "mithran-inputs",
    imgKey: "p-biopest",
    variants: gv([
      ["250 g pack", 250, 205, 250],
      ["500 g pack", 500, 325, 390],
      ["1 kg pack", 1000, 540, 650],
    ]),
    rating: 4.5,
    reviewCount: 510,
    badges: ["organic"],
    tags: [
      "trichoderma",
      "biofungicide",
      "root rot",
      "wilt",
      "soil application",
      "biological control",
    ],
    isOrganic: true,
    harvestDaysAgo: 12,
    origin: "Hosur, Tamil Nadu",
    storage:
      "Store culture below 25 °C, away from sunlight; use within 6 months of the pack date.",
    storageLifeDays: 180,
    unitsSold: 3800,
    createdHoursAgo: 100,
    composition:
      "Trichoderma viride 2 × 10⁶ CFU/g on talc-peat carrier, moisture 8–10%, pH 6.5.",
    application:
      "Mix 2 kg with 100 kg FYM, keep covered 7 days and broadcast per acre; seed treatment 5 g per kg seed; drench 5 g per litre for wilting plants.",
  }),
  simple({
    id: "agr-beauveria-01",
    name: "Beauveria Bassiana (Foliar Spray)",
    tagline: "White muscardine fungus for bollworm and caterpillar control",
    description:
      "Beauveria bassiana spore powder that infects and kills chewing pests — bollworm, stem borer, thrips and whitefly — within 3–7 days of contact. Safe for bees when sprayed at dusk; no residue, no waiting period.",
    categoryId: "bio-pesticides",
    sellerId: "mithran-inputs",
    imgKey: "p-biopest",
    variants: gv([
      ["250 g pack", 250, 215, 260],
      ["500 g pack", 500, 340, 410],
      ["1 kg pack", 1000, 560, 680, false],
    ]),
    rating: 4.4,
    reviewCount: 260,
    badges: ["organic"],
    tags: ["beauveria", "biopesticide", "bollworm", "caterpillar", "foliar spray", "keet nashak"],
    isOrganic: true,
    harvestDaysAgo: 10,
    origin: "Coimbatore, Tamil Nadu",
    storage:
      "Store culture below 25 °C away from sunlight; avoid UV exposure — spray only at dusk.",
    storageLifeDays: 90,
    unitsSold: 950,
    createdHoursAgo: 130,
    composition:
      "Beauveria bassiana 1 × 10⁸ CFU/g wettable powder on talc-kaolin carrier, moisture ≤ 8%.",
    application:
      "5 g per litre of water as an evening spray at 500 g per acre; repeat after 10 days. Do not tank-mix with any fungicide or acidic adjuvant.",
  }),

  /* ------------------------ organic-pest-control (2) ----------------------- */
  simple({
    id: "agr-neem-oil-01",
    name: "Cold-Pressed Neem Oil 1500 PPM",
    tagline: "Single-press kernel oil — the 1500 PPM grower standard",
    description:
      "Cold-pressed neem seed oil standardized to 1500 ppm azadirachtin and left unrefined so the natural limonoids stay intact. Works as an antifeedant and growth disruptor on 200+ pests while sparing ladybirds and bees.",
    categoryId: "organic-pest-control",
    sellerId: "mithran-inputs",
    imgKey: "p-neem",
    variants: [
      v("v1", "500 ml bottle", "ml", 500, 225, 270),
      v("v2", "1 L bottle", "ml", 1000, 399, 480),
    ],
    rating: 4.8,
    reviewCount: 940,
    badges: ["organic", "bestseller"],
    tags: ["neem oil", "1500 ppm", "pest control", "antifeedant", "cold pressed", "keet nashak"],
    isOrganic: true,
    isBestSeller: true,
    harvestDaysAgo: 18,
    origin: "Erode, Tamil Nadu",
    storage:
      "Store cool and dark; oil clouds below 15 °C — warm gently to clear. Use within two years.",
    storageLifeDays: 730,
    organicDetails:
      "Single cold press, no solvent extraction; every batch GC-tested for azadirachtin content.",
    unitsSold: 7600,
    createdHoursAgo: 90,
    composition:
      "Cold-pressed Azadirachta indica kernel oil, azadirachtin 1500 ppm, neem bitters ≥ 5%, unrefined.",
    application:
      "3–5 ml per litre of water with 1 ml per litre of liquid soap as emulsifier, evening spray every 7–10 days; drench 10 ml per litre against root mealybugs.",
  }),
  simple({
    id: "agr-dashparni-01",
    name: "Dashparni Ark (10-Leaf Herbal Extract)",
    tagline: "Ten-leaf fermented ark from the Vrikshayurveda playbook",
    description:
      "Fermented extract of ten bitter leaves — neem, datura, calotropis, custard apple, castor and more — with cow dung and urine, brewed 30 days. A broad-spectrum herbal deterrent for sucking pests and leaf miners.",
    categoryId: "organic-pest-control",
    sellerId: "green-acres",
    imgKey: "p-panchagavya",
    variants: [
      v("v1", "1 L bottle", "ml", 1000, 260, 320),
      v("v2", "5 L can", "ml", 5000, 1150, 1400),
    ],
    rating: 4.3,
    reviewCount: 170,
    badges: ["organic"],
    tags: ["dashparni ark", "vrikshayurveda", "herbal pesticide", "gomutra", "leaf extract"],
    isOrganic: true,
    harvestDaysAgo: 30,
    origin: "Erode, Tamil Nadu",
    storage:
      "Keep in shade with the bottle closed; natural sediment is normal — filter through cloth before use; use within a year.",
    storageLifeDays: 365,
    unitsSold: 600,
    createdHoursAgo: 160,
    composition:
      "Fermented extract of 10 botanical leaves (neem, datura, calotropis, castor, custard apple, etc.) + cow dung 5 kg + gomutra 5 L per batch, 30-day anaerobic brew.",
    application:
      "200–250 ml per litre of water as a dusk spray at 3–5 L per acre; repeat after 10 days or with every fresh pest flush.",
  }),

  /* --------------------------- seed-treatment (1) -------------------------- */
  simple({
    id: "agr-azospirillum-01",
    name: "Azospirillum Seed Treatment Culture",
    tagline: "Associative nitrogen-fixer for cereals, millets and sugarcane",
    description:
      "Azospirillum brasilense culture that colonizes grass roots, fixes 20–40 kg nitrogen per hectare and secretes IAA for stronger tillering. The standard beej-shodh for paddy, maize, ragi and sugarcane.",
    categoryId: "seed-treatment",
    sellerId: "mithran-inputs",
    imgKey: "p-biopest",
    variants: gv([
      ["250 g pack", 250, 200, 245],
      ["1 kg pack", 1000, 520, 620],
    ]),
    rating: 4.5,
    reviewCount: 300,
    badges: ["organic"],
    tags: ["azospirillum", "seed treatment", "biofertilizer", "cereals", "millets", "beej shodh"],
    isOrganic: true,
    harvestDaysAgo: 10,
    origin: "Hosur, Tamil Nadu",
    storage:
      "Store culture below 25 °C away from direct sunlight; never leave it in tractor-cabin heat.",
    storageLifeDays: 180,
    unitsSold: 1700,
    createdHoursAgo: 72,
    composition:
      "Azospirillum brasilense 1 × 10⁹ CFU/g on peat-lignite carrier, moisture 35–40%, IAA-producing strain.",
    application:
      "20 g per kg seed with 5% jaggery slurry, shade-dry and sow the same day; 1 kg per acre for seedling root dip or mixed with FYM at transplanting.",
  }),
];
