#!/usr/bin/env python3
"""Process the uploaded Mithren Agro logo:
1. Trim surrounding white margins
2. Flood-fill white background (from edges) to transparency -> public/logo.png
3. Square sprout mark crop -> public/logo-mark.png
4. Favicon 64x64 from the mark -> src/app/icon.png
"""
from PIL import Image, ImageFilter
from collections import deque

SRC = "/home/z/my-project/upload/WhatsApp Image 2026-10-21 at 10.42.34 AM.jpeg"

im = Image.open(SRC).convert("RGB")
w, h = im.size
print("source:", im.size)

# ---- 1. trim near-white margins ----------------------------------------
px = im.load()

def is_white(p, tol=18):
    return p[0] >= 255 - tol and p[1] >= 255 - tol and p[2] >= 255 - tol

top, bottom, left, right = h, 0, w, 0
for y in range(h):
    for x in range(w):
        if not is_white(px[x, y]):
            top = min(top, y); bottom = max(bottom, y)
            left = min(left, x); right = max(right, x)
pad = 12
left = max(0, left - pad); top = max(0, top - pad)
right = min(w - 1, right + pad); bottom = min(h - 1, bottom + pad)
im = im.crop((left, top, right + 1, bottom + 1))
w, h = im.size
print("trimmed:", im.size)

# ---- 2. flood fill background -> transparent ----------------------------
rgba = im.convert("RGBA")
pix = rgba.load()
seen = [[False] * w for _ in range(h)]
q = deque()
for x in range(w):
    q.append((x, 0)); q.append((x, h - 1))
for y in range(h):
    q.append((0, y)); q.append((w - 1, y))

def bg_like(p):
    # background is near-white (tolerant; jpeg noise)
    return p[0] > 238 and p[1] > 238 and p[2] > 238

while q:
    x, y = q.popleft()
    if x < 0 or y < 0 or x >= w or y >= h or seen[y][x]:
        continue
    seen[y][x] = True
    p = pix[x, y]
    if not bg_like(p):
        continue
    pix[x, y] = (255, 255, 255, 0)
    q.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

# soften edges: pixels adjacent to transparency get partial alpha
alpha = rgba.split()[3].filter(ImageFilter.MinFilter(3))
soft = rgba.copy()
soft.putalpha(alpha)
rgba = soft

rgba.save("/home/z/my-project/public/logo.png")
print("logo.png:", rgba.size)

# ---- 3. square sprout mark ----------------------------------------------
# The sprout sits top-centre above the lettering. Locate green-est region.
gx0, gy0, gx1, gy1 = w, h, 0, 0
for y in range(0, int(h * 0.62)):
    for x in range(w):
        r, g, b, a = pix[x, y]
        if a > 40 and g > 110 and g > r + 28 and g > b + 28:
            gx0 = min(gx0, x); gy0 = min(gy0, y)
            gx1 = max(gx1, x); gy1 = max(gy1, y)
print("green sprout bbox:", (gx0, gy0, gx1, gy1))
if gx1 > gx0:
    cx = (gx0 + gx1) // 2
    side = max(gx1 - gx0, gy1 - gy0) + int(min(w, h) * 0.06)
    half = side // 2
    # square box centered on sprout, clamped
    bx0 = max(0, cx - half); by0 = max(0, gy0 - int(h * 0.02))
    bx1 = min(w, bx0 + side); by1 = min(h, by0 + side)
    mark = rgba.crop((bx0, by0, bx1, by1))
else:
    mark = rgba
# paste onto transparent square canvas
mw, mh = mark.size
side = max(mw, mh)
canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
canvas.paste(mark, ((side - mw) // 2, (side - mh) // 2), mark)
canvas.save("/home/z/my-project/public/logo-mark.png")
print("logo-mark.png:", canvas.size)

# ---- 4. favicon ----------------------------------------------------------
fav = canvas.resize((64, 64), Image.LANCZOS).convert("RGBA")
fav.save("/home/z/my-project/src/app/icon.png")
print("icon.png written")
