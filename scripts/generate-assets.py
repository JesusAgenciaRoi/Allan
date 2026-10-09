"""
Genera los recursos gráficos locales de la demo (reproducible):

  python -I scripts/generate-assets.py

- public/brand/af-logo-*.{webp,png}: logo oficial de AF Team extraído del Excel
  `Kevin y Rasta plani.xlsx` (hoja MESOCICLO), optimizado.
- public/media/hero-athlete.{webp,jpg}: recorte de la imagen de referencia suministrada por el
  cliente (solo la mitad derecha, sin el titular). Confirmar derechos antes de producción.
- public/media/grunge.png: textura para el titular "AF TEAM" (generada, sin derechos de terceros).
- public/media/exercises/*.gif: GIF animados de demostración GENERADOS (figura esquemática),
  en formato vertical y horizontal para probar el editor de encuadre.
"""
import io
import math
import random
import sys
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
GOLD = (201, 162, 83)
BONE = (222, 222, 222)
BG = (14, 14, 14)


def build_logo():
    xlsx = ROOT / "Kevin y Rasta plani.xlsx"
    with zipfile.ZipFile(xlsx) as z:
        data = z.read("xl/media/image2.png")
    logo = Image.open(io.BytesIO(data)).convert("RGBA")
    out = PUBLIC / "brand"
    out.mkdir(parents=True, exist_ok=True)
    for size in (512, 192):
        img = logo.resize((size, size), Image.LANCZOS)
        img.save(out / f"af-logo-{size}.webp", "WEBP", quality=88)
        img.save(out / f"af-logo-{size}.png", "PNG", optimize=True)
    logo.resize((64, 64), Image.LANCZOS).save(out / "favicon.png", "PNG", optimize=True)


def build_hero():
    ref = ROOT / "reference" / "referencia-hero.jpeg"
    img = Image.open(ref).convert("RGB")
    w, h = img.size  # 1536x1024
    crop = img.crop((int(w * 0.49), 125, w, h))
    out = PUBLIC / "media"
    out.mkdir(parents=True, exist_ok=True)
    crop.save(out / "hero-athlete.webp", "WEBP", quality=80, method=6)
    crop.save(out / "hero-athlete.jpg", "JPEG", quality=78, optimize=True, progressive=True)
    small = crop.resize((crop.width // 2, crop.height // 2), Image.LANCZOS)
    small.save(out / "hero-athlete-sm.webp", "WEBP", quality=78, method=6)
    print("hero", crop.size)


def build_grunge():
    random.seed(7)
    size = 512
    img = Image.new("RGBA", (size, size), (236, 236, 236, 255))
    d = ImageDraw.Draw(img)
    for _ in range(2600):
        x, y = random.randrange(size), random.randrange(size)
        r = random.choice([1, 1, 1, 2, 2, 3])
        shade = random.randint(20, 90)
        d.ellipse((x, y, x + r, y + r), fill=(shade, shade, shade, 255))
    for _ in range(140):
        x, y = random.randrange(size), random.randrange(size)
        pts = [(x, y)]
        for _ in range(random.randint(2, 5)):
            x += random.randint(-14, 14)
            y += random.randint(-14, 14)
            pts.append((x, y))
        shade = random.randint(40, 110)
        d.line(pts, fill=(shade, shade, shade, 255), width=1)
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    img.convert("RGB").save(PUBLIC / "media" / "grunge.png", "PNG", optimize=True)


# ---------- GIF de ejercicios (figura esquemática) ----------

def lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def ease(i, n):
    return (1 - math.cos(2 * math.pi * i / n)) / 2


def draw_figure(d, p, s, ox=0, oy=0, scale=1.0):
    def P(k):
        x, y = p[k]
        return (ox + x * scale, oy + y * scale)

    lw = max(4, int(5 * scale))
    for a, b in s:
        d.line([P(a), P(b)], fill=BONE, width=lw, joint="curve")
    for k in p:
        if k in ("bar", "db1", "db2", "head"):
            continue
        x, y = P(k)
        r = lw / 2
        d.ellipse((x - r, y - r, x + r, y + r), fill=BONE)
    hx, hy = P("head")
    hr = 7 * scale
    d.ellipse((hx - hr, hy - hr, hx + hr, hy + hr), fill=BONE)


def draw_bar(d, c, scale, horizontal=True, plates=True):
    x, y = c
    if horizontal:
        d.line([(x - 26 * scale, y), (x + 26 * scale, y)], fill=GOLD, width=max(3, int(3 * scale)))
    if plates:
        pw, ph = 5 * scale, 18 * scale
        d.rounded_rectangle((x - pw, y - ph, x + pw, y + ph), radius=2 * scale, fill=GOLD)


def draw_db(d, c, scale):
    x, y = c
    d.rounded_rectangle((x - 7 * scale, y - 3 * scale, x + 7 * scale, y + 3 * scale), radius=2, fill=GOLD)


def render(name, canvas, poses, segments, extras, frames=16, floor=True):
    W, H = canvas
    base_w = 100 if W <= H else 160
    scale = W / base_w
    imgs = []
    for i in range(frames):
        t = ease(i, frames)
        p = {k: lerp(poses[0][k], poses[1][k], t) for k in poses[0]}
        img = Image.new("RGB", (W, H), BG)
        d = ImageDraw.Draw(img)
        # suelo y viñeta sutil
        if floor:
            fy = int(H * 0.93)
            d.line([(0, fy), (W, fy)], fill=(48, 48, 48), width=2)
        for kind, key in extras:
            if kind == "bench":
                x0, y0, x1, y1 = key
                d.rounded_rectangle((x0 * scale, y0 * scale, x1 * scale, y1 * scale), radius=3, fill=(60, 60, 60))
        draw_figure(d, p, segments, scale=scale)
        for kind, key in extras:
            if kind == "bar":
                draw_bar(d, (p[key][0] * scale, p[key][1] * scale), scale)
            elif kind == "plate":
                draw_bar(d, (p[key][0] * scale, p[key][1] * scale), scale, horizontal=False)
            elif kind == "db":
                draw_db(d, (p[key][0] * scale, p[key][1] * scale), scale)
        d.text((8, 6), "AF TEAM · DEMO", fill=(150, 125, 70))
        imgs.append(img.convert("P", palette=Image.ADAPTIVE, colors=32))
    out = PUBLIC / "media" / "exercises" / f"{name}.gif"
    imgs[0].save(out, save_all=True, append_images=imgs[1:], duration=85, loop=0, optimize=True, disposal=2)
    print(name, out.stat().st_size // 1024, "KB")


SIDE = [("head", "neck"), ("neck", "hip"), ("hip", "knee"), ("knee", "ankle"), ("ankle", "toe"),
        ("neck", "elbow"), ("elbow", "hand")]


def build_gifs():
    (PUBLIC / "media" / "exercises").mkdir(parents=True, exist_ok=True)
    # Sentadilla — vertical 3:4, vista lateral
    squat_top = dict(head=(50, 21), neck=(50, 30), hip=(50, 70), knee=(52, 95), ankle=(50, 120), toe=(59, 121),
                     elbow=(41, 37), hand=(47, 30), bar=(47, 30))
    squat_bot = dict(head=(62, 46), neck=(57, 54), hip=(33, 92), knee=(64, 97), ankle=(50, 120), toe=(59, 121),
                     elbow=(48, 61), hand=(54, 54), bar=(54, 54))
    render("sentadilla-vertical", (360, 480), [squat_top, squat_bot], SIDE, [("plate", "bar")])

    # Peso muerto — vertical 3:4
    dl_bot = dict(head=(67, 52), neck=(61, 59), hip=(40, 78), knee=(60, 98), ankle=(52, 120), toe=(61, 121),
                  elbow=(61, 79), hand=(60, 99), bar=(60, 101))
    dl_top = dict(head=(52, 21), neck=(51, 30), hip=(50, 70), knee=(52, 95), ankle=(52, 120), toe=(61, 121),
                  elbow=(51, 50), hand=(52, 70), bar=(52, 72))
    render("peso-muerto-vertical", (360, 480), [dl_bot, dl_top], SIDE, [("plate", "bar")])

    # Press banca — horizontal 16:10
    bench = [("head", "neck"), ("neck", "hip"), ("hip", "knee"), ("knee", "ankle"), ("ankle", "toe"),
             ("neck", "elbow"), ("elbow", "hand")]
    bp_top = dict(head=(42, 58), neck=(50, 59), hip=(95, 61), knee=(118, 52), ankle=(124, 82), toe=(131, 84),
                  elbow=(52, 42), hand=(52, 25), bar=(52, 25))
    bp_bot = dict(head=(42, 58), neck=(50, 59), hip=(95, 61), knee=(118, 52), ankle=(124, 82), toe=(131, 84),
                  elbow=(40, 56), hand=(54, 48), bar=(54, 48))
    render("press-banca-horizontal", (480, 300), [bp_top, bp_bot], bench, [("bench", (34, 65, 104, 71)), ("plate", "bar")])

    # Remo — horizontal 16:10
    row_bot = dict(head=(106, 49), neck=(97, 53), hip=(60, 50), knee=(70, 71), ankle=(64, 92), toe=(73, 93),
                   elbow=(96, 66), hand=(96, 79), bar=(96, 79))
    row_top = dict(head=(106, 49), neck=(97, 53), hip=(60, 50), knee=(70, 71), ankle=(64, 92), toe=(73, 93),
                   elbow=(80, 52), hand=(88, 68), bar=(88, 68))
    render("remo-horizontal", (480, 300), [row_bot, row_top], SIDE, [("plate", "bar")])

    # Elevaciones laterales — vertical, vista frontal
    front = [("head", "neck"), ("neck", "hip"), ("hip", "lk"), ("lk", "la"), ("hip", "rk"), ("rk", "ra"),
             ("neck", "ls"), ("neck", "rs"), ("ls", "le"), ("le", "lh"), ("rs", "re"), ("re", "rh")]
    lat_dn = dict(head=(50, 20), neck=(50, 30), hip=(50, 70), lk=(44, 95), la=(43, 120), rk=(56, 95), ra=(57, 120),
                  ls=(40, 33), rs=(60, 33), le=(36, 50), lh=(36, 66), re=(64, 50), rh=(64, 66), db1=(36, 66), db2=(64, 66))
    lat_up = dict(head=(50, 20), neck=(50, 30), hip=(50, 70), lk=(44, 95), la=(43, 120), rk=(56, 95), ra=(57, 120),
                  ls=(40, 33), rs=(60, 33), le=(25, 34), lh=(12, 37), re=(75, 34), rh=(88, 37), db1=(12, 37), db2=(88, 37))
    render("elevaciones-laterales-vertical", (360, 480), [lat_dn, lat_up], front, [("db", "db1"), ("db", "db2")])

    # Extensión de tríceps — horizontal (vista lateral, de pie)
    tri_up = dict(head=(80, 29), neck=(80, 37), hip=(80, 68), knee=(81, 81), ankle=(80, 92), toe=(88, 93),
                  elbow=(78, 23), hand=(77, 10), db1=(77, 10))
    tri_dn = dict(head=(80, 29), neck=(80, 37), hip=(80, 68), knee=(81, 81), ankle=(80, 92), toe=(88, 93),
                  elbow=(78, 23), hand=(66, 37), db1=(66, 37))
    render("extension-triceps-horizontal", (480, 300), [tri_up, tri_dn], SIDE, [("db", "db1")])


if __name__ == "__main__":
    build_logo()
    build_hero()
    build_grunge()
    build_gifs()
    sys.exit(0)
