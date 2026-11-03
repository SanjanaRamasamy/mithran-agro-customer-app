"""Fix v2: re-patch subtitle zone with clean plank wood, redraw green 'AGRO PVT. LTD.'."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageStat

SRC = "/home/z/my-project/public/images/hero-crate.png"
im = Image.open(SRC).convert("RGB")

# ------------------------------------------------------------------
# 1. Sample MITHREN text green from the big letters (x 340..1030, y 470..560)
# ------------------------------------------------------------------
zone = im.crop((345, 480, 1020, 555))
px = zone.load()
greens = [
    p[:3]
    for y in range(0, zone.height, 2)
    for x in range(0, zone.width, 2)
    if (p := px[x, y]) and sum(p[:3]) < 320 and p[1] >= p[0] and p[1] > p[2]
]
greens.sort(key=lambda c: sum(c))
core = greens[len(greens) // 20 : len(greens) // 20 + 60] or greens[:60]
text_color = tuple(sum(c[i] for c in core) // len(core) for i in range(3))
print("sampled green:", text_color)

# ------------------------------------------------------------------
# 2. Patch whole subtitle zone with clean wood from x 230..408
# ------------------------------------------------------------------
BOX = (408, 580, 992, 654)
pw, ph = BOX[2] - BOX[0], BOX[3] - BOX[1]
src = im.crop((228, BOX[1], 228 + 180, BOX[3])).filter(ImageFilter.GaussianBlur(0.3))

patch = Image.new("RGB", (pw, ph))
x, flip = 0, False
while x < pw:
    tile = src.transpose(Image.FLIP_LEFT_RIGHT) if flip else src
    patch.paste(tile, (x, 0))
    x += tile.width
    flip = not flip

mask = Image.new("L", (pw, ph), 255)
md = ImageDraw.Draw(mask)
f = 10
for i in range(f):
    a = int(255 * i / f)
    md.line([(i, 0), (i, ph)], fill=a)
    md.line([(pw - 1 - i, 0), (pw - 1 - i, ph)], fill=a)
    md.line([(0, i), (pw, i)], fill=a)
    md.line([(0, ph - 1 - i), (pw, ph - 1 - i)], fill=a)
im.paste(patch, BOX[:2], mask)

# ------------------------------------------------------------------
# 3. Draw corrected subtitle, letterspaced
# ------------------------------------------------------------------
FONT = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", 54)
TXT, TRACK = "AGRO PVT. LTD.", 4

def draw_tracked(draw, center, text, font, fill, track):
    widths = [draw.textlength(ch, font=font) for ch in text]
    total = sum(widths) + track * (len(text) - 1)
    x = center[0] - total / 2
    for ch, w in zip(text, widths):
        draw.text((x, center[1]), ch, font=font, fill=fill, anchor="lm")
        x += w + track

draw_tracked(ImageDraw.Draw(im), (700, 614), TXT, FONT, text_color, TRACK)

im.save(SRC, quality=95)
print("saved")
