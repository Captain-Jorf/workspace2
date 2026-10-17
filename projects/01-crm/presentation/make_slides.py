"""Render the CRM presentation slides (1920x1080, Persian RTL, minimal style).

Usage: python make_slides.py
Output: build/slide_01.png ... build/slide_10.png
Fonts: Vazirmatn (OFL) copied into build/ by the setup step.
"""
import os
import arabic_reshaper
from bidi.algorithm import get_display
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
W, H = 1920, 1080

BG = (248, 250, 252)
INK = (15, 23, 42)
MUTED = (100, 116, 139)
TEAL = (13, 148, 136)
TEAL_L = (204, 251, 241)
BLUE = (37, 99, 235)
BLUE_L = (219, 234, 254)
RED = (220, 38, 38)
RED_L = (254, 226, 226)
GREEN = (22, 163, 74)
GREEN_L = (220, 252, 231)
LINE = (203, 213, 225)
CARD = (255, 255, 255)
PANEL = (241, 245, 249)
GRAY_L = (226, 232, 240)

_font_cache = {}


def fnt(size, weight="Regular"):
    key = (size, weight)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(os.path.join(BUILD, f"Vazirmatn-{weight}.ttf"), size)
    return _font_cache[key]


def T(s):
    """Shape Persian text and reorder for left-to-right drawing."""
    return get_display(arabic_reshaper.reshape(s))


def tw(s, f):
    return f.getlength(T(s))


def wrap(s, f, maxw):
    words = s.split()
    lines, cur = [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if not cur or tw(t, f) <= maxw:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def text(d, x, y, s, size=44, color=INK, weight="Regular", align="r", maxw=None, lh=1.45):
    """Draw text. align: 'r' (x = right edge), 'c' (x = center), 'l' (x = left edge)."""
    f = fnt(size, weight)
    lines = wrap(s, f, maxw) if maxw else [s]
    yy = y
    for ln in lines:
        w = tw(ln, f)
        xx = x - w if align == "r" else (x - w / 2 if align == "c" else x)
        d.text((xx, yy), T(ln), font=f, fill=color)
        yy += size * lh
    return yy


def box(d, x1, y1, x2, y2, fill=CARD, outline=LINE, r=28, w=3):
    d.rounded_rectangle((x1, y1, x2, y2), r, fill=fill, outline=outline, width=w)


def arrow(d, x1, y1, x2, y2, color=MUTED, w=5, head=22):
    import math
    d.line((x1, y1, x2, y2), fill=color, width=w)
    ang = math.atan2(y2 - y1, x2 - x1)
    p1 = (x2 - head * math.cos(ang - 0.45), y2 - head * math.sin(ang - 0.45))
    p2 = (x2 - head * math.cos(ang + 0.45), y2 - head * math.sin(ang + 0.45))
    d.polygon([(x2, y2), p1, p2], fill=color)


def dashed(d, x1, y1, x2, y2, color=MUTED, w=4, dash=18, gap=12):
    import math
    L = math.hypot(x2 - x1, y2 - y1)
    if L == 0:
        return
    ux, uy = (x2 - x1) / L, (y2 - y1) / L
    t = 0
    while t < L:
        e = min(t + dash, L)
        d.line((x1 + ux * t, y1 + uy * t, x1 + ux * e, y1 + uy * e), fill=color, width=w)
        t = e + gap


def dashed_box(d, x1, y1, x2, y2, color=MUTED):
    dashed(d, x1, y1, x2, y1, color)
    dashed(d, x2, y1, x2, y2, color)
    dashed(d, x2, y2, x1, y2, color)
    dashed(d, x1, y2, x1, y1, color)


def person(d, cx, cy, s, color):
    d.ellipse((cx - 0.22 * s, cy - 0.62 * s, cx + 0.22 * s, cy - 0.18 * s), fill=color)
    d.rounded_rectangle((cx - 0.42 * s, cy - 0.08 * s, cx + 0.42 * s, cy + 0.55 * s), 0.3 * s, fill=color)


def check(d, cx, cy, s, color, w=10):
    d.line((cx - 0.5 * s, cy, cx - 0.12 * s, cy + 0.38 * s), fill=color, width=w)
    d.line((cx - 0.12 * s, cy + 0.38 * s, cx + 0.55 * s, cy - 0.42 * s), fill=color, width=w)


def base(title):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    text(d, W - 140, 80, title, 76, INK, "Bold")
    d.rounded_rectangle((W - 140 - 130, 196, W - 140, 206), 5, fill=TEAL)
    text(d, W - 140, 985, "نسخه آفلاین‌اول", 28, MUTED, align="r")
    return img, d


# ---------------------------------------------------------------- slides

def slide_01():
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    cx, cy = W // 2, 330
    d.ellipse((cx - 115, cy - 115, cx + 115, cy + 115), fill=TEAL)
    person(d, cx, cy, 130, (255, 255, 255))
    text(d, cx, 520, "CRM ساده", 150, INK, "Bold", align="c")
    text(d, cx, 690, "مدیریت مشتری و سرنخ‌های فروش", 56, MUTED, align="c")
    box(d, cx - 210, 770, cx + 210, 870, fill=TEAL_L, outline=TEAL, r=50, w=2)
    text(d, cx, 792, "نسخه آفلاین‌اول", 42, TEAL, "SemiBold", align="c")
    text(d, cx, 920, "معرفی پروژه ۰۱ از ۲۰", 34, MUTED, align="c")
    return img


def slide_02():
    img, d = base("مشکل امروز")
    sources = [("دفترچه یادداشت", 1500), ("واتساپ", 960), ("اکسل", 420)]
    for label, x in sources:
        box(d, x - 190, 300, x + 190, 420, fill=CARD, outline=LINE)
        text(d, x, 340, label, 48, INK, "SemiBold", align="c")
    for _, x in sources:
        arrow(d, x, 430, 960, 600, color=MUTED, w=4)
    box(d, 960 - 300, 605, 960 + 300, 735, fill=RED_L, outline=RED, r=30, w=3)
    text(d, 960, 638, "پیگیری گم می‌شود", 58, RED, "Bold", align="c")
    text(d, 960, 800, "هیچ‌جا تصویر کامل فروش وجود ندارد", 42, MUTED, align="c")
    text(d, 960, 870, "سرنخ‌ها فراموش می‌شوند و فرصت فروش از دست می‌رود", 36, MUTED, align="c")
    return img


def slide_03():
    img, d = base("یک جا برای همه‌چیز")
    cards = [
        ("مشتری‌ها", "پروفایل کامل شرکت و مخاطب", 1530, "person"),
        ("سرنخ‌ها", "هر فرصت فروش با مرحله‌ی مشخص", 960, "funnel"),
        ("پیگیری‌ها", "یادآوری تماس و تاریخ بعدی", 390, "bell"),
    ]
    for title, desc, cx, icon in cards:
        box(d, cx - 250, 300, cx + 250, 800, fill=CARD, outline=LINE, r=32)
        d.ellipse((cx - 85, 350, cx + 85, 520), fill=TEAL_L)
        if icon == "person":
            person(d, cx, 435, 110, TEAL)
        elif icon == "funnel":
            d.polygon([(cx - 60, 395), (cx + 60, 395), (cx + 16, 455), (cx + 16, 500), (cx - 16, 490), (cx - 16, 455)], fill=TEAL)
        else:
            d.ellipse((cx - 38, 385, cx + 38, 445), fill=TEAL)
            d.rounded_rectangle((cx - 50, 430, cx + 50, 475), 14, fill=TEAL)
            d.ellipse((cx - 12, 472, cx + 12, 496), fill=TEAL)
        text(d, cx, 575, title, 60, INK, "Bold", align="c")
        text(d, cx, 670, desc, 40, MUTED, align="c", maxw=430)
    return img


def slide_04():
    img, d = base("چه کسانی از برنامه استفاده می‌کنند؟")
    hx, hy = 960, 640
    d.line((hx, 440, hx, hy - 110), fill=LINE, width=6)
    d.line((hx - 110, hy, 640, hy), fill=LINE, width=6)
    d.line((hx + 110, hy, 1280, hy), fill=LINE, width=6)
    d.ellipse((hx - 110, hy - 110, hx + 110, hy + 110), fill=TEAL)
    text(d, hx, hy - 36, "CRM", 62, (255, 255, 255), "Bold", align="c")
    roles = [
        ("مدیر فروش", "دسترسی کامل، گزارش و تنظیمات", 960, 290),
        ("پشتیبان", "ثبت تماس و ویرایش اطلاعات مشتری", 430, 555),
        ("فروشنده", "فقط سرنخ‌ها و مشتری‌های خودش", 1490, 555),
    ]
    for title, desc, cx, y in roles:
        box(d, cx - 230, y, cx + 230, y + 225, fill=CARD, outline=TEAL, r=28, w=3)
        text(d, cx, y + 24, title, 52, INK, "Bold", align="c")
        text(d, cx, y + 100, desc, 34, MUTED, align="c", maxw=440)
    text(d, 960, 900, "تفکیک دسترسی، امنیت داده‌های شرکت را حفظ می‌کند", 40, MUTED, align="c")
    return img


def slide_05():
    img, d = base("جریان کار: از سرنخ تا فروش")
    y = 430
    steps = [("سرنخ جدید", 1500, BLUE_L, BLUE), ("در تماس", 1100, BLUE_L, BLUE),
             ("پیشنهاد", 700, BLUE_L, BLUE), ("برنده شد", 300, GREEN_L, GREEN)]
    for i, (label, cx, fill, col) in enumerate(steps):
        box(d, cx - 170, y, cx + 170, y + 150, fill=fill, outline=col, r=28, w=3)
        text(d, cx, y + 50, label, 46, INK, "Bold", align="c", maxw=310)
        text(d, cx, y + 110, f"مرحله {['۱', '۲', '۳', '۴'][i]}", 30, MUTED, align="c")
        if i < len(steps) - 1:
            nx = steps[i + 1][1]
            arrow(d, cx - 175, y + 75, nx + 175, y + 75, color=MUTED, w=5)
    # lost branch
    box(d, 700 - 170, 690, 700 + 170, 830, fill=RED_L, outline=RED, r=28, w=3)
    text(d, 700, 725, "بازنده شد", 46, RED, "Bold", align="c")
    text(d, 700, 785, "دلیل ثبت می‌شود", 30, MUTED, align="c")
    arrow(d, 700, y + 160, 700, 685, color=RED, w=5)
    text(d, 675, 600, "از پیشنهاد", 30, RED, align="r")
    # loop back for follow-up
    text(d, 960, 930, "هر تغییر مرحله، در گزارش نرخ تبدیل ثبت می‌شود", 36, MUTED, align="c")
    return img


def slide_06():
    img, d = base("صفحات اصلی: پایپ‌لاین فروش")
    x1, y1, x2, y2 = 200, 300, 1720, 880
    box(d, x1, y1, x2, y2, fill=CARD, outline=LINE, r=20, w=3)
    d.rounded_rectangle((x1, y1, x2, y1 + 56), 20, fill=GRAY_L)
    d.rectangle((x1, y1 + 30, x2, y1 + 56), fill=GRAY_L)
    for i, c in enumerate([RED, (234, 179, 8), GREEN]):
        d.ellipse((x1 + 24 + i * 30, y1 + 18, x1 + 42 + i * 30, y1 + 36), fill=c)
    d.rounded_rectangle((x1 + 180, y1 + 14, x2 - 180, y1 + 42), 14, fill=CARD)
    text(d, (x1 + x2) // 2, y1 + 15, "crm.app / پایپ‌لاین", 26, MUTED, align="c")
    cols = [
        ("برنده", GREEN, ["شرکت آریا", "پروژه شمال"]),
        ("پیشنهاد", (234, 179, 8), ["فروشگاه نور"]),
        ("در تماس", BLUE, ["کافه بهار", "دفتر حقوقی", "شرکت سپهر"]),
        ("جدید", TEAL, ["فروشگاه ماه", "گالری شیراز"]),
    ]
    colw, gap = 340, 22
    start_right = x2 - 40
    for i, (name, col, cards) in enumerate(cols):
        cxr = start_right - i * (colw + gap)
        cxl = cxr - colw
        d.rounded_rectangle((cxl, y1 + 90, cxr, y2 - 40), 18, fill=PANEL)
        d.rounded_rectangle((cxl, y1 + 90, cxr, y1 + 160), 18, fill=col)
        d.rectangle((cxl, y1 + 130, cxr, y1 + 160), fill=col)
        text(d, (cxl + cxr) // 2, y1 + 100, f"{name} ({len(cards)})", 38, (255, 255, 255), "Bold", align="c")
        for j, card in enumerate(cards):
            cy = y1 + 195 + j * 130
            box(d, cxl + 18, cy, cxr - 18, cy + 105, fill=CARD, outline=LINE, r=18, w=2)
            d.rectangle((cxr - 18 - 10, cy + 20, cxr - 18 - 4, cy + 85), fill=col)
            text(d, cxr - 50, cy + 22, card, 36, INK, "SemiBold")
            text(d, cxr - 50, cy + 66, "ارزش: ۲۵ میلیون", 26, MUTED)
    text(d, 960, 920, "جابه‌جایی کارت بین ستون‌ها = تغییر مرحله‌ی فروش", 40, TEAL, "SemiBold", align="c")
    return img


def er_box(d, x1, y1, x2, title, fields, color):
    lines_h = 40
    h = 60 + len(fields) * lines_h + 18
    box(d, x1, y1, x2, y1 + h, fill=CARD, outline=color, r=16, w=3)
    d.rounded_rectangle((x1, y1, x2, y1 + 56), 16, fill=color)
    d.rectangle((x1, y1 + 30, x2, y1 + 56), fill=color)
    text(d, (x1 + x2) // 2, y1 + 10, title, 36, (255, 255, 255), "Bold", align="c")
    for i, fl in enumerate(fields):
        text(d, x1 + 26, y1 + 68 + i * lines_h, fl, 30, INK, align="l")
    return y1 + h


def slide_07():
    img, d = base("مدل داده")
    er_box(d, 1400, 280, 1740, "شرکت (Company)", ["id", "name", "industry", "address"], TEAL)
    er_box(d, 780, 280, 1120, "مخاطب (Contact)", ["id", "company_id", "name", "phone", "email"], BLUE)
    lead_b = er_box(d, 140, 280, 480, "سرنخ (Lead)", ["id", "contact_id", "owner_id", "stage", "value", "next_follow_up"], TEAL)
    er_box(d, 780, 660, 1120, "کاربر (User)", ["id", "name", "role"], BLUE)
    act_b = er_box(d, 140, 660, 480, "فعالیت (Activity)", ["id", "lead_id", "type", "note", "created_at"], TEAL)
    # relations
    d.line((1400, 400, 1120, 400), fill=MUTED, width=4)
    text(d, 1260, 360, "۱ : N", 30, MUTED, align="c")
    d.line((780, 400, 480, 400), fill=MUTED, width=4)
    text(d, 630, 360, "۱ : N", 30, MUTED, align="c")
    d.line((310, lead_b, 310, 660), fill=MUTED, width=4)
    text(d, 330, 600, "۱ : N", 30, MUTED, align="r")
    d.line((780, 690, 480, lead_b - 40), fill=MUTED, width=4)
    text(d, 600, 600, "owner", 30, MUTED, align="c")
    text(d, 960, 955, "هر سرنخ به یک مخاطب و یک مالک فروش وصل است", 36, MUTED, align="c")
    return img


def slide_08():
    img, d = base("معماری آفلاین‌اول")
    box(d, 140, 280, 1200, 800, fill=PANEL, outline=TEAL, r=36, w=3)
    text(d, 1170, 305, "دستگاه کاربر (لپ‌تاپ / موبایل)", 36, TEAL, "Bold")
    comps = [("رابط کاربری", "React", 880), ("منطق برنامه", "Service", 540), ("ذخیره محلی", "IndexedDB", 200)]
    for title, sub, x in comps:
        box(d, x, 400, x + 280, 560, fill=CARD, outline=TEAL, r=24, w=3)
        text(d, x + 140, 430, title, 42, INK, "Bold", align="c")
        text(d, x + 140, 500, sub, 32, MUTED, align="c")
    arrow(d, 880, 480, 820, 480, color=TEAL, w=5)
    arrow(d, 540, 480, 480, 480, color=TEAL, w=5)
    box(d, 200, 620, 1160, 775, fill=TEAL_L, outline=TEAL, r=24, w=2)
    text(d, 680, 645, "Service Worker: برنامه را بدون اینترنت اجرا می‌کند", 38, TEAL, "SemiBold", align="c")
    text(d, 680, 712, "PWA قابل نصب روی دسکتاپ و موبایل", 30, MUTED, align="c")
    # server (optional)
    box(d, 1300, 400, 1740, 560, fill=CARD, outline=LINE, r=24, w=2)
    dashed_box(d, 1300, 400, 1740, 560, MUTED)
    text(d, 1520, 430, "سرور (اختیاری)", 40, MUTED, "Bold", align="c")
    text(d, 1520, 500, "نسخه‌ی آنلاین - مرحله‌ی بعد", 30, MUTED, align="c")
    dashed(d, 1200, 480, 1300, 480, BLUE, 4, 12, 8)
    text(d, 1250, 425, "همگام‌سازی", 30, BLUE, align="c")
    text(d, 960, 880, "بدون اینترنت: خواندن و نوشتن کامل داده‌ها", 40, INK, "SemiBold", align="c")
    return img


def slide_09():
    img, d = base("نقشه راه پروژه")
    y = 470
    d.line((230, y, 1690, y), fill=LINE, width=8)
    labels = ["تعریف مسئله", "ویدیو معرفی", "طراحی", "پایگاه داده و ورود",
              "MVP", "PWA و تست", "دمو و رزومه"]
    status = ["done", "doing", "todo", "todo", "todo", "todo", "todo"]
    colors = {"done": TEAL, "doing": BLUE, "todo": (148, 163, 184)}
    xs = [1690 - i * (1460 / 6) for i in range(7)]
    for i, (x, lab, st) in enumerate(zip(xs, labels, status)):
        c = colors[st]
        d.ellipse((x - 42, y - 42, x + 42, y + 42), fill=c)
        if st == "done":
            check(d, x, y, 40, (255, 255, 255), 9)
        else:
            text(d, x, y - 26, str(i + 1), 40, (255, 255, 255), "Bold", align="c")
        text(d, x, y + 80, lab, 32, INK if st != "todo" else MUTED, "SemiBold" if st != "todo" else "Regular", align="c", maxw=200)
    # legend
    lx = 960
    items = [("انجام شد", TEAL), ("در حال انجام", BLUE), ("در انتظار", (148, 163, 184))]
    xx = 1720
    for label, c in items:
        d.ellipse((xx - 26, 800, xx - 2, 824), fill=c)
        text(d, xx - 40, 796, label, 32, MUTED)
        xx -= 260
    return img


def slide_10():
    img, d = base("جمع‌بندی")
    points = [
        "یک جای واحد برای مشتری، سرنخ و پیگیری",
        "کار کردن کامل بدون اینترنت",
        "آماده‌ی افزودن همگام‌سازی آنلاین برای سازمان‌ها",
    ]
    for i, p in enumerate(points):
        y = 300 + i * 130
        d.ellipse((1640, y, 1700, y + 60), fill=TEAL)
        check(d, 1670, y + 30, 40, (255, 255, 255), 8)
        text(d, 1590, y + 8, p, 50, INK, "Medium")
    box(d, 260, 740, 1660, 870, fill=TEAL, outline=TEAL, r=40, w=0)
    text(d, 960, 778, "قدم بعدی: طراحی صفحات و شروع MVP", 56, (255, 255, 255), "Bold", align="c")
    return img


SLIDES = [slide_01, slide_02, slide_03, slide_04, slide_05,
          slide_06, slide_07, slide_08, slide_09, slide_10]

if __name__ == "__main__":
    os.makedirs(BUILD, exist_ok=True)
    for i, fn in enumerate(SLIDES, 1):
        fn().save(os.path.join(BUILD, f"slide_{i:02d}.png"))
        print("ok", i)
