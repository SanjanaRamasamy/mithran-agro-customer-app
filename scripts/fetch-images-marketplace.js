#!/usr/bin/env node
/**
 * Marketplace expansion image fetcher for Mithran Agro.
 * Merges results into scripts/image-results-marketplace.json
 * Idempotent: skips keys already present with urls in the output file.
 */
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "image-results-marketplace.json");
const GL = "us";

// key -> [query, count]
const QUERIES = {
  // ---- organic grocery ----
  "p-rice": ["organic rice grains in jute sack", 3],
  "p-millets": ["millets grains bowl foxtail ragi", 3],
  "p-pulses": ["lentils pulses dal varieties in bowls", 3],
  "p-spices": ["indian spices turmeric chili powder bowls", 3],
  "p-dryfruits": ["dried fruits dates raisins apricots bowl", 3],
  "p-nuts": ["mixed nuts almonds cashews walnuts bowl", 3],
  "p-oil": ["cold pressed coconut oil glass bottle", 3],
  "p-honey": ["raw organic honey glass jar with dipper", 3],
  "p-dairy": ["fresh milk glass bottle farm dairy", 3],
  "p-eggs": ["brown organic eggs in tray", 3],
  "p-tea": ["organic green tea leaves and cup", 3],
  "p-pickle": ["indian pickle jar achar homemade", 3],
  "p-homemade": ["homemade snacks papad jar traditional", 3],
  "p-jaggery": ["jaggery blocks organic brown sugar", 3],
  "p-ghee": ["ghee jar clarified butter indian", 3],
  // ---- agriculture inputs ----
  "p-fertilizer": ["organic fertilizer bag granules", 3],
  "p-vermicompost": ["vermicompost worm castings soil in hands", 3],
  "p-cocopeat": ["coco peat coir brick block", 3],
  "p-potmix": ["potting soil mix bag garden", 3],
  "p-neem": ["neem oil bottle with neem leaves", 3],
  "p-panchagavya": ["panchagavya organic liquid manure bottle", 3],
  "p-biopest": ["neem oil pesticide spray bottle garden", 3],
  "p-manure": ["farmyard manure compost pile organic", 3],
  // ---- seeds ----
  "p-seeds": ["vegetable seeds packets collection", 3],
  "p-seedpacket": ["seed packet packet with seeds in hand", 3],
  "p-flowerseeds": ["flower seeds marigold zinnia packets", 3],
  // ---- plants ----
  "p-plant-indoor": ["indoor potted monstera plant in pot", 3],
  "p-plant-sapling": ["young fruit tree sapling in nursery bag", 3],
  "p-plant-flower": ["flowering hibiscus plant in pot", 3],
  "p-plant-medicinal": ["tulsi holy basil medicinal plant pot", 3],
  "p-plant-succulent": ["succulent plants collection small pots", 3],
  // ---- gardening ----
  "p-tools": ["garden tools set trowel pruner gloves", 3],
  "p-growbag": ["fabric grow bags with plants vegetables", 3],
  "p-pots": ["terracotta ceramic plant pots collection", 3],
  "p-sprayer": ["garden pressure sprayer bottle", 3],
  "p-watercan": ["metal watering can garden", 3],
  "p-decor": ["garden decor accessories pebbles lantern", 3],
  // ---- farm supplies ----
  "p-drip": ["drip irrigation system pipes field", 3],
  "p-sprinkler": ["garden sprinkler water spray", 3],
  "p-tractor": ["small farm tractor equipment field", 3],
  "p-shadenet": ["shade net greenhouse structure", 3],
  "p-mulch": ["mulching film sheet vegetable field", 3],
  "p-nursery": ["nursery seedling trays pro trays", 3],
  // ---- women's fashion ----
  "p-saree": ["indian woman wearing elegant saree traditional", 3],
  "p-saree-silk": ["kanjivaram silk saree rich woven", 3],
  "p-kurti": ["indian kurti women cotton straight", 3],
  "p-salwar": ["salwar kameez women indian suit", 3],
  "p-leggings": ["cotton leggings women folded", 3],
  "p-dupatta": ["dupatta chiffon embroidered stole", 3],
  "p-women-top": ["women cotton top blouse casual", 3],
  "p-dress": ["women summer dress midi elegant", 3],
  "p-nightwear": ["women nightwear pyjama set cotton", 3],
  "p-women-jacket": ["women denim jacket stylish", 3],
  "p-shawl": ["woolen shawl wrapped elegant woven", 3],
  // ---- men's fashion ----
  "p-men-shirt": ["men cotton formal shirt folded", 3],
  "p-men-tshirt": ["men plain t-shirt cotton display", 3],
  "p-kurta-men": ["men kurta indian traditional wear", 3],
  "p-men-pants": ["men chino trousers folded", 3],
  "p-jeans": ["men blue jeans denim folded", 3],
  "p-men-jacket": ["men casual jacket bomber", 3],
  // ---- kids ----
  "p-kids-boys": ["kids boys clothing set colorful", 3],
  "p-kids-girls": ["kids girl frock dress cute", 3],
  "p-infant": ["baby infant clothes romper soft", 3],
  // ---- department banners ----
  "cat-grocery": ["indian grocery staples grains spices flatlay", 2],
  "cat-fertilizer": ["hands holding organic compost soil fertilizer", 2],
  "cat-seeds": ["seeds in hands planting sowing", 2],
  "cat-plants": ["nursery plants rows greenhouse pots", 2],
  "cat-garden": ["gardening tools and plants flatlay", 2],
  "cat-farm": ["farm equipment field agriculture machinery", 2],
  "cat-fashion": ["indian ethnic fashion saree textile display", 2],
  "cat-kids": ["happy kids colorful clothing", 2],
};

function runOne(key, q, count) {
  return new Promise((resolve) => {
    const args = ["image-search", "-q", q, "-c", String(count), "--gl", GL, "--no-rank"];
    const attempt = (n) => {
      execFile("z-ai", args, { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        const msg = String((err && err.message) || stderr || "");
        const is429 = msg.includes("429") || msg.includes("Too many requests");
        if (err && n < 6) {
          const wait = is429 ? 70000 + Math.random() * 20000 : 6000 + n * 4000;
          console.log(`[${new Date().toISOString().slice(11, 19)}] ${key} retry ${n + 1} (${is429 ? "rate-limited" : "error"})`);
          return setTimeout(() => attempt(n + 1), wait);
        }
        let urls = [];
        try {
          const start = stdout.indexOf("{");
          if (start >= 0) {
            const j = JSON.parse(stdout.slice(start));
            if (j.success && Array.isArray(j.results)) urls = j.results.map((r) => r.original_url).filter(Boolean);
          }
        } catch {}
        if (urls.length === 0 && n < 5) {
          return setTimeout(() => attempt(n + 1), 25000);
        }
        if (err) console.log(`[${key}] FINAL-ERR: ${msg.slice(0, 160)}`);
        resolve({ key, urls });
      });
    };
    attempt(0);
  });
}

async function main() {
  const LIMIT = parseInt(process.env.LIMIT || "0", 10); // 0 = no limit
  let store = {};
  try { store = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch {}
  const entries = Object.entries(QUERIES).filter(([k]) => !(store[k] && store[k].urls && store[k].urls.length));
  const todo = LIMIT > 0 ? entries.slice(0, LIMIT) : entries;
  console.log(`Fetching ${todo.length}/${Object.keys(QUERIES).length} keys (serial)...`);
  for (const [key, [q, count]] of todo) {
    const r = await runOne(key, q, count);
    store[key] = { urls: r.urls };
    fs.writeFileSync(OUT, JSON.stringify(store, null, 2));
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${r.urls.length > 0 ? "OK " : "FAIL"} ${key} (${r.urls.length})`);
    await new Promise((res) => setTimeout(res, r.urls.length ? 2000 : 4000));
  }
  const failed = Object.keys(QUERIES).filter((k) => !store[k] || !store[k].urls.length);
  console.log(`\nDone. ${Object.keys(QUERIES).length - failed.length}/${Object.keys(QUERIES).length} keys have images.`);
  if (failed.length) console.log("Failed keys:", failed.join(", "));
}

main().catch((e) => { console.error(e); process.exit(1); });
