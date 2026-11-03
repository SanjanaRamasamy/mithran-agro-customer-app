#!/usr/bin/env node
/**
 * Re-fetches keys whose results were watermarked/template junk.
 * Blocks known stock-template sources and merges into image-results.json.
 */
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "image-results.json");
const data = JSON.parse(fs.readFileSync(OUT, "utf8"));

const BAD_SOURCES = /shutterstock|pinterest|alamy|istock|gettyimages|dreamstime|123rf|freepik|vecteezy|adobestock|adobe\.com|depositphotos|stockphoto|bigstock|freeimages|watermark|span2|stock/i;
const GOOD_SOURCES = /unsplash|pexels|pixabay|flickr|wikimedia|blogspot|wordpress|organic|farm/i;

// key -> [better query, keep count]
const REFETCH = {
  "hero-main": ["crate of freshly harvested vegetables garden hands", 10],
  "p-blueberry": ["fresh blueberries bowl morning breakfast", 10],
  "f-1": ["farmer standing in green field smiling portrait", 10],
  "f-2": ["woman holding wooden box of fresh vegetables farm", 10],
  "f-3": ["farmer in greenhouse checking tomato plants", 10],
  "f-4": ["mature farmer harvesting carrots garden", 10],
  "farm-field": ["sunset over organic crop rows landscape", 10],
  "banner-deal": ["street vegetable market stall india", 10],
};

function runOne(q, count) {
  return new Promise((resolve) => {
    const attempt = (n) => {
      execFile("z-ai", ["image-search", "-q", q, "-c", String(count), "--gl", "us", "--no-rank"], { timeout: 180000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
        if (err && n < 4) return setTimeout(() => attempt(n + 1), 30000);
        let urls = [];
        let blocked = 0;
        try {
          const start = stdout.indexOf("{");
          if (start >= 0) {
            const j = JSON.parse(stdout.slice(start));
            if (j.success && Array.isArray(j.results)) {
              const clean = [];
              for (const r of j.results) {
                const src = String(r.source || "");
                if (BAD_SOURCES.test(src)) {
                  blocked++;
                  continue;
                }
                clean.push({ url: r.original_url, good: GOOD_SOURCES.test(src) });
              }
              // prefer trusted sources, keep order otherwise
              clean.sort((a, b) => Number(b.good) - Number(a.good));
              urls = clean.map((c) => c.url);
            }
          }
        } catch {}
        resolve({ urls: urls.slice(0, 3), blocked });
      });
    };
    attempt(0);
  });
}

async function main() {
  for (const [key, [q, count]] of Object.entries(REFETCH)) {
    const { urls, blocked } = await runOne(q, count);
    if (urls.length > 0) {
      data[key] = { urls };
      console.log(`OK  ${key} -> ${urls.length} urls (${blocked} blocked)`);
    } else {
      console.log(`KEEP ${key} (no clean results, ${blocked} blocked)`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  fs.writeFileSync(OUT, JSON.stringify(data, null, 2));
  console.log("image-results.json updated. Run node sync-images.js next.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
