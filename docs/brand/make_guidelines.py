#!/usr/bin/env python3
"""One A4 brand sheet per flavor. Google Drawings palette only."""

from pathlib import Path

from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas

OUT = Path(__file__).resolve().parent

# Google Drawings default picker: 10 columns × 8 rows (top = black…white).
DRAWINGS_10X8 = [
    ["#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#efefef", "#f3f3f3", "#ffffff"],
    ["#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff", "#9900ff", "#ff00ff"],
    ["#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#cfe2f3", "#d9d2e9", "#ead1dc"],
    ["#dd7e6b", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#a4c2f4", "#9fc5e8", "#b4a7d6", "#d5a6bd"],
    ["#cc4125", "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6d9eeb", "#6fa8dc", "#8e7cc3", "#c27ba0"],
    ["#a61c00", "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3c78d8", "#3d85c6", "#674ea7", "#a64d79"],
    ["#85200c", "#990000", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#1155cc", "#0b5394", "#351c75", "#741b47"],
    ["#5b0f00", "#660000", "#783f04", "#7f6000", "#274e13", "#0c343d", "#1c4587", "#073763", "#20124d", "#4c1130"],
]

TOP_BAR_MM = 2.5
BOT_BAR_MM = 5.0  # 1 : 2 vs top, from Doutrina A4 letterhead (~2.54 / 4.91 mm)

PANES = [
    ("1. Ache", "#990000", "#f4cccc", "Dark red 2 / Light red 3"),
    ("2. Leia", "#1155cc", "#c9daf8", "Dark cornflower 2 / Light cornflower 3"),
    ("3. Consulte", "#38761d", "#d9ead3", "Dark green 2 / Light green 3"),
    ("4. Anote", "#7f6000", "#fff2cc", "Dark yellow 3 / Light yellow 3"),
]

CTA_PT = "Ache · Leia · Consulte · Anote"
CTA_EN = "Find · Read · Lookup · Note"
MAIL = "sergio@doutrina.org"

FLAVORS = [
    {
        "id": "librus",
        "name": "LIBRUS",
        "url": "librus.app",
        "accent": "#6aa84f",
        "drawings": "Dark green 1",
        "mark": "columns-4",
        "tag_pt": "anotar para assimilar",
        "tag_en": "annotate to assimilate",
        "role": "Generic study shelf (Holmes & general).",
        "print": "No print set yet. When drawn, copy Doutrina’s board: top rule + mark + URL, footer Light-3 map, Dark-1 accent. Do not print “call to action”.",
        "dont": [
            "Web green #008b00 (not on the Drawings grid).",
            "English placeholder “call to action” under the wordmark.",
            "A librus@ mailbox — there isn’t one. Use sergio@doutrina.org.",
            "Dummy “Lorem ipsum” on the letterhead.",
        ],
    },
    {
        "id": "doutrina",
        "name": "DOUTRINA",
        "url": "doutrina.org",
        "accent": "#3c78d8",
        "drawings": "Dark cornflower 1",
        "mark": "droplet",
        "tag_pt": "renascer da água",
        "tag_en": "estudo para assimilar / study to assimilate",
        "role": "Kardec codification shelf.",
        "print": "Reference print set (letterhead, envelope, card). Top rule and droplet are Dark cornflower 1. Card lockup uses renascer da água. Footer is the four Light-3 pane map.",
        "dont": [
            "Dodger Blue #1e90ff (old web accent).",
            "Dark yellow 2 #bf9000 on Anote labels (2.91:1 on white).",
            "A second mailbox — sergio@doutrina.org only.",
        ],
    },
    {
        "id": "centro",
        "name": "CENTRO",
        "url": "centro.doutrina.org",
        "accent": "#cc0000",
        "drawings": "Dark red 1",
        "mark": "house-heart",
        "tag_pt": "comunidade em estudo",
        "tag_en": "community in study",
        "role": "Center + codification; JaaS on.",
        "print": "No print set yet. Same board as Doutrina with Dark red 1 on the mark and top rule.",
        "dont": [
            "Crimson #da2f2f / #dc143c (not Drawings Dark red 1).",
            "Collapsing the house-heart into the droplet or columns-4.",
            "A centro@ mailbox — use sergio@doutrina.org.",
        ],
    },
]


def rgb(hex_):
    return HexColor(hex_)


import math
import re as _re

# Lucide 24×24 paths (same as public/brand/*-favicon.svg, unscaled).
LUCIDE = {
    "columns-4": [
        "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m2.5 0v18M12 3v18m4.5-18v18",
    ],
    "droplet": [
        "m12 4.5 4.6 4.6a7.4 7.4 0 1 1-9.2 0Z",
    ],
    "house-heart": [
        "M8.62 13.8A2.25 2.25 0 1 1 12 10.836a2.25 2.25 0 1 1 3.38 2.966l-2.626 2.856a.998.998 0 0 1-1.507 0Z",
        "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z",
    ],
}


def _tok(d):
    return _re.findall(
        r"[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?", d
    )


def _arc_center(x1, y1, rx, ry, phi, fa, fs, x2, y2):
    phi = math.radians(phi)
    cos_p, sin_p = math.cos(phi), math.sin(phi)
    dx, dy = (x1 - x2) / 2.0, (y1 - y2) / 2.0
    x1p = cos_p * dx + sin_p * dy
    y1p = -sin_p * dx + cos_p * dy
    rx, ry = abs(rx), abs(ry)
    lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
    if lam > 1:
        s = math.sqrt(lam)
        rx, ry = rx * s, ry * s
    num = max(0.0, rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p)
    den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
    coef = math.sqrt(num / den) if den else 0.0
    if fa == fs:
        coef = -coef
    cxp = coef * (rx * y1p) / ry if ry else 0.0
    cyp = coef * -(ry * x1p) / rx if rx else 0.0
    cx = cos_p * cxp - sin_p * cyp + (x1 + x2) / 2.0
    cy = sin_p * cxp + cos_p * cyp + (y1 + y2) / 2.0

    def ang(ux, uy, vx, vy):
        n = math.hypot(ux, uy) * math.hypot(vx, vy)
        if not n:
            return 0.0
        a = math.acos(max(-1.0, min(1.0, (ux * vx + uy * vy) / n)))
        return -a if ux * vy - uy * vx < 0 else a

    start = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
    delta = ang(
        (x1p - cxp) / rx,
        (y1p - cyp) / ry,
        (-x1p - cxp) / rx,
        (-y1p - cyp) / ry,
    )
    if fs == 0 and delta > 0:
        delta -= 2 * math.pi
    elif fs == 1 and delta < 0:
        delta += 2 * math.pi
    return cx, cy, rx, ry, start, delta, phi


def _arc_cubics(cx, cy, rx, ry, start, delta, phi):
    n = max(1, int(math.ceil(abs(delta) / (math.pi / 2.0))))
    d = delta / n
    k = 4.0 / 3.0 * math.tan(d / 4.0)
    cos_p, sin_p = math.cos(phi), math.sin(phi)

    def pt(a):
        x, y = rx * math.cos(a), ry * math.sin(a)
        return cx + cos_p * x - sin_p * y, cy + sin_p * x + cos_p * y

    def tan(a):
        dx, dy = -rx * math.sin(a), ry * math.cos(a)
        return cos_p * dx - sin_p * dy, sin_p * dx + cos_p * dy

    segs = []
    for i in range(n):
        a0 = start + i * d
        a1 = a0 + d
        p0, p3 = pt(a0), pt(a1)
        t0, t1 = tan(a0), tan(a1)
        p1 = (p0[0] + k * t0[0], p0[1] + k * t0[1])
        p2 = (p3[0] - k * t1[0], p3[1] - k * t1[1])
        segs.append((p1, p2, p3))
    return segs


def _draw_svg_path(c, d):
    """Stroke an SVG path in current user space (SVG y-down already flipped)."""
    toks = _tok(d)
    i = 0
    x = y = 0.0
    sx = sy = 0.0
    p = c.beginPath()
    cmd = None
    while i < len(toks):
        t = toks[i]
        if t.isalpha():
            cmd = t
            i += 1
            if cmd in "Zz":
                p.close()
                x, y = sx, sy
            continue

        def n():
            nonlocal i
            v = float(toks[i])
            i += 1
            return v

        if cmd in "Mm":
            nx, ny = n(), n()
            if cmd == "m":
                nx, ny = x + nx, y + ny
            x, y = nx, ny
            sx, sy = x, y
            p.moveTo(x, y)
            cmd = "l" if cmd == "m" else "L"
        elif cmd in "Ll":
            nx, ny = n(), n()
            if cmd == "l":
                nx, ny = x + nx, y + ny
            x, y = nx, ny
            p.lineTo(x, y)
        elif cmd in "Hh":
            nx = n() if cmd == "H" else x + n()
            x = nx
            p.lineTo(x, y)
        elif cmd in "Vv":
            ny = n() if cmd == "V" else y + n()
            y = ny
            p.lineTo(x, y)
        elif cmd in "Cc":
            x1, y1, x2, y2, nx, ny = n(), n(), n(), n(), n(), n()
            if cmd == "c":
                x1, y1, x2, y2, nx, ny = x + x1, y + y1, x + x2, y + y2, x + nx, y + ny
            p.curveTo(x1, y1, x2, y2, nx, ny)
            x, y = nx, ny
        elif cmd in "Aa":
            rx, ry, rot, fa, fs, nx, ny = n(), n(), n(), n(), n(), n(), n()
            fa, fs = int(fa), int(fs)
            if cmd == "a":
                nx, ny = x + nx, y + ny
            if abs(nx - x) < 1e-9 and abs(ny - y) < 1e-9:
                continue
            cx, cy, rx, ry, start, delta, phi = _arc_center(
                x, y, rx, ry, rot, fa, fs, nx, ny
            )
            for p1, p2, p3 in _arc_cubics(cx, cy, rx, ry, start, delta, phi):
                p.curveTo(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1])
            x, y = nx, ny
        else:
            raise ValueError("unhandled SVG command " + str(cmd))
    c.drawPath(p, stroke=1, fill=0)


def draw_lucide(c, x, y, s, color, name):
    """Paint a Lucide 24×24 icon at bottom-left (x,y), size s, stroke 2 in viewBox."""
    c.saveState()
    c.translate(x, y + s)
    c.scale(s / 24.0, -s / 24.0)
    c.setStrokeColor(color)
    c.setLineWidth(2)  # Lucide default, in 24-unit space
    c.setLineCap(1)
    c.setLineJoin(1)
    c.setFillColor(color)
    for d in LUCIDE[name]:
        _draw_svg_path(c, d)
    c.restoreState()


def MARK(name):
    def fn(c, x, y, s, color):
        draw_lucide(c, x, y, s, color, name)

    return fn


MARK = {
    "columns-4": MARK("columns-4"),
    "droplet": MARK("droplet"),
    "house-heart": MARK("house-heart"),
}


def lum(hex_):
    h = hex_.lstrip("#")
    r, g, b = int(h[0:2], 16) / 255, int(h[2:4], 16) / 255, int(h[4:6], 16) / 255

    def lin(u):
        return u / 12.92 if u <= 0.04045 else ((u + 0.055) / 1.055) ** 2.4

    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def used_hexes(f):
    s = {f["accent"].lower(), "#000000", "#ffffff"}
    for _n, ink, wash, _d in PANES:
        s.add(ink.lower())
        s.add(wash.lower())
    return s


def draw_check(c, cx, cy, r, hex_):
    """Tick inside a circle. Light fill → dark tick; dark fill → white tick."""
    c.saveState()
    c.setStrokeColor(black if lum(hex_) > 0.55 else white)
    c.setLineWidth(max(0.7, r * 0.18))
    c.setLineCap(1)
    c.setLineJoin(1)
    c.line(cx - r * 0.38, cy - r * 0.05, cx - r * 0.08, cy - r * 0.38)
    c.line(cx - r * 0.08, cy - r * 0.38, cx + r * 0.42, cy + r * 0.32)
    c.restoreState()


def drawings_grid(c, x, y, used):
    """10×8 circle grid; (x,y) is lower-left of the block including caption."""
    cols, rows = 10, 8
    d = 5.1 * mm
    gap = 1.15 * mm
    cell = d + gap
    grid_h = rows * cell - gap
    grid_w = cols * cell - gap
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(x, y + grid_h + 3.2 * mm, "Google Drawings  10 × 8")
    c.setFont("Helvetica", 6.5)
    c.setFillColor(HexColor("#666666"))
    c.drawString(x, y + grid_h + 0.4 * mm, "Check = used on this flavor")
    for r in range(rows):
        for col in range(cols):
            hx = DRAWINGS_10X8[r][col]
            cx = x + col * cell + d / 2
            cy = y + (rows - 1 - r) * cell + d / 2
            c.setFillColor(rgb(hx))
            c.circle(cx, cy, d / 2, stroke=0, fill=1)
            c.setStrokeColor(HexColor("#cccccc") if hx.lower() == "#ffffff" else rgb(hx))
            c.setLineWidth(0.25)
            c.circle(cx, cy, d / 2, stroke=1, fill=0)
            if hx.lower() in used:
                draw_check(c, cx, cy, d / 2, hx)
    return grid_w, grid_h + 8 * mm


def swatch(c, x, y, w, h, hex_, label, sub):
    c.setFillColor(rgb(hex_))
    c.rect(x, y, w, h, stroke=0, fill=1)
    c.setStrokeColor(HexColor("#dddddd"))
    c.setLineWidth(0.3)
    c.rect(x, y, w, h, stroke=1, fill=0)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(x, y - 10, label)
    c.setFont("Helvetica", 6.5)
    c.setFillColor(HexColor("#555555"))
    c.drawString(x, y - 19, hex_.upper())


def spec_row(c, x, y, k, v):
    c.setFont("Helvetica-Bold", 7)
    c.setFillColor(HexColor("#111111"))
    c.drawString(x, y, k)
    c.setFont("Helvetica", 7)
    c.setFillColor(HexColor("#222222"))
    c.drawString(x + 32 * mm, y, v)


def page(c, f):
    W, H = A4
    m = 14 * mm
    accent = rgb(f["accent"])
    top_h = TOP_BAR_MM * mm
    bot_h = BOT_BAR_MM * mm

    c.setFillColor(accent)
    c.rect(0, H - top_h, W, top_h, stroke=0, fill=1)
    bw = W / 4
    for i, (name, ink, wash, _) in enumerate(PANES):
        c.setFillColor(rgb(wash))
        c.rect(i * bw, 0, bw, bot_h, stroke=0, fill=1)
        c.setFillColor(rgb(ink))
        c.setFont("Helvetica-Bold", 6.5)
        c.drawCentredString(i * bw + bw / 2, 1.7 * mm, name)

    y = H - top_h - 6 * mm
    c.setFillColor(HexColor("#444444"))
    c.setFont("Helvetica-Bold", 11)
    c.drawString(m, y, "Brand Guidelines")
    y -= 14 * mm
    MARK[f["mark"]](c, m, y - 2 * mm, 14 * mm, accent)
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(m + 17 * mm, y + 5 * mm, f["name"])
    c.setFillColor(accent)
    c.setFont("Helvetica", 10)
    c.drawString(m + 17 * mm, y - 0.5 * mm, f["tag_pt"])
    c.setFillColor(HexColor("#555555"))
    c.setFont("Helvetica", 8)
    c.drawString(m + 17 * mm, y - 5.5 * mm, f["url"] + "  ·  " + f["tag_en"])
    c.setFont("Helvetica", 7.5)
    c.drawString(
        m + 17 * mm,
        y - 10 * mm,
        "Lucide  " + f["mark"] + "    lucide.dev/icons/" + f["mark"],
    )

    y -= 18 * mm
    c.setStrokeColor(accent)
    c.setLineWidth(0.6)
    c.line(m, y, W - m, y)

    y -= 8 * mm
    c.setFillColor(black)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(m, y, "Identity")
    y -= 4.5 * mm
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor("#222222"))
    for ln in [
        f"Role  ·  {f['role']}",
        f"CTA (all flavors)  ·  {CTA_PT}",
        f"                   ·  {CTA_EN}",
        f"Tagline  ·  {f['tag_pt']}",
        f"Email  ·  {MAIL}   (one mailbox; no librus@ / centro@)",
        f"Lucide  ·  {f['mark']}    lucide.dev/icons/{f['mark']}",
        f"Mark  ·  stroke only (2 px @ 24×24)  ·  Centro heart is a second path, also stroke",
    ]:
        c.drawString(m, y, ln)
        y -= 3.9 * mm

    y -= 3 * mm
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(black)
    c.drawString(m, y, "Measure")
    y -= 4.4 * mm
    specs = [
        ("Lucide", f"{f['mark']}    lucide.dev/icons/{f['mark']}"),
        ("Stroke", "2 px @ Lucide 24×24  ·  512 px favicon = 42.7 px  ·  16 mm mark = 1.33 mm"),
        ("Line height", "Wordmark 1.00  ·  tagline/chrome 1.25  ·  letter 1.50  ·  book 1.65"),
        ("Page", "A4 210 × 297 mm  ·  margins 14 mm  ·  mark 16 × 16 mm  ·  clear 4 mm"),
        ("Print", "Letterhead A4  ·  envelope 229 × 115 mm  ·  card 85 × 55 mm"),
        ("Favicon", "512 × 512 px SVG  ·  stroke 2 px on 24-unit path, scaled"),
        ("Top ruler", f"{TOP_BAR_MM:.1f} mm solid accent ({f['drawings']})"),
        ("Bottom ruler", f"{BOT_BAR_MM:.1f} mm four Light-3 pane bands"),
        ("Ruler ratio", f"top : bottom = {TOP_BAR_MM:.1f} : {BOT_BAR_MM:.1f} mm = 1 : {BOT_BAR_MM / TOP_BAR_MM:.0f}"),
        ("Tracking", "Wordmark +40 (caps)  ·  CTA +20  ·  body 0"),
    ]
    for k, v in specs:
        spec_row(c, m, y, k, v)
        y -= 3.8 * mm

    y -= 4 * mm
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(black)
    c.drawString(m, y, "Accent  ·  " + f["drawings"])
    y -= 14 * mm
    swatch(c, m, y, 38 * mm, 8 * mm, f["accent"], f["name"] + " accent", f["drawings"])

    y -= 16 * mm
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(black)
    c.drawString(m, y, "Four panes  ·  same on every flavor")
    y -= 3.6 * mm
    c.setFont("Helvetica", 7)
    c.setFillColor(HexColor("#555555"))
    c.drawString(m, y, "Title ink Dark 2 (Anote Dark yellow 3) for AA on white. Washes Light 3.")
    y -= 12 * mm
    pw = 26 * mm
    gap = 2.5 * mm
    for i, (name, ink, wash, names) in enumerate(PANES):
        x = m + i * (pw + gap)
        short = name.split(". ", 1)[-1]
        swatch(c, x, y, pw, 7 * mm, ink, short + " ink", names.split(" / ")[0])
    y -= 22 * mm
    for i, (name, ink, wash, names) in enumerate(PANES):
        x = m + i * (pw + gap)
        short = name.split(". ", 1)[-1]
        swatch(c, x, y, pw, 7 * mm, wash, short + " wash", names.split(" / ")[1])

    y -= 18 * mm
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(black)
    c.drawString(m, y, "Print")
    y -= 4.2 * mm
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor("#222222"))
    for ln in _wrap(f["print"], 58):
        c.drawString(m, y, ln)
        y -= 3.7 * mm

    y -= 2.5 * mm
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(black)
    c.drawString(m, y, "Do not")
    y -= 4.2 * mm
    c.setFont("Helvetica", 8)
    c.setFillColor(HexColor("#222222"))
    for d in f["dont"]:
        for ln in _wrap("·  " + d, 58):
            c.drawString(m, y, ln)
            y -= 3.7 * mm

    # 10×8 grid, lower right, above the bottom ruler
    cell = 6.25 * mm
    grid_w = 10 * cell - 1.15 * mm
    gx = W - m - grid_w
    gy = bot_h + 8 * mm
    drawings_grid(c, gx, gy, used_hexes(f))

    c.setFillColor(HexColor("#888888"))
    c.setFont("Helvetica", 6.5)
    c.drawString(
        m,
        bot_h + 2.2 * mm,
        "Drawings default grid only.  2026-09-12  ·  librus-shell/docs/brand/",
    )


def _wrap(text, n):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if len(t) <= n:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def main():
    for f in FLAVORS:
        path = OUT / f"{f['id']}-A4.pdf"
        c = canvas.Canvas(str(path), pagesize=A4)
        c.setTitle(f"Brand Guidelines — {f['name']}")
        c.setAuthor("librus-shell")
        page(c, f)
        c.showPage()
        c.save()
        print("wrote", path)


if __name__ == "__main__":
    main()
