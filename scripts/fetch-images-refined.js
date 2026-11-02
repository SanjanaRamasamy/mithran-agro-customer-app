#!/usr/bin/env node
/** Refined image fetch for the curated Mithren Agro catalogue. */
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "image-results-marketplace.json");
const GL = "us";

const QUERIES = {
  "p-grapes": ["fresh green grapes fruit closeup studio", 3],
  "p-orange": ["nagpur oranges fresh fruit pile", 3],
  "p-compost": ["dark organic compost soil close up", 3],
  "p-milletflour": ["ragi finger millet flour bag", 3],
  "f-4": ["farmer holding vegetable basket smiling", 3],
  "p-guava": ["fresh guavas fruit white background", 3],
  "p-mosambi": ["sweet lime mosambi citrus fruit", 3],
  "p-jamun": ["jamun java plum black purple fruit", 3],
  "p-okra": ["fresh okra lady finger green vegetable", 3],
  "p-brinjal": ["fresh purple brinjal eggplant vegetable", 3],
  "p-chilli": ["fresh green chillies vegetables", 3],
  "p-beans": ["fresh green beans french beans vegetable", 3],
  "p-cabbage": ["fresh green cabbage head vegetable", 3],
  "p-onion": ["red onions pile fresh market", 3],
  "p-orange": ["oranges citrus fruit whole juicy", 3],
  "p-compost": ["organic compost fertilizer bag packaging", 3],
  "p-neemcake": ["neem cake organic fertilizer powder", 3],
  "p-booster": ["liquid seaweed plant fertilizer bottle garden", 3],
  "p-atta": ["whole wheat flour atta package with wheat", 3],
  "p-turmeric": ["turmeric powder bowl with turmeric roots", 3],
  "p-chillipowder": ["red chilli powder bowl indian spice", 3],
  "p-corianderpowder": ["coriander powder dhania powder bowl spice", 3],
  "p-milletflour": ["millet grains and flour bowl", 3],
  "p-saree-silk2": ["mysore silk saree woman traditional", 3],
  "p-saree-cotton2": ["kanchipuram cotton saree handloom", 3],
  "p-kurti2": ["printed rayon kurti indian woman", 3],
  "p-women-top2": ["women flared peplum top fashion", 3],
  "p-dress2": ["floral maxi dress woman summer fashion", 3],
};

function runOne(key, q, count) {
  return new Promise((resolve) => {
    const args = ["image-search", "-q", q, "-c", String(count), "--gl", GL, "--no-rank"];
    const attempt = (n) => {
      execFile("z-ai", args, { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
        const msg = String((err && err.message) || stderr || "");
        const is429 = msg.includes("429") || msg.includes("Too many requests");
        if (err && n < 5) {
          const wait = is429 ? 60000 + Math.random() * 20000 : 6000 + n * 4000;
          console.log(`retry ${key} (${is429 ? "rate-limited" : "error"})`);
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
        if (urls.length === 0 && n < 4) return setTimeout(() => attempt(n + 1), 20000);
        if (err) console.log(`[${key}] FINAL-ERR: ${msg.slice(0, 120)}`);
        resolve({ key, urls });
      });
    };
    attempt(0);
  });
}

async function main() {
  let store = {};
  try { store = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch {}
  const entries = Object.entries(QUERIES).filter(([k]) => !(store[k] && store[k].urls && store[k].urls.length));
  console.log(`Fetching ${entries.length} keys...`);
  for (const [key, [q, count]] of entries) {
    const r = await runOne(key, q, count);
    store[key] = { urls: r.urls };
    fs.writeFileSync(OUT, JSON.stringify(store, null, 2));
    console.log(`${r.urls.length > 0 ? "OK " : "FAIL"} ${key} (${r.urls.length})`);
    await new Promise((res) => setTimeout(res, 1500));
  }
  console.log("Done.");
}
main().catch((e) => { console.error(e); process.exit(1); });
