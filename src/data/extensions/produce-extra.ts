import type { Product } from "@/types";
import { simple, gv, v } from "../product-builders";

/* ------------------------------------------------------------------
 * PRODUCE_EXTRA — expansion wave for the organic produce department.
 * fruits (8) · vegetables (9) · leafy-greens (12) · herbs (14) = 43 SKUs
 * ------------------------------------------------------------------ */

export const PRODUCE_EXTRA: Product[] = [
  /* ======================= FRUITS (8) ======================= */

  simple({
    id: "prd-guava-01",
    name: "Allahabad Safeda Guava",
    tagline: "Cloud-soft, honey-aromatic Safeda guavas",
    description:
      "The legendary Allahabad Safeda — thin-skinned, softly seedy and famously sweet with none of the hard grit of commercial guava. Grown on 12-year-old trees at our Sangareddy farm and picked firm-ripe so they arrive without a single bruise.",
    categoryId: "fruits",
    sellerId: "green-acres",
    imgKey: "c-fruits",
    variants: gv([
      ["500 g (2–3 pcs)", 500, 79, 99],
      ["1 kg (4–6 pcs)", 1000, 149, 189],
    ]),
    rating: 4.6,
    reviewCount: 640,
    badges: ["organic", "bestseller", "local"],
    tags: ["guava", "amrood", "jaam", "perakkai", "fruit", "vitamin c"],
    isOrganic: true,
    isBestSeller: true,
    harvestDaysAgo: 1,
    origin: "Sangareddy, Telangana",
    storage:
      "Ripen at room temperature until fragrant, then refrigerate in a perforated bag. Use within 2 days of full ripeness.",
    storageLifeDays: 5,
    organicDetails:
      "Certified India Organic. Orchard floor mulched with cow-dung compost; fruit bagged on-tree instead of sprayed.",
    unitsSold: 5400,
    createdHoursAgo: 22,
    freshnessNote: "Picked at 5 AM today, graded the same morning",
  }),

  simple({
    id: "prd-sapota-01",
    name: "Sapota (Chikku)",
    tagline: "Caramel-sweet, grain-soft chikoo",
    description:
      "Kalipatti sapota from Guntur's red soils, harvested mature and counter-ripened to a sandy, brown-sugar sweetness. Ready when the skin turns dull and yields gently to thumb pressure.",
    categoryId: "fruits",
    sellerId: "green-acres",
    imgKey: "c-fruits",
    variants: gv([
      ["500 g (3–4 pcs)", 500, 89, 110],
      ["1 kg (6–8 pcs)", 1000, 165, 199],
    ]),
    rating: 4.5,
    reviewCount: 410,
    badges: ["organic", "local"],
    tags: ["sapota", "chikku", "chikoo", "sapodilla", "fruit", "chickoo"],
    isOrganic: true,
    harvestDaysAgo: 1,
    origin: "Guntur, Andhra Pradesh",
    storage:
      "Store unripe fruit at room temperature in a paper bag; refrigerate only after it softens.",
    storageLifeDays: 5,
    organicDetails:
      "Certified India Organic. Trees fed with tank-silt and vermicompost; ripened naturally, never carbide-treated.",
    unitsSold: 2100,
    createdHoursAgo: 40,
  }),

  simple({
    id: "prd-custard-apple-01",
    name: "Custard Apple (Sitaphal)",
    tagline: "Spoon-soft sitaphal, custard-sweet",
    description:
      "Hand-picked mature from Anantapur's rain-fed orchards and ripened without carbide, so the segments scoop out like chilled custard. A true seasonal treat — October to February only.",
    categoryId: "fruits",
    sellerId: "sunrise-valley",
    imgKey: "c-fruits",
    variants: gv([
      ["2 pcs (~600 g)", 600, 120, 150, true],
      ["4 pcs (~1.2 kg)", 1200, 229, 279, false],
    ]),
    rating: 4.7,
    reviewCount: 830,
    badges: ["organic", "seasonal"],
    tags: ["custard apple", "sitaphal", "sharifa", "seethaphal", "fruit", "dessert"],
    isOrganic: true,
    isSeasonal: true,
    harvestDaysAgo: 2,
    origin: "Anantapur, Andhra Pradesh",
    storage:
      "Ripen loose at room temperature; once the skin gaps open, refrigerate and eat within 2 days.",
    storageLifeDays: 4,
    organicDetails:
      "Certified India Organic from rain-fed orchards. No ripening chambers, no carbide — only straw-basket ripening.",
    unitsSold: 3200,
    createdHoursAgo: 30,
  }),

  simple({
    id: "prd-mosambi-01",
    name: "Sweet Lime (Mosambi)",
    tagline: "Mild, juicy mosambi with no acid burn",
    description:
      "Vijayapura mosambi with thin skin and gentle, low-acid juice — the classic Indian detox citrus. Tree-ripened and never gas-coloured, so the skin may carry a natural green fleck.",
    categoryId: "fruits",
    sellerId: "hillside-orchards",
    imgKey: "p-lemon",
    variants: gv([
      ["500 g (2–3 pcs)", 500, 60, 75],
      ["1 kg (5–6 pcs)", 1000, 109, 135],
      ["2 kg family pack", 2000, 199, 249],
    ]),
    rating: 4.4,
    reviewCount: 520,
    badges: ["organic", "seasonal"],
    tags: ["sweet lime", "mosambi", "mausambi", "musambi", "citrus", "fruit"],
    isOrganic: true,
    isSeasonal: true,
    harvestDaysAgo: 2,
    origin: "Vijayapura, Karnataka",
    storage:
      "Keep in a cool, ventilated basket away from sunlight; refrigerate cut fruit wrapped in film.",
    storageLifeDays: 10,
    organicDetails:
      "Certified India Organic. Citrus block managed with neem oil sprays and sticky traps instead of systemic insecticides.",
    unitsSold: 4700,
    createdHoursAgo: 48,
  }),

  simple({
    id: "prd-tender-coconut-01",
    name: "Tender Coconut (Elaneer)",
    tagline: "Sweet karikku water & spoonable malai",
    description:
      "Seven-month tender greens harvested from Pollachi palms and trimmed the same day for maximum elaneer sweetness. Expect 250–350 ml of cool water with soft, jelly-like malai inside.",
    categoryId: "fruits",
    sellerId: "green-acres",
    imgKey: "c-fruits",
    variants: [
      v("v1", "Pack of 2 (~1 kg)", "pc", 2, 110, 140, true, 35),
      v("v2", "Pack of 4 (~2 kg)", "pc", 4, 199, 259, true, 25),
    ],
    rating: 4.8,
    reviewCount: 1250,
    badges: ["organic", "bestseller", "deal"],
    tags: ["tender coconut", "elaneer", "nariyal pani", "karikku", "coconut water", "thengai"],
    isOrganic: true,
    isBestSeller: true,
    harvestDaysAgo: 0,
    origin: "Pollachi, Tamil Nadu",
    storage:
      "Keep whole coconuts in a cool shaded spot and consume within 2–3 days for the sweetest water.",
    storageLifeDays: 4,
    organicDetails:
      "Certified India Organic palm estate. Climbers harvest by hand with pole saws; no chemical tendering agents used.",
    unitsSold: 9800,
    createdHoursAgo: 6,
    freshnessNote: "Cut from the palms this morning at the Pollachi farm",
  }),

  simple({
    id: "prd-dragon-fruit-01",
    name: "Dragon Fruit (White Flesh)",
    tagline: "Kiwifruit crunch, subtle melon sweetness",
    description:
      "First-crop white-flesh dragon fruit from our shade-net blocks in Ramanagara — 350–450 g fruits studded with edible kiwi-like seeds and a delicate melon-pear flavour. Chilled, they make the most striking fruit bowl on the table.",
    categoryId: "fruits",
    sellerId: "terra-verde",
    imgKey: "c-fruits",
    variants: gv([
      ["1 pc (~400 g)", 400, 179, 225, true],
      ["2 pcs (~800 g)", 800, 339, 429, false],
    ]),
    rating: 4.3,
    reviewCount: 190,
    badges: ["organic", "new", "limited"],
    tags: ["dragon fruit", "pitaya", "kamalam", "pitahaya", "fruit", "antioxidant"],
    isOrganic: true,
    isNew: true,
    harvestDaysAgo: 1,
    origin: "Ramanagara, Karnataka",
    storage:
      "Refrigerate whole in the crisper and consume within a week; halve and scoop like a kiwi.",
    storageLifeDays: 7,
    organicDetails:
      "Certified India Organic. Cacti grown on coconut-coir posts under shade net with drip fertigation of jeevamrutha.",
    unitsSold: 900,
    createdHoursAgo: 18,
  }),

  simple({
    id: "prd-jamun-01",
    name: "Jamun (Java Plum)",
    tagline: "Astringent-sweet summer berries",
    description:
      "Hand-gathered each morning from 30-year-old jamun trees on our Kolar groves — deep-purple, glossy fruit prized for diabetic-friendly snacking, kaadha and a salt-and-chilli sprinkle. The season is short; so is our shelf of it.",
    categoryId: "fruits",
    sellerId: "sunrise-valley",
    imgKey: "p-grapes",
    variants: gv([
      ["250 g", 250, 119, 149],
      ["500 g", 500, 219, 275],
    ]),
    rating: 4.4,
    reviewCount: 360,
    badges: ["organic", "seasonal"],
    tags: ["jamun", "java plum", "jambul", "neredu", "nagapazham", "fruit"],
    isOrganic: true,
    isSeasonal: true,
    harvestDaysAgo: 0,
    origin: "Kolar, Karnataka",
    storage:
      "Refrigerate unwashed in a shallow box and rinse just before eating; best within 2 days.",
    storageLifeDays: 3,
    organicDetails:
      "Certified India Organic. Wild-grove harvest from untreated heritage trees, gathered without ripening chemicals.",
    unitsSold: 1400,
    createdHoursAgo: 12,
    freshnessNote: "Gathered at sunrise, field-cooled immediately",
  }),

  simple({
    id: "prd-amla-01",
    name: "Amla (Indian Gooseberry)",
    tagline: "Sour-crisp Chakaiya amla, high vitamin C",
    description:
      "Pratapgarh Chakaiya amla — dense, fibrous and high in natural vitamin C, grating clean without stringiness for murabba, juice or churan. A winter-season fruit that stores far longer than it looks like it would.",
    categoryId: "fruits",
    sellerId: "hillside-orchards",
    imgKey: "p-lemon",
    variants: gv([
      ["500 g", 500, 79, 95],
      ["1 kg", 1000, 145, 179],
    ]),
    rating: 4.6,
    reviewCount: 470,
    badges: ["organic", "seasonal", "local"],
    tags: ["amla", "gooseberry", "amalaki", "nellikai", "amla juice", "fruit"],
    isOrganic: true,
    isSeasonal: true,
    harvestDaysAgo: 2,
    origin: "Pratapgarh, Uttar Pradesh",
    storage:
      "Keep in a paper bag in the refrigerator's main shelf; stays firm up to two weeks.",
    storageLifeDays: 14,
    organicDetails:
      "Certified India Organic. Grove managed with vermicompost and hand weeding; zero post-harvest dips or waxes.",
    unitsSold: 2600,
    createdHoursAgo: 56,
  }),

  /* ======================= VEGETABLES (9) ======================= */

  simple({
    id: "prd-okra-01",
    name: "Organic Okra (Bhindi)",
    tagline: "Tender pods, zero fibrous strings",
    description:
      "Arka Anamika pods snapped by hand at 7–9 cm so they cook tender without a trace of string. Beds are fed only vermicompost and neem cake, and pods are dry-packed to keep slime down.",
    categoryId: "vegetables",
    sellerId: "green-acres",
    imgKey: "c-vegetables",
    variants: gv([
      ["500 g", 500, 65, 80],
      ["1 kg", 1000, 119, 149],
    ]),
    rating: 4.5,
    reviewCount: 940,
    badges: ["organic", "bestseller"],
    tags: ["okra", "bhindi", "lady finger", "vendakkai", "bendekai", "vegetable"],
    isOrganic: true,
    isBestSeller: true,
    harvestDaysAgo: 0,
    origin: "Siddipet, Telangana",
    storage:
      "Store unwashed in a paper-towel-lined box in the refrigerator; wash just before cutting.",
    storageLifeDays: 4,
    organicDetails:
      "Certified India Organic. Neem-cake soil amendment and yellow sticky traps for whitefly; no systemic sprays.",
    unitsSold: 7600,
    createdHoursAgo: 8,
  }),

  simple({
    id: "prd-brinjal-01",
    name: "Brinjal (Bharta Variety)",
    tagline: "Smoky-fleshed round brinjal for baingan bharta",
    description:
      "Firm, globe-shaped purple-green brinjal bred for roasting — dense flesh that chars without collapsing and turns silken when mashed. Grown under pheromone-trap IPM, never systemic sprays.",
    categoryId: "vegetables",
    sellerId: "green-acres",
    imgKey: "c-vegetables",
    variants: gv([
      ["500 g (2–3 pcs)", 500, 55, 70],
      ["1 kg (5–6 pcs)", 1000, 99, 125],
    ]),
    rating: 4.4,
    reviewCount: 380,
    badges: ["organic", "local"],
    tags: ["brinjal", "baingan", "eggplant", "kathirikkai", "badanekai", "vegetable"],
    isOrganic: true,
    harvestDaysAgo: 1,
    origin: "Hosur, Tamil Nadu",
    storage:
      "Keep whole in a cool, dry basket and use within 3–4 days; do not refrigerate longer than that.",
    storageLifeDays: 5,
    organicDetails:
      "Certified India Organic. Pheromone traps and neem seed kernel extract manage shoot-and-fruit borer without chemicals.",
    unitsSold: 3300,
    createdHoursAgo: 30,
  }),

  simple({
    id: "prd-green-chilli-01",
    name: "Green Chilli (Guntur)",
    tagline: "Guntur heat with garden-fresh crunch",
    description:
      "S-4 Guntur chillies picked at the glossy green stage — a clean, building heat that seasons curries without overwhelming them. Hand-sorted and never waxed; stems stay green for days.",
    categoryId: "vegetables",
    sellerId: "sunrise-valley",
    imgKey: "c-vegetables",
    variants: gv([
      ["250 g", 250, 45, 56],
      ["500 g", 500, 85, 105],
    ]),
    rating: 4.3,
    reviewCount: 610,
    badges: ["organic", "bestseller"],
    tags: ["green chilli", "hari mirch", "hasiru menasinakai", "pachimirchi", "chilli", "vegetable"],
    isOrganic: true,
    isBestSeller: true,
    harvestDaysAgo: 0,
    origin: "Guntur, Andhra Pradesh",
    storage:
      "Refrigerate in a perforated zip bag with the stems on; remove any soft chillies promptly.",
    storageLifeDays: 6,
    organicDetails:
      "Certified India Organic. Chilli beds intercropped with marigold as a trap crop; pest pressure managed biologically.",
    unitsSold: 8200,
    createdHoursAgo: 5,
  }),

  simple({
    id: "prd-ridge-gourd-01",
    name: "Ridge Gourd (Heerekai)",
    tagline: "Sweet, quick-cooking turai",
    description:
      "Arka Sumeet ridge gourd harvested at pencil thickness, so the peel scrapes soft and the flesh stays sweet. Trellis-grown on our mixed-crop plots and hand-pollinated each morning.",
    categoryId: "vegetables",
    sellerId: "green-acres",
    imgKey: "p-cucumber",
    variants: gv([
      ["500 g (1–2 pcs)", 500, 48, 60],
      ["1 kg (3–4 pcs)", 1000, 89, 110],
    ]),
    rating: 4.4,
    reviewCount: 290,
    badges: ["organic"],
    tags: ["ridge gourd", "turai", "turiya", "heerekai", "peerkangai", "vegetable"],
    isOrganic: true,
    harvestDaysAgo: 1,
    origin: "Coimbatore, Tamil Nadu",
    storage:
      "Wrap in a cotton cloth and refrigerate in the crisper; peel and cook within 3 days.",
    storageLifeDays: 5,
    organicDetails:
      "Certified India Organic. Gourd vines irrigated with jeevamrutha through drip; beewax seal on cuts instead of fungicide.",
    unitsSold: 1800,
    createdHoursAgo: 44,
  }),

  simple({
    id: "prd-bottle-gourd-01",
    name: "Bottle Gourd (Sorakaya)",
    tagline: "Mild, hydrating lauki for daily cooking",
    description:
      "Young Nandi bottle gourds with pale, thin skin and a seedless heart — ideal for sorakaya pulusu, lauki kofta or juice. Raised on drip irrigation with composted farmyard manure.",
    categoryId: "vegetables",
    sellerId: "green-acres",
    imgKey: "p-cucumber",
    variants: gv([
      ["1 pc (~800 g)", 800, 55, 70],
      ["2 pcs (~1.6 kg)", 1600, 99, 125],
    ]),
    rating: 4.3,
    reviewCount: 340,
    badges: ["organic"],
    tags: ["bottle gourd", "lauki", "sorakaya", "dudhi", "chorakaa", "vegetable"],
    isOrganic: true,
    harvestDaysAgo: 1,
    origin: "Nizamabad, Telangana",
    storage:
      "Refrigerate whole in the crisper drawer; once cut, wrap tightly and use within 2 days.",
    storageLifeDays: 7,
    organicDetails:
      "Certified India Organic. FYM-composted beds with interplanted legumes fixing nitrogen; no growth boosters of any kind.",
    unitsSold: 2400,
    createdHoursAgo: 36,
  }),

  simple({
    id: "prd-pumpkin-01",
    name: "Desi Pumpkin (Kaddu)",
    tagline: "Deep-orange, chestnut-sweet flesh",
    description:
      "Sun-cured Muscat pumpkin from kharif fields — thick, dry flesh with the high sugar content that makes sambar, halwa and soups taste richer. Cured ten days on straw for a longer, dormancy-protected shelf life.",
    categoryId: "vegetables",
    sellerId: "sunrise-valley",
    imgKey: "c-vegetables",
    variants: gv([
      ["1 kg", 1000, 55, 70],
      ["2.5 kg (half)", 2500, 125, 155],
    ]),
    rating: 4.5,
    reviewCount: 410,
    badges: ["organic", "local"],
    tags: ["pumpkin", "kaddu", "parangikai", "dudde", "sitaphal kaddu", "vegetable"],
    isOrganic: true,
    harvestDaysAgo: 3,
    origin: "Raichur, Karnataka",
    storage:
      "Store whole in a cool, ventilated pantry; wrap cut surfaces in film and refrigerate up to a week.",
    storageLifeDays: 30,
    organicDetails:
      "Certified India Organic. Field-cured on straw beds without fungicide dips; seeds saved from our own stock.",
    unitsSold: 2900,
    createdHoursAgo: 60,
  }),

  simple({
    id: "prd-sweet-potato-01",
    name: "Sweet Potato (Shakarkandi)",
    tagline: "Honey-dry flesh that roasts caramel-crisp",
    description:
      "Purple-skinned Co 3 sweet potatoes cured a week so their starch converts to maltose — they roast crisp-skinned and honey-sweet. Ozone-water washed with no chemical dipping.",
    categoryId: "vegetables",
    sellerId: "green-acres",
    imgKey: "p-potato",
    variants: gv([
      ["500 g", 500, 60, 75],
      ["1 kg", 1000, 109, 135],
    ]),
    rating: 4.6,
    reviewCount: 520,
    badges: ["organic", "deal"],
    tags: ["sweet potato", "shakarkandi", "ratalu", "madhura kizhangu", "genasu", "vegetable"],
    isOrganic: true,
    harvestDaysAgo: 2,
    origin: "Dharwad, Karnataka",
    storage:
      "Keep in a dark, ventilated basket at room temperature — refrigeration turns the flesh hard.",
    storageLifeDays: 14,
    organicDetails:
      "Certified India Organic. Vine cuttings grown in raised mounds of red soil and vermicompost, cured without sprout inhibitors.",
    unitsSold: 3800,
    createdHoursAgo: 52,
  }),

  simple({
    id: "prd-raw-banana-01",
    name: "Raw Banana (Plantain)",
    tagline: "Starchy, firm vazhakkai for poriyal & chips",
    description:
      "Nendran plantains harvested green for poriyal, kofta and banana chips — dense, waxy flesh that holds its shape in curries. Latex-stained hands are washed in tamarind water at the pack house, never with chemicals.",
    categoryId: "vegetables",
    sellerId: "green-acres",
    imgKey: "p-banana",
    variants: [
      v("v1", "4 pcs (~800 g)", "pc", 4, 52, 65, true, 45),
      v("v2", "8 pcs (~1.6 kg)", "pc", 8, 98, 120, true, 30),
    ],
    rating: 4.4,
    reviewCount: 350,
    badges: ["organic", "local"],
    tags: ["raw banana", "kaccha kela", "plantain", "vazhakkai", "balekai", "vegetable"],
    isOrganic: true,
    harvestDaysAgo: 2,
    origin: "Theni, Tamil Nadu",
    storage:
      "Keep at room temperature away from ripe fruit; refrigerate only after cooking, not before.",
    storageLifeDays: 8,
    organicDetails:
      "Certified India Organic. Banana bunches sleeved in dry coconut leaves on the plant, cut green to order.",
    unitsSold: 3100,
    createdHoursAgo: 28,
  }),

  simple({
    id: "prd-french-beans-01",
    name: "French Beans",
    tagline: "Snapping-fresh, stringless pencil beans",
    description:
      "Arka Suvidha beans pulled every other morning at the pencil-slender stage — crisp enough to snap clean and sweet enough to eat raw. Hydro-cooled within the hour to lock the green.",
    categoryId: "vegetables",
    sellerId: "sunrise-valley",
    imgKey: "p-greenpeas",
    variants: gv([
      ["250 g", 250, 45, 55],
      ["500 g", 500, 82, 100],
    ]),
    rating: 4.5,
    reviewCount: 430,
    badges: ["organic"],
    tags: ["french beans", "green beans", "fansi", "goruchikkudu", "beans poriyal", "vegetable"],
    isOrganic: true,
    harvestDaysAgo: 0,
    origin: "Ooty, Tamil Nadu",
    storage:
      "Refrigerate unwashed in a breathable bag; top-and-tail just before cooking.",
    storageLifeDays: 6,
    organicDetails:
      "Certified India Organic. Leguminous beds fix their own nitrogen; aphids handled with ladybird releases.",
    unitsSold: 2700,
    createdHoursAgo: 9,
    freshnessNote: "Pulled at 6 AM, hydro-cooled within the hour",
  }),

  /* ======================= LEAFY GREENS (12) ======================= */

  simple({
    id: "prd-methi-01",
    name: "Organic Methi (Fenugreek Leaves)",
    tagline: "Aromatic methi for thepla & methi malai",
    description:
      "Cut at 25–30 cm before the plant flowers, when bitterness is at its gentlest and aroma at its strongest. Roots shaken clean rather than washed — expect a little honest farm dust, never a chemical dip.",
    categoryId: "leafy-greens",
    sellerId: "green-acres",
    imgKey: "p-spinach",
    variants: [
      v("v1", "1 bunch (~250 g)", "bunch", 250, 30, 38, true, 80),
      v("v2", "3 bunches (~750 g)", "bunch", 750, 80, 99, true, 40),
    ],
    rating: 4.7,
    reviewCount: 1100,
    badges: ["organic", "bestseller"],
    tags: ["methi", "fenugreek", "menthya", "vendhaya keerai", "methi leaves", "leafy greens"],
    isOrganic: true,
    isBestSeller: true,
    harvestDaysAgo: 0,
    origin: "Medak, Telangana",
    storage:
      "Wrap in a dry cotton cloth inside a perforated bag; do not wash before storing.",
    storageLifeDays: 3,
    organicDetails:
      "Certified India Organic. Broadcast-sown beds top-dressed with vermicompost; zero pesticide residues per NPOP tests.",
    unitsSold: 11200,
    createdHoursAgo: 4,
    freshnessNote: "Cut at 6 AM today",
  }),

  simple({
    id: "prd-dill-01",
    name: "Dill Leaves (Sabasige Soppu)",
    tagline: "Feathery dill for sabsige rice & dal",
    description:
      "Delicate dill cut young so the anise-citrus aroma stays in the leaf, not the stem. A south Indian kitchen staple for sabsige soppu rice and dill-moong palya.",
    categoryId: "leafy-greens",
    sellerId: "green-acres",
    imgKey: "p-coriander",
    variants: [
      v("v1", "1 bunch (~150 g)", "bunch", 150, 35, 45, true, 55),
    ],
    rating: 4.4,
    reviewCount: 220,
    badges: ["organic", "local"],
    tags: ["dill", "sabasige", "sabsige soppu", "savaa", "shepu", "leafy greens"],
    isOrganic: true,
    harvestDaysAgo: 0,
    origin: "Bengaluru Rural, Karnataka",
    storage:
      "Stand stems in a glass of water covered loosely with a bag, or wrap in damp cloth and refrigerate.",
    storageLifeDays: 3,
    organicDetails:
      "Certified India Organic. Succession-sown every ten days so every bunch is first-cut, never regrowth.",
    unitsSold: 1200,
    createdHoursAgo: 16,
  }),

  simple({
    id: "prd-red-amaranth-01",
    name: "Red Amaranth (Dantu Soppu)",
    tagline: "Crimson-veined, iron-rich summer greens",
    description:
      "Heat-loving dantu with magenta leaves and a mild earthy sweetness — the classic Karnataka summer green for dantu palya and dal. The colour deepens on quick stir-frying with garlic.",
    categoryId: "leafy-greens",
    sellerId: "sunrise-valley",
    imgKey: "c-leafy",
    variants: [
      v("v1", "1 bunch (~250 g)", "bunch", 250, 28, 35, true, 70),
      v("v2", "2 bunches (~500 g)", "bunch", 500, 50, 62, true, 35),
    ],
    rating: 4.3,
    reviewCount: 180,
    badges: ["organic", "seasonal"],
    tags: ["red amaranth", "dantu", "dantina soppu", "chaulai", "rajgira leaves", "leafy greens"],
    isOrganic: true,
    isSeasonal: true,
    harvestDaysAgo: 0,
    origin: "Kolar, Karnataka",
    storage:
      "Rinse only before use; store bunched in a damp cotton bag in the fridge's lowest shelf.",
    storageLifeDays: 2,
    organicDetails:
      "Certified India Organic. Summer green grown under 35% shade net to keep leaves tender without sprays.",
    unitsSold: 1500,
    createdHoursAgo: 14,
  }),

  simple({
    id: "prd-green-amaranth-01",
    name: "Green Amaranth (Kuppikeerai)",
    tagline: "Tender wild-style keerai, 4-minute cook",
    description:
      "Farm-edge grown kuppikeerai cut tender at ankle height — stems snap rather than bend, the true test of freshness. Cooks in four minutes with garlic and red chilli.",
    categoryId: "leafy-greens",
    sellerId: "sunrise-valley",
    imgKey: "p-spinach",
    variants: [
      v("v1", "1 bunch (~250 g)", "bunch", 250, 26, 34, true, 65),
    ],
    rating: 4.2,
    reviewCount: 160,
    badges: ["organic"],
    tags: ["green amaranth", "keerai", "kuppikeerai", "chaulai saag", "harive soppu", "leafy greens"],
    isOrganic: true,
    harvestDaysAgo: 0,
    origin: "Chikkaballapur, Karnataka",
    storage:
      "Shake off field moisture, wrap in paper inside a bag and refrigerate; use within 2 days.",
    storageLifeDays: 2,
    organicDetails:
      "Certified India Organic. Grown on farm-edge beds that act as pollinator corridors between vegetable plots.",
    unitsSold: 1300,
    createdHoursAgo: 20,
  }),

  simple({
    id: "prd-malabar-spinach-01",
    name: "Malabar Spinach (Basale)",
    tagline: "Succulent climbing greens, never slimy",
    description:
      "Thick-leafed basale that stays crunchy in curries — the uppu saaru and basale soppu favourite. Grown on living trellises and harvested leaf-by-leaf so vines regrow for the next cut.",
    categoryId: "leafy-greens",
    sellerId: "sunrise-valley",
    imgKey: "p-spinach",
    variants: [
      v("v1", "1 bunch (~300 g)", "bunch", 300, 32, 40, true, 60),
      v("v2", "2 bunches (~600 g)", "bunch", 600, 58, 72, true, 30),
    ],
    rating: 4.5,
    reviewCount: 390,
    badges: ["organic", "local"],
    tags: ["malabar spinach", "basale", "basale soppu", "poi saag", "pui shak", "leafy greens"],
    isOrganic: true,
    harvestDaysAgo: 0,
    origin: "Shimoga, Karnataka",
    storage:
      "Store upright like flowers in a jar of shallow water at room temperature for up to 3 days.",
    storageLifeDays: 3,
    organicDetails:
      "Certified India Organic. Vine trellises shared with ridge gourd rows, cutting pest cycles naturally.",
    unitsSold: 3600,
    createdHoursAgo: 11,
  }),

  simple({
    id: "prd-moringa-leaves-01",
    name: "Moringa (Drumstick Leaves)",
    tagline: "Hand-stripped superfood green",
    description:
      "Moringa leaflets stripped by hand and de-stemmed within the hour of cutting — the most nutrient-dense green we grow, for dhal, thoran and moringa dosa. No yellow leaflet makes it past our sorting table.",
    categoryId: "leafy-greens",
    sellerId: "green-acres",
    imgKey: "c-leafy",
    variants: [
      v("v1", "1 pack (~200 g)", "pack", 200, 40, 50, true, 45),
    ],
    rating: 4.6,
    reviewCount: 310,
    badges: ["organic"],
    tags: ["moringa", "drumstick leaves", "murungai keerai", "nugge soppu", "superfood", "leafy greens"],
    isOrganic: true,
    harvestDaysAgo: 0,
    origin: "Sangareddy, Telangana",
    storage:
      "Keep refrigerated in the retail box; spread on a tray if condensation forms and cover loosely.",
    storageLifeDays: 3,
    organicDetails:
      "Certified India Organic. Leaves cut from three-year-old trees on a seven-day rotation for peak leaflet density.",
    unitsSold: 2200,
    createdHoursAgo: 24,
  }),

  simple({
    id: "prd-mustard-greens-01",
    name: "Mustard Greens (Sarson)",
    tagline: "Peppery sarson, winter-harvested",
    description:
      "Cut from winter fields before the plants bolt, when the pepper bite is at its kindest — the green for authentic sarson ka saag. Slow-cooked with makki ka atta, the heat mellows into sweetness.",
    categoryId: "leafy-greens",
    sellerId: "sunrise-valley",
    imgKey: "c-leafy",
    variants: [
      v("v1", "1 bunch (~350 g)", "bunch", 350, 30, 38, true, 50),
    ],
    rating: 4.4,
    reviewCount: 260,
    badges: ["organic", "seasonal"],
    tags: ["mustard greens", "sarson", "sarson ka saag", "kadugu keerai", "saag", "leafy greens"],
    isOrganic: true,
    isSeasonal: true,
    harvestDaysAgo: 0,
    origin: "Nashik, Maharashtra",
    storage:
      "Wrap in damp muslin and refrigerate; blanch and freeze in balls for longer keeping.",
    storageLifeDays: 3,
    organicDetails:
      "Certified India Organic. Winter-only crop on rest beds between kharif vegetable cycles, fed with green manure.",
    unitsSold: 2000,
    createdHoursAgo: 26,
  }),

  simple({
    id: "prd-cabbage-01",
    name: "Organic Cabbage",
    tagline: "Tight, sweet-snap winter heads",
    description:
      "Golden Acre heads cut at cricket-ball firmness — layered leaves that shave into fine slaw and hold crunch through light cooking. Outer wrapper leaves are left on for transit protection.",
    categoryId: "leafy-greens",
    sellerId: "green-acres",
    imgKey: "p-lettuce",
    variants: gv([
      ["1 head (~700 g)", 700, 58, 72],
      ["2 heads (~1.4 kg)", 1400, 108, 132],
    ]),
    rating: 4.4,
    reviewCount: 480,
    badges: ["organic", "bestseller"],
    tags: ["cabbage", "patta gobi", "muttaikose", "kosu", "elekosu", "leafy greens"],
    isOrganic: true,
    isBestSeller: true,
    harvestDaysAgo: 1,
    origin: "Hosur, Tamil Nadu",
    storage:
      "Keep the whole head in the crisper in a loose bag; once cut, wrap the remainder in film.",
    storageLifeDays: 12,
    organicDetails:
      "Certified India Organic. Diamond-back moth controlled with Bacillus thuringiensis, not chemical sprays.",
    unitsSold: 4900,
    createdHoursAgo: 34,
  }),

  simple({
    id: "prd-bok-choy-01",
    name: "Bok Choy (Pak Choi)",
    tagline: "Juicy ivory stems, spinach-soft leaves",
    description:
      "Cold-night grown bok choy with thick ivory stems and spoon-shaped leaves — it stir-fries in ninety seconds with garlic and sesame. Grown in netted winter beds, so no aphid spray is ever needed.",
    categoryId: "leafy-greens",
    sellerId: "terra-verde",
    imgKey: "p-lettuce",
    variants: [
      v("v1", "1 head (~350 g)", "pc", 1, 55, 70, true, 40),
    ],
    rating: 4.4,
    reviewCount: 140,
    badges: ["organic", "new"],
    tags: ["bok choy", "pak choi", "bokchoy", "chinese cabbage", "stir fry", "leafy greens"],
    isOrganic: true,
    isNew: true,
    harvestDaysAgo: 0,
    origin: "Nandi Hills, Karnataka",
    storage:
      "Refrigerate stem-down in a box with a damp cloth; separate leaves and rinse before stir-frying.",
    storageLifeDays: 4,
    organicDetails:
      "Certified India Organic. Asian brassica trial block; insect netting and hand-weeding only.",
    unitsSold: 800,
    createdHoursAgo: 15,
  }),

  simple({
    id: "prd-arugula-01",
    name: "Arugula (Rocket Leaves)",
    tagline: "Peppery rocket for salads & hot pizza",
    description:
      "Cut-at-dawn rocket with the signature almond-pepper heat — tender enough for salads, robust enough to wilt onto hot pizza. Washed in chilled ozone water and spun dry before packing.",
    categoryId: "leafy-greens",
    sellerId: "terra-verde",
    imgKey: "p-kale",
    variants: gv([
      ["100 g", 100, 60, 75],
      ["200 g", 200, 110, 135],
    ]),
    rating: 4.5,
    reviewCount: 230,
    badges: ["organic", "new"],
    tags: ["arugula", "rocket leaves", "rucola", "salad greens", "peppery", "leafy greens"],
    isOrganic: true,
    isNew: true,
    harvestDaysAgo: 0,
    origin: "Nandi Hills, Karnataka",
    storage:
      "Keep in the sealed retail pack in the fridge; wash and spin only when plating.",
    storageLifeDays: 4,
    organicDetails:
      "Certified India Organic. Cut-and-come-again beds resown every three weeks; ozone-wash replaces chlorine.",
    unitsSold: 1100,
    createdHoursAgo: 12,
  }),

  simple({
    id: "prd-watercress-01",
    name: "Watercress",
    tagline: "True cress grown in running spring water",
    description:
      "True watercress raised in spring-fed gravel beds at our Coorg farm — small, glossy leaves with a clean mustard bite. Among the most nutrient-dense greens per calorie, superb in soups and sandwiches.",
    categoryId: "leafy-greens",
    sellerId: "hillside-orchards",
    imgKey: "p-spinach",
    variants: [
      v("v1", "1 pack (~100 g)", "pack", 100, 60, 75, true, 35),
    ],
    rating: 4.3,
    reviewCount: 110,
    badges: ["organic", "new"],
    tags: ["watercress", "cress", "salad greens", "nasturtium", "soup greens", "leafy greens"],
    isOrganic: true,
    isNew: true,
    harvestDaysAgo: 0,
    origin: "Coorg, Karnataka",
    storage:
      "Store stems-down in a glass of water in the fridge, loosely bagged; use within 2–3 days.",
    storageLifeDays: 3,
    organicDetails:
      "Certified India Organic. Beds flow with untested-by-chemicals spring water; harvested daily in small trays.",
    unitsSold: 700,
    createdHoursAgo: 10,
  }),

  simple({
    id: "prd-salad-mix-01",
    name: "Baby Leaf Salad Mix",
    tagline: "Five-leaf blend, washed & ready to plate",
    description:
      "A pillow of baby spinach, rocket, red amaranth, lettuce and baby beet leaf cut three weeks from sowing — tender, thrice-washed and ready to plate. Packed the evening before dispatch in a compostable clamshell.",
    categoryId: "leafy-greens",
    sellerId: "terra-verde",
    imgKey: "p-lettuce",
    variants: gv([
      ["100 g", 100, 59, 72],
      ["250 g", 250, 129, 155],
    ]),
    rating: 4.6,
    reviewCount: 190,
    badges: ["organic", "new"],
    tags: ["salad mix", "baby leaf", "mesclun", "salad greens", "lettuce", "leafy greens"],
    isOrganic: true,
    isNew: true,
    harvestDaysAgo: 0,
    origin: "Nandi Hills, Karnataka",
    storage:
      "Keep sealed and refrigerated at all times; open only at the table for maximum crunch.",
    storageLifeDays: 4,
    organicDetails:
      "Certified India Organic. Baby-leaf cut at 3 weeks from sowing; triple ozone-wash, zero chlorine.",
    unitsSold: 950,
    createdHoursAgo: 8,
  }),

  /* ======================= HERBS (14) ======================= */

  simple({
    id: "prd-mint-01",
    name: "Fresh Mint (Pudina)",
    tagline: "Icy-sweet pudina for chutney & chai",
    description:
      "Kosi mint cut pre-flowering so the menthol reads bright and sweet rather than camphor-sharp — the chutney, mojito and biryani green. Sold stems-on to hold moisture through the last kilometre.",
    categoryId: "herbs",
    sellerId: "green-acres",
    imgKey: "p-coriander",
    variants: [
      v("v1", "1 bunch (~100 g)", "bunch", 100, 30, 38, true, 90),
      v("v2", "3 bunches (~300 g)", "bunch", 300, 80, 99, true, 40),
    ],
    rating: 4.6,
    reviewCount: 720,
    badges: ["organic"],
    tags: ["mint", "pudina", "podina", "menthe", "phudina", "herbs"],
    isOrganic: true,
    harvestDaysAgo: 0,
    origin: "Medak, Telangana",
    storage:
      "Trim stem ends and stand in a glass of water in the fridge, loosely covered; change water daily.",
    storageLifeDays: 3,
    organicDetails:
      "Certified India Organic. Mint beds flooded with compost tea instead of chemical nitrogen top-ups.",
    unitsSold: 8400,
    createdHoursAgo: 5,
  }),

  simple({
    id: "prd-tulsi-01",
    name: "Holy Basil (Tulsi)",
    tagline: "Krishna tulsi for kadha & daily tea",
    description:
      "Purple-tinged Krishna tulsi cut at pre-bloom, when its clove-like oils peak — the kadha, chai and immunity staple of Indian kitchens. Grown on temple-row borders and hand-cut with secateurs.",
    categoryId: "herbs",
    sellerId: "terra-verde",
    imgKey: "c-herbs",
    variants: [
      v("v1", "1 bunch (~80 g)", "bunch", 80, 40, 50, true, 50),
    ],
    rating: 4.8,
    reviewCount: 540,
    badges: ["organic", "local"],
    tags: ["tulsi", "holy basil", "krishna tulsi", "thulasi", "kadha", "herbs"],
    isOrganic: true,
    harvestDaysAgo: 0,
    origin: "Sangareddy, Telangana",
    storage:
      "Use fresh within 3 days, or hang upside-down in shade to dry for tea through the month.",
    storageLifeDays: 4,
    organicDetails:
      "Certified India Organic. Seed stock from three-year-old mother plants; oils peak-tested before cutting.",
    unitsSold: 3900,
    createdHoursAgo: 18,
  }),

  simple({
    id: "prd-sweet-basil-01",
    name: "Sweet Basil (Genovese)",
    tagline: "Large-leaf Genovese, pure pesto material",
    description:
      "Genovese basil grown in open beds for bigger, sweeter leaves than polytunnel basil — no anise harshness, just clean pesto material. Pinch-harvested above the node so plants regrow within the week.",
    categoryId: "herbs",
    sellerId: "sunrise-valley",
    imgKey: "p-coriander",
    variants: [
      v("v1", "1 pack (~80 g)", "pack", 80, 45, 56, true, 55),
    ],
    rating: 4.5,
    reviewCount: 380,
    badges: ["organic"],
    tags: ["sweet basil", "genovese basil", "pesto", "italian herbs", "basil leaves", "herbs"],
    isOrganic: true,
    harvestDaysAgo: 0,
    origin: "Nandi Hills, Karnataka",
    storage:
      "Treat like flowers: trim stems, keep in water at room temperature away from direct sun.",
    storageLifeDays: 4,
    organicDetails:
      "Certified India Organic. Downy mildew managed with wider spacing and morning watering, not fungicides.",
    unitsSold: 2600,
    createdHoursAgo: 22,
  }),

  simple({
    id: "prd-curry-leaves-01",
    name: "Curry Leaves (Karibevu)",
    tagline: "Glossy Mysore-style tadka leaves",
    description:
      "Mysore-style curry leaves with fat, glossy leaflets and the high oil content that makes tadka smell like a restaurant's. Stripped from managed trees every second day and chilled on arrival.",
    categoryId: "herbs",
    sellerId: "green-acres",
    imgKey: "p-coriander",
    variants: [
      v("v1", "1 pack (~100 g, with stems)", "pack", 100, 25, 32, true, 100),
    ],
    rating: 4.7,
    reviewCount: 980,
    badges: ["organic", "local"],
    tags: ["curry leaves", "karibevu", "kadi patta", "karuveppilai", "karvepaku", "herbs"],
    isOrganic: true,
    harvestDaysAgo: 0,
    origin: "Mysuru, Karnataka",
    storage:
      "Refrigerate in the breathable pack, or sun-dry and jar for powder; never store wet.",
    storageLifeDays: 5,
    organicDetails:
      "Certified India Organic. Trees on a two-day strip rotation; sooty mould controlled by soap spray only.",
    unitsSold: 10500,
    createdHoursAgo: 4,
    freshnessNote: "Stripped from the tree at 7 AM today",
  }),

  simple({
    id: "prd-rosemary-01",
    name: "Fresh Rosemary",
    tagline: "Resinous sprigs for roasts & focaccia",
    description:
      "Woody rosemary cut in 10–12 cm sprigs from three-year-old bushes — camphor-pine aroma that survives an hour of roasting. One pack seasons four roast chickens; a little goes far.",
    categoryId: "herbs",
    sellerId: "terra-verde",
    imgKey: "c-herbs",
    variants: [
      v("v1", "1 pack (~50 g)", "pack", 50, 60, 75, true, 45),
    ],
    rating: 4.6,
    reviewCount: 320,
    badges: ["organic"],
    tags: ["rosemary", "roast herbs", "focaccia", "mediterranean herbs", "herbs"],
    isOrganic: true,
    harvestDaysAgo: 0,
    origin: "Nandi Hills, Karnataka",
    storage:
      "Wrap sprigs in slightly damp paper towel in a zip bag; keeps two weeks refrigerated.",
    storageLifeDays: 7,
    organicDetails:
      "Certified India Organic. Perennial bush rows mulched with gravel and sheep wool for weed-free living soil.",
    unitsSold: 1800,
    createdHoursAgo: 30,
  }),

  simple({
    id: "prd-thyme-01",
    name: "Fresh Thyme",
    tagline: "Lemon-tinged sprigs, flower-tipped",
    description:
      "Common thyme harvested just before flowering, when thymol concentration is highest — tiny leaves, woody stems, big aroma for soups, mushrooms and roast vegetables.",
    categoryId: "herbs",
    sellerId: "terra-verde",
    imgKey: "c-herbs",
    variants: [
      v("v1", "1 pack (~40 g)", "pack", 40, 55, 68, true, 45),
    ],
    rating: 4.5,
    reviewCount: 210,
    badges: ["organic"],
    tags: ["thyme", "thymol", "mediterranean herbs", "roast veg", "herbs"],
    isOrganic: true,
    harvestDaysAgo: 0,
    origin: "Nandi Hills, Karnataka",
    storage:
      "Keep in the original vented pack in the fridge's herb drawer; stems stay fragrant a week.",
    storageLifeDays: 7,
    organicDetails:
      "Certified India Organic. Harvest timed to pre-flower oil peak confirmed by our distillation partner.",
    unitsSold: 1400,
    createdHoursAgo: 33,
  }),

  simple({
    id: "prd-sage-01",
    name: "Fresh Sage",
    tagline: "Velvet-leaf sage for brown butter",
    description:
      "Grey-green sage with thick, velvety leaves that crackle crisp in brown butter and hold their earthy-honey flavour through long braises. Cut in whole top sprigs, never stripped bare.",
    categoryId: "herbs",
    sellerId: "terra-verde",
    imgKey: "c-herbs",
    variants: [
      v("v1", "1 pack (~40 g)", "pack", 40, 60, 75, true, 40),
    ],
    rating: 4.4,
    reviewCount: 150,
    badges: ["organic"],
    tags: ["sage", "salvia", "brown butter", "mediterranean herbs", "herbs"],
    isOrganic: true,
    harvestDaysAgo: 0,
    origin: "Nandi Hills, Karnataka",
    storage:
      "Wrap in dry paper towel inside a glass container; sage hates condensation.",
    storageLifeDays: 7,
    organicDetails:
      "Certified India Organic. Slow-growing perennial patch on drip irrigation; picked only in dry weather.",
    unitsSold: 900,
    createdHoursAgo: 46,
  }),

  simple({
    id: "prd-parsley-01",
    name: "Flat-Leaf Parsley",
    tagline: "Italian parsley, tabbouleh-ready",
    description:
      "Giant-of-Italy flat parsley with large, clean-tasting leaves — chop-ready for tabbouleh, chimichurri and garnish. Far sturdier than coriander; it holds a full week when chilled.",
    categoryId: "herbs",
    sellerId: "terra-verde",
    imgKey: "p-coriander",
    variants: [
      v("v1", "1 bunch (~80 g)", "bunch", 80, 50, 62, true, 55),
    ],
    rating: 4.5,
    reviewCount: 260,
    badges: ["organic"],
    tags: ["parsley", "italian parsley", "tabbouleh", "chimichurri", "garnish", "herbs"],
    isOrganic: true,
    harvestDaysAgo: 0,
    origin: "Nandi Hills, Karnataka",
    storage:
      "Shake dry, wrap in paper towel and refrigerate in a bag; refresh in ice water before use.",
    storageLifeDays: 6,
    organicDetails:
      "Certified India Organic. Biennial beds replanted every second season from our own seed line.",
    unitsSold: 1700,
    createdHoursAgo: 38,
  }),

  simple({
    id: "prd-oregano-01",
    name: "Fresh Oregano",
    tagline: "Pizza-oregano cut at pungent peak",
    description:
      "Greek oregano with the pungent, almost peppery punch that dried oregano cannot match — for marinara, grilled vegetables and hand-tossed pizza. Cut as flowering tips for maximum aroma.",
    categoryId: "herbs",
    sellerId: "sunrise-valley",
    imgKey: "c-herbs",
    variants: [
      v("v1", "1 pack (~40 g)", "pack", 40, 55, 68, true, 45),
    ],
    rating: 4.4,
    reviewCount: 170,
    badges: ["organic"],
    tags: ["oregano", "pizza herbs", "marjoram", "italian herbs", "herbs"],
    isOrganic: true,
    harvestDaysAgo: 0,
    origin: "Nandi Hills, Karnataka",
    storage:
      "Refrigerate in a vented herb pack; or strip, dry and crumble for a house oregano jar.",
    storageLifeDays: 7,
    organicDetails:
      "Certified India Organic. Rocky-bed grown with high sun exposure for carvacrol-dominant oil profile.",
    unitsSold: 1200,
    createdHoursAgo: 41,
  }),

  simple({
    id: "prd-lemongrass-01",
    name: "Lemongrass",
    tagline: "Citral-packed Thai stalks",
    description:
      "Thick white-bulbed lemongrass stalks with high citral content — bruise the base for tom yum and Thai curry, steep the tops for lemongrass tea. Cut fresh so bulbs arrive moist.",
    categoryId: "herbs",
    sellerId: "green-acres",
    imgKey: "c-herbs",
    variants: [
      v("v1", "3 stalks (~200 g)", "bunch", 200, 40, 50, true, 60),
    ],
    rating: 4.5,
    reviewCount: 290,
    badges: ["organic", "local"],
    tags: ["lemongrass", "citronella", "tom yum", "herbal tea", "herbs"],
    isOrganic: true,
    harvestDaysAgo: 1,
    origin: "Wayanad, Kerala",
    storage:
      "Wrap stalks in paper in the fridge crisper; freeze bruised and sliced for instant tea.",
    storageLifeDays: 8,
    organicDetails:
      "Certified India Organic. Clump-divided stock grown on rain-fed terraces; outer leaves returned as mulch.",
    unitsSold: 2100,
    createdHoursAgo: 27,
  }),

  simple({
    id: "prd-kaffir-lime-01",
    name: "Kaffir Lime Leaves (Makrut)",
    tagline: "Double-leaf Thai aroma, rare crop",
    description:
      "Hourglass makrut leaves from our six kaffir lime mother trees — the unmistakable citrus-floral top note for Thai curry, tom kha and sambal. Small seasonal harvests; when it's gone, it's gone.",
    categoryId: "herbs",
    sellerId: "hillside-orchards",
    imgKey: "c-herbs",
    variants: [
      v("v1", "1 pack (~30 leaves)", "pack", 30, 60, 75, true, 20),
    ],
    rating: 4.6,
    reviewCount: 95,
    badges: ["organic", "limited"],
    tags: ["kaffir lime", "makrut", "thai curry", "lime leaves", "tom kha", "herbs"],
    isOrganic: true,
    harvestDaysAgo: 1,
    origin: "Coorg, Karnataka",
    storage:
      "Seal leaves in a zip bag with all air pressed out; they freeze beautifully for months.",
    storageLifeDays: 10,
    organicDetails:
      "Certified India Organic. Mother-tree orchard block, hand-picked double leaves without tearing the wing.",
    unitsSold: 450,
    createdHoursAgo: 20,
  }),

  simple({
    id: "prd-bay-leaf-01",
    name: "Fresh Bay Leaf (Tej Patta)",
    tagline: "Living-tree bay with a cassia-cinnamon hint",
    description:
      "Fresh-picked Tejpat leaves with the cassia-cinnamon edge that Indian biryanis and pulaos expect — nothing like the dust of jarred bay. Simmer whole and fish out before serving.",
    categoryId: "herbs",
    sellerId: "hillside-orchards",
    imgKey: "c-herbs",
    variants: [
      v("v1", "1 pack (~20 leaves)", "pack", 20, 35, 45, true, 60),
    ],
    rating: 4.4,
    reviewCount: 210,
    badges: ["organic"],
    tags: ["bay leaf", "tej patta", "tejpatta", "biryani", "tamal patra", "herbs"],
    isOrganic: true,
    harvestDaysAgo: 1,
    origin: "Coorg, Karnataka",
    storage:
      "Keep in a paper envelope in a cool cupboard; fresh leaves also dry well on a window sill.",
    storageLifeDays: 12,
    organicDetails:
      "Certified India Organic. Leaves picked from ten-year-old Tejpat trees shade-dried at source when needed.",
    unitsSold: 1600,
    createdHoursAgo: 35,
  }),

  simple({
    id: "prd-chives-01",
    name: "Garlic Chives",
    tagline: "Flat blades, dumpling-filling ready",
    description:
      "Chinese garlic chives with flat, even blades and a soft garlic-ginger bite — the classic dumpling-filling green, also superb scrambled with egg. Cut high on the plant for maximum tenderness.",
    categoryId: "herbs",
    sellerId: "terra-verde",
    imgKey: "c-herbs",
    variants: [
      v("v1", "1 bunch (~100 g)", "bunch", 100, 45, 56, true, 50),
    ],
    rating: 4.3,
    reviewCount: 130,
    badges: ["organic"],
    tags: ["chives", "garlic chives", "ku chai", "dumpling greens", "jiaozi", "herbs"],
    isOrganic: true,
    harvestDaysAgo: 0,
    origin: "Nandi Hills, Karnataka",
    storage:
      "Wrap in paper towel in a loose bag in the fridge; snip with scissors straight into the pan.",
    storageLifeDays: 5,
    organicDetails:
      "Certified India Organic. Perennial clumps rested between cuts so blades stay thick, never spindly.",
    unitsSold: 850,
    createdHoursAgo: 29,
  }),

  simple({
    id: "prd-thai-basil-01",
    name: "Thai Basil (Horapha)",
    tagline: "Anise-sweet basil that survives the wok",
    description:
      "Purple-stemmed horapha with a liquorice-anise sweetness that holds up under high wok heat — essential for pad kra pao and pho. Harvested to order from our herb tunnels.",
    categoryId: "herbs",
    sellerId: "terra-verde",
    imgKey: "p-coriander",
    variants: [
      v("v1", "1 pack (~80 g)", "pack", 80, 50, 62, true, 45),
    ],
    rating: 4.5,
    reviewCount: 160,
    badges: ["organic", "new"],
    tags: ["thai basil", "horapha", "pad kra pao", "anise basil", "asian herbs", "herbs"],
    isOrganic: true,
    isNew: true,
    harvestDaysAgo: 0,
    origin: "Nandi Hills, Karnataka",
    storage:
      "Keep stems in water at room temperature; refrigeration blackens the purple stems.",
    storageLifeDays: 4,
    organicDetails:
      "Certified India Organic. Tunnel-grown with UV-selective nets that deepen leaf colour without lights.",
    unitsSold: 950,
    createdHoursAgo: 13,
  }),
];
