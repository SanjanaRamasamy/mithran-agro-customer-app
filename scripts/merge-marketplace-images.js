#!/usr/bin/env node
/**
 * Merge scripts/image-results-marketplace.json into src/data/images.ts.
 * Preserves existing keys; only adds new keys with valid URLs.
 * Idempotent: running twice changes nothing the second time.
 */
const fs = require("fs");
const path = require("path");

const RESULTS = path.join(__dirname, "image-results-marketplace.json");
const IMAGES = path.join(__dirname, "..", "src", "data", "images.ts");

const store = JSON.parse(fs.readFileSync(RESULTS, "utf8"));
const BAD_HOSTS = ["shutterstock", "depositphotos", "alamy", "dreamstime", "istockphoto", "gettyimages", "123rf", "vecteezy", "freepik"];
const clean = (urls) =>
  (urls || []).filter(
    (u) => /^https?:\/\//.test(u) && !BAD_HOSTS.some((h) => u.toLowerCase().includes(h))
  );

let src = fs.readFileSync(IMAGES, "utf8");
const added = [];
let missing = 0;

for (const [key, { urls }] of Object.entries(store)) {
  if (src.includes(`"${key}"`)) continue; // already present
  const good = clean(urls).slice(0, 3);
  if (good.length === 0) {
    missing += 1;
    continue;
  }
  const block = `  "${key}": [\n${good
    .map((u) => `    "${u}",`)
    .join("\n")}\n  ],\n`;
  // insert before the closing "};"
  const idx = src.indexOf("};", src.indexOf("export const IMG"));
  src = src.slice(0, idx) + block + src.slice(idx);
  added.push(key);
}

fs.writeFileSync(IMAGES, src);
console.log(`Added ${added.length} keys (${missing} skipped without usable urls).`);
if (added.length) console.log(added.join(", "));
