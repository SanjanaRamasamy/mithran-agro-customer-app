#!/usr/bin/env node
/**
 * Batch image fetcher for Verdant Marketplace mock data.
 * Spawns `z-ai image-search` CLI calls with a worker pool, merges results
 * into scripts/image-results.json  { key: { urls: string[] } }
 */
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const TMP = path.join(__dirname, "imgtmp");
const OUT = path.join(__dirname, "image-results.json");
const GL = "us";

// key -> [query, count]
const QUERIES = {
  // ---- products (3 gallery images each) ----
  "p-apple": ["fresh red apples fruit on wooden table", 3],
  "p-banana": ["organic yellow bananas bunch", 3],
  "p-spinach": ["fresh green spinach leaves in basket", 3],
  "p-tomato": ["ripe red tomatoes vegetables close up", 3],
  "p-carrot": ["fresh orange carrots bunch with green tops", 3],
  "p-broccoli": ["fresh green broccoli head vegetable", 3],
  "p-avocado": ["ripe avocados halves on table", 3],
  "p-strawberry": ["fresh red strawberries in bowl", 3],
  "p-mango": ["ripe yellow mangoes tropical fruit", 3],
  "p-orange": ["fresh oranges citrus fruit with leaves", 3],
  "p-grapes": ["fresh green grapes bunch on vine", 3],
  "p-bellpepper": ["colorful bell peppers red yellow green", 3],
  "p-cucumber": ["fresh green cucumbers vegetables", 3],
  "p-potato": ["fresh potatoes brown harvest", 3],
  "p-onion": ["red onions bulbs fresh harvest", 3],
  "p-garlic": ["garlic bulbs white fresh", 3],
  "p-lettuce": ["fresh green lettuce head close up", 3],
  "p-kale": ["fresh curly kale leaves dark green", 3],
  "p-blueberry": ["fresh blueberries in bowl close up", 3],
  "p-watermelon": ["whole and sliced watermelon fresh", 3],
  "p-pineapple": ["fresh whole pineapple tropical", 3],
  "p-papaya": ["ripe papaya cut in half with seeds", 3],
  "p-pomegranate": ["fresh pomegranates red whole and split", 3],
  "p-mushroom": ["fresh white button mushrooms", 3],
  "p-coriander": ["fresh coriander cilantro herbs bundle", 3],
  "p-ginger": ["fresh ginger root on table", 3],
  "p-lemon": ["fresh lemons citrus yellow", 3],
  "p-greenpeas": ["fresh green peas in pods", 3],
  "p-cauliflower": ["fresh white cauliflower head", 3],
  "p-beetroot": ["fresh beetroots red with leaves", 3],
  // ---- categories ----
  "c-fruits": ["assorted fresh fruits assortment colorful", 1],
  "c-vegetables": ["assorted fresh vegetables variety", 1],
  "c-leafy": ["leafy greens lettuce spinach kale", 1],
  "c-herbs": ["fresh culinary herbs basil mint", 1],
  "c-exotic": ["exotic tropical fruits dragon fruit", 1],
  "c-seasonal": ["seasonal produce autumn vegetables squash", 1],
  "c-organic": ["organic vegetables certification green field", 1],
  // ---- hero / banners ----
  "hero-main": ["organic vegetables and fruits in wicker basket on farm", 2],
  "banner-deal": ["farmers market fresh produce stall morning", 2],
  "farm-field": ["green organic farm field rows of crops sunrise", 1],
  // ---- farmers ----
  "f-1": ["smiling indian farmer in field portrait", 1],
  "f-2": ["female farmer holding vegetable basket smiling", 1],
  "f-3": ["young farmer greenhouse portrait", 1],
  "f-4": ["elderly farmer harvesting vegetables portrait", 1],
};

function runOne(key, q, count) {
  return new Promise((resolve) => {
    const args = ["image-search", "-q", q, "-c", String(count), "--gl", GL, "--no-rank"];
    const attempt = (n) => {
      execFile("z-ai", args, { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        const msg = String((err && err.message) || stderr || "");
        const is429 = msg.includes("429") || msg.includes("Too many requests");
        if (err && n < 8) {
          const wait = is429 ? 90000 + Math.random() * 30000 : 6000 + n * 4000;
          console.log(`[${new Date().toISOString().slice(11, 19)}] ${key} retry ${n + 1} (${is429 ? "rate-limited" : "error"}), waiting ${Math.round(wait / 1000)}s`);
          return setTimeout(() => attempt(n + 1), wait);
        }
        if (err) console.log(`[${key}] FINAL-ERR: ${msg.slice(0, 200)}`);
        /* parse JSON from stdout (CLI prints logs first) */
        let urls = [];
        try {
          const start = stdout.indexOf("{");
          if (start >= 0) {
            const j = JSON.parse(stdout.slice(start));
            if (j.success && Array.isArray(j.results)) urls = j.results.map((r) => r.original_url).filter(Boolean);
          }
        } catch {}
        if (urls.length === 0 && n < 8) {
          console.log(`[${new Date().toISOString().slice(11, 19)}] ${key} empty result, retrying in 30s`);
          return setTimeout(() => attempt(n + 1), 30000);
        }
        resolve({ key, urls });
      });
    };
    attempt(0);
  });
}

async function main() {
  const entries = Object.entries(QUERIES);
  const results = {};
  const merged = {};
  let idx = 0;
  const WORKERS = 1; // z-ai image-search is single-instance — must run serially
  async function worker(wid) {
    await new Promise((r) => setTimeout(r, wid * 2500));
    while (idx < entries.length) {
      const [key, [q, count]] = entries[idx++];
      const r = await runOne(key, q, count);
      merged[key] = { urls: r.urls };
      results[key] = r.urls.length > 0;
      console.log(`[${new Date().toISOString().slice(11, 19)}] ${r.urls.length > 0 ? "OK " : "FAIL"} ${key} (${r.urls.length} imgs)`);
      await new Promise((res) => setTimeout(res, r.urls.length ? 3000 : 1000));
    }
  }
  await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i)));

  fs.writeFileSync(OUT, JSON.stringify(merged, null, 2));
  const failed = Object.keys(QUERIES).filter((k) => !merged[k] || !merged[k].urls.length);
  console.log(`\nDone. ${Object.keys(QUERIES).length - failed.length}/${Object.keys(QUERIES).length} keys have images.`);
  if (failed.length) console.log("Failed keys:", failed.join(", "));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
