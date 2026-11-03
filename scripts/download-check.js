#!/usr/bin/env node
/* Downloads the first image of each non-product key + builds a contact sheet for review. */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const src = fs.readFileSync(path.join(__dirname, "..", "src", "data", "images.ts"), "utf8");
const re = /"([a-z0-9-]+)": \[([\s\S]*?)\]/g;
let m;
const map = {};
while ((m = re.exec(src))) {
  map[m[1]] = [...m[2].matchAll(/"(https:[^"]+)"/g)].map((x) => x[1]);
}

const keys = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["c-fruits", "c-vegetables", "c-leafy", "c-herbs", "c-exotic", "c-seasonal", "c-organic", "f-1", "f-2", "f-3", "f-4", "banner-deal", "farm-field", "hero-main", "p-blueberry", "p-banana"];

const dir = path.join(__dirname, "imgcheck");
fs.mkdirSync(dir, { recursive: true });

(async () => {
  for (const k of keys) {
    const url = (map[k] || [])[0];
    if (!url) continue;
    const ext = url.split(".").pop().split("?")[0] || "jpg";
    const file = path.join(dir, `${k}.${ext}`);
    try {
      execSync(`curl -sL --max-time 20 "${url}" -o "${file}"`);
      const size = fs.statSync(file).size;
      console.log(`${k} -> ${file} (${Math.round(size / 1024)} KB)`);
    } catch (e) {
      console.log(`${k} FAILED`);
    }
  }
})();
