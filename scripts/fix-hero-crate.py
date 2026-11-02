"""Patch hero crate image: correct 'PYi.' -> 'PVT.' and lighten bg toward cream-green."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

SRC = "/home/z/my-project/public/images/hero-crate.png"
OUT = "/home/z/my-project/public/images/hero-crate.png"

im = Image.open(SRC).convert("RGB")
W, H = im.size  # 1344 x 768

# ------------------------------------------------------------------
# 1. Sample the existing text colour (darkest pixel in subtitle zone)
# ------------------------------------------------------------------
zone = im.crop((435, 588, 950, 638))
px = zone.load()
darkest = min(
    ((px[x, y], (x, y)) for x in range(zone.width) for y in range(zone.height)),
    key=lambda t: sum(t[0][:3]),
)
text_color = darkest[0][:3]
# darken a touch for print-like solidity
text_color = tuple(max(0, int(c * 0.92)) for c in text_color)

# ------------------------------------------------------------------
# 2. Cover old subtitle with clean wood texture (mirror-tiled patch)
# ------------------------------------------------------------------
PATCH_BOX = (415, 578, 970, 652)  # x0, y0, x1, y1  (covers subtitle w/ margin)
pw = PATCH_BOX[2] - PATCH_BOX[0]
ph = PATCH_BOX[3] - PATCH_BOX[1]

# clean wood strip left of the subtitle, same plank band
left_src = im.crop((60, PATCH_BOX[1], 60 + 355, PATCH_BOX[3])).filter(
    ImageFilter.GaussianBlur(0.4)
)

patch = Image.new("RGB", (pw, ph))
x = 0
flip = False
while x < pw:
    tile = left_src.transpose(Image.FLIP_LEFT_RIGHT) if flip else left_src
    patch.paste(tile, (x, 0))
    x += tile.width
    flip = not flip

# feathered alpha mask so patch edges melt into the plank
mask = Image.new("L", (pw, ph), 255)
md = ImageDraw.Draw(mask)
feather = 14
for i in range(feather):
    a = int(255 * i / feather)
    md.line([(i, 0), (i, ph)], fill=a)                 # left edge
    md.line([(pw - 1 - i, 0), (pw - 1 - i, ph)], fill=a)  # right edge
    md.line([(0, i), (pw, i)], fill=a)                 # top edge
    md.line([(0, ph - 1 - i), (pw, ph - 1 - i)], fill=a)  # bottom edge

im.paste(patch, PATCH_BOX[:2], mask)

# ------------------------------------------------------------------
# 3. Draw corrected subtitle "AGRO PVT. LTD."
# ------------------------------------------------------------------
FONT = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", 54)
TXT = "AGRO PVT. LTD."
TRACK = 4  # letter spacing px

def draw_tracked(draw, xy_center, text, font, fill, track):
    widths = [draw.textlength(ch, font=font) for ch in text]
    total = sum(widths) + track * (len(text) - 1)
    x = xy_center[0] - total / 2
    for ch, w in zip(text, widths):
        draw.text((x, xy_center[1]), ch, font=font, fill=fill, anchor="lm")
        x += w + track

draw_tracked(ImageDraw.Draw(im), (692, 614), TXT, FONT, text_color, TRACK)

# ------------------------------------------------------------------
# 4. Lighten whole image slightly toward cream-green, boost a bit
# ------------------------------------------------------------------
tint = Image.new("RGB", im.size, (246, 247, 238))
im = Image.blend(im, tint, 0.16)
im = ImageEnhance.Color(im).enhance(1.06)
im = ImageEnhance.Contrast(im).enhance(1.02)

im.save(OUT, quality=95)
print("saved", OUT, "text colour:", text_color)
