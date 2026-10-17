"""Generate 10 real HTML/CSS dashboard variants in the 'gradient mesh' style.

Run: python3 build.py   (stdlib only)
Output: theme-01-*.html ... theme-10-*.html and index.html in this folder.
Each page is a working, responsive static mockup (no external requests, fonts are local).
"""
import os
import html

HERE = os.path.dirname(os.path.abspath(__file__))

# Each theme: base background, 4 mesh blobs (color, x%, y%), text colors, card style.
THEMES = [
    dict(slug="peach-lilac", title="هلویی و یاسی", base="#f6eee9",
         blobs=[("#ffb48a", 15, 10), ("#c8a2ff", 85, 15), ("#8ec5ff", 70, 90), ("#ffd6e7", 5, 90)],
         ink="#2a1f3d", muted="#6e6480", accent="#7c4dff", card="rgba(255,255,255,.55)", border="rgba(255,255,255,.7)", dark=False),
    dict(slug="sunset-coral", title="غروب مرجانی", base="#fff3ee",
         blobs=[("#ff7a59", 10, 15), ("#ffb199", 90, 10), ("#ff4d8d", 80, 90), ("#ffd0a1", 20, 85)],
         ink="#3a1a14", muted="#8a5a50", accent="#e8475f", card="rgba(255,255,255,.6)", border="rgba(255,255,255,.75)", dark=False),
    dict(slug="mint-ocean", title="نعنایی اقیانوس", base="#eefaf7",
         blobs=[("#5ee7c6", 12, 12), ("#7fb8ff", 88, 18), ("#a8f0d4", 75, 88), ("#4fd1e6", 15, 88)],
         ink="#0f2e2a", muted="#4f7a72", accent="#0d9488", card="rgba(255,255,255,.58)", border="rgba(255,255,255,.7)", dark=False),
    dict(slug="violet-dream", title="رویای بنفش", base="#f3f0ff",
         blobs=[("#b388ff", 10, 10), ("#ff8ad8", 90, 12), ("#7aa2ff", 80, 90), ("#d6c2ff", 18, 88)],
         ink="#1e1537", muted="#6a5f88", accent="#7c3aed", card="rgba(255,255,255,.6)", border="rgba(255,255,255,.8)", dark=False),
    dict(slug="midnight-mesh", title="نیمه‌شب مش", base="#0b1020",
         blobs=[("#3b28cc", 10, 15), ("#0ea5a4", 90, 10), ("#be185d", 80, 90), ("#1d4ed8", 15, 90)],
         ink="#eef2ff", muted="#9aa6cc", accent="#5eead4", card="rgba(255,255,255,.07)", border="rgba(255,255,255,.14)", dark=True),
    dict(slug="lime-fresh", title="لیمویی تازه", base="#f7fbe9",
         blobs=[("#d9f99d", 12, 12), ("#a3e635", 88, 20), ("#fde68a", 80, 88), ("#86efac", 20, 85)],
         ink="#1d2a0a", muted="#5d6e3a", accent="#65a30d", card="rgba(255,255,255,.6)", border="rgba(255,255,255,.75)", dark=False),
    dict(slug="rose-gold", title="رز گلد", base="#fbf1ef",
         blobs=[("#f5c6b8", 12, 12), ("#e9b8c9", 88, 14), ("#d9a48f", 78, 88), ("#fbe3d6", 20, 86)],
         ink="#3b221d", muted="#8c6158", accent="#b5624a", card="rgba(255,255,255,.62)", border="rgba(255,255,255,.8)", dark=False),
    dict(slug="arctic-ice", title="یخ قطبی", base="#fbfdfe", blur=26,
         blobs=[("#e8f4fb", 10, 10), ("#f4fafd", 90, 14), ("#e2eef9", 78, 90), ("#e6f6f9", 16, 88)],
         ink="#17303f", muted="#637f8f", accent="#4a93c9", card="rgba(255,255,255,.45)", border="rgba(255,255,255,.95)", dark=False),
    dict(slug="forest-mist", title="مه جنگلی", base="#eef3ec",
         blobs=[("#9bd3ae", 12, 12), ("#c7e9c0", 88, 16), ("#6fae8c", 78, 88), ("#d8efd0", 22, 86)],
         ink="#1a2b1f", muted="#5c7262", accent="#2f855a", card="rgba(255,255,255,.6)", border="rgba(255,255,255,.8)", dark=False),
    dict(slug="candy-duo", title="آبنبات دوتایی", base="#fff4fb",
         blobs=[("#ff9ecd", 10, 12), ("#9ee7ff", 90, 14), ("#ffe082", 80, 90), ("#c9a7ff", 16, 88)],
         ink="#2b1431", muted="#7a5d86", accent="#e11d7a", card="rgba(255,255,255,.62)", border="rgba(255,255,255,.85)", dark=False),
]

KPIS = [("سرنخ‌های باز", "۱۴۸", "+۱۲٪"), ("نرخ تبدیل", "۲۲٪", "+۳٪"),
        ("فروش این ماه", "۱۲۴ م", "+۸٪"), ("پیگیری امروز", "۷", "۲ عقب‌افتاده")]

COLUMNS = [
    ("جدید", [("فروشگاه ماه", "۲۵ م", "ر"), ("گالری شیراز", "۱۸ م", "گ")]),
    ("در تماس", [("کافه بهار", "۴۰ م", "ک"), ("دفتر حقوقی سپهر", "۶۵ م", "د"), ("شرکت آرمان", "۳۰ م", "ش")]),
    ("پیشنهاد", [("فروشگاه نور", "۹۰ م", "ن")]),
    ("برنده", [("شرکت آریا", "۱۲۰ م", "آ"), ("پروژه شمال", "۵۵ م", "پ")]),
]

NAV = ["داشبورد", "مشتری‌ها", "سرنخ‌ها", "پایپ‌لاین", "گزارش‌ها", "تنظیمات"]


def blobs_css(blobs):
    parts = [f"radial-gradient(at {x}% {y}%, {c} 0px, transparent 55%)" for c, x, y in blobs]
    return ",\n    ".join(parts)


def page(t):
    dark = t["dark"]
    nav_html = "".join(
        f'<a class="nav{" on" if i == 0 else ""}" href="#">{html.escape(n)}</a>' for i, n in enumerate(NAV))
    kpi_html = "".join(
        f'<div class="card kpi"><span class="lbl">{l}</span><b>{v}</b><span class="delta">{d}</span></div>'
        for l, v, d in KPIS)
    cols_html = ""
    for name, cards in COLUMNS:
        cards_html = "".join(
            f'<div class="card deal"><div class="av">{a}</div><div><div class="dn">{html.escape(n)}</div>'
            f'<div class="dv">{v}</div></div></div>' for n, v, a in cards)
        cols_html += (f'<section class="col"><header><span>{name}</span><em>{len(cards)}</em></header>'
                      f'{cards_html}</section>')
    return f"""<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CRM ساده · {t['title']}</title>
<style>
@font-face {{ font-family: "Vazir"; src: url("fonts/Vazirmatn-Regular.ttf"); font-weight: 400; }}
@font-face {{ font-family: "Vazir"; src: url("fonts/Vazirmatn-Medium.ttf"); font-weight: 500; }}
@font-face {{ font-family: "Vazir"; src: url("fonts/Vazirmatn-SemiBold.ttf"); font-weight: 600; }}
@font-face {{ font-family: "Vazir"; src: url("fonts/Vazirmatn-Bold.ttf"); font-weight: 700; }}
:root {{
  --base: {t['base']};
  --ink: {t['ink']};
  --muted: {t['muted']};
  --accent: {t['accent']};
  --card: {t['card']};
  --border: {t['border']};
}}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{
  font-family: "Vazir", system-ui, sans-serif;
  color: var(--ink);
  background-color: var(--base);
  background-image:
    {blobs_css(t['blobs'])};
  background-attachment: fixed;
  min-height: 100vh;
}}
.app {{ display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; gap: 24px; padding: 24px; }}
.card {{
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 22px;
  backdrop-filter: blur({t.get('blur', 18)}px) saturate(140%);
  -webkit-backdrop-filter: blur({t.get('blur', 18)}px) saturate(140%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.8), 0 10px 30px rgba(20,60,100,{'.25' if dark else '.08'});
}}
aside.card {{ padding: 22px 16px; display: flex; flex-direction: column; gap: 6px; }}
.logo {{ font-weight: 700; font-size: 20px; padding: 6px 12px 18px; }}
.logo i {{ color: var(--accent); font-style: normal; }}
.nav {{ color: var(--muted); text-decoration: none; padding: 11px 14px; border-radius: 14px; font-weight: 500; }}
.nav.on, .nav:hover {{ background: var(--card); color: var(--ink); box-shadow: inset 0 0 0 1px var(--border); }}
.nav.on {{ color: var(--accent); }}
main {{ display: flex; flex-direction: column; gap: 22px; min-width: 0; }}
.top {{ display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }}
.top h1 {{ font-size: 28px; font-weight: 700; }}
.top p {{ color: var(--muted); margin-top: 4px; }}
.search {{ background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 12px 18px; min-width: 260px; color: var(--muted); backdrop-filter: blur(12px); }}
.kpis {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }}
.kpi {{ padding: 20px; display: flex; flex-direction: column; gap: 8px; }}
.kpi .lbl {{ color: var(--muted); font-size: 14px; }}
.kpi b {{ font-size: 30px; font-weight: 700; }}
.kpi .delta {{ font-size: 13px; color: var(--accent); font-weight: 600; }}
.board {{ display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 16px; align-items: start; }}
.col {{ display: flex; flex-direction: column; gap: 12px; }}
.col header {{ display: flex; justify-content: space-between; align-items: center; padding: 4px 6px; font-weight: 600; }}
.col header em {{ font-style: normal; font-size: 13px; color: var(--muted); background: var(--card); border: 1px solid var(--border); border-radius: 999px; padding: 2px 10px; }}
.deal {{ padding: 14px; display: flex; gap: 12px; align-items: center; }}
.av {{ width: 40px; height: 40px; border-radius: 14px; display: grid; place-items: center; background: var(--accent); color: #fff; font-weight: 700; flex-shrink: 0; }}
.dn {{ font-weight: 600; }}
.dv {{ color: var(--muted); font-size: 14px; margin-top: 2px; }}
.foot {{ color: var(--muted); font-size: 13px; text-align: center; padding-bottom: 8px; }}
@media (max-width: 1000px) {{
  .app {{ grid-template-columns: 1fr; }}
  aside.card {{ flex-direction: row; flex-wrap: wrap; }}
  .kpis {{ grid-template-columns: repeat(2, 1fr); }}
  .board {{ grid-template-columns: repeat(2, minmax(0,1fr)); }}
}}
@media (max-width: 600px) {{
  .board, .kpis {{ grid-template-columns: 1fr; }}
  .search {{ min-width: 0; width: 100%; }}
}}
</style>
</head>
<body>
<div class="app">
  <aside class="card">
    <div class="logo">CRM <i>ساده</i></div>
    {nav_html}
  </aside>
  <main>
    <div class="top">
      <div>
        <h1>سلام، امروز ۱۴ سرنخ جدید داری</h1>
        <p>نمای کلی فروش · {html.escape(t['title'])}</p>
      </div>
      <div class="search">جستجوی مشتری یا سرنخ…</div>
    </div>
    <div class="kpis">{kpi_html}</div>
    <div class="board">{cols_html}</div>
    <div class="foot">نمونه‌ی دمو · داده‌ی ساختگی</div>
  </main>
</div>
</body>
</html>
"""


def index(items):
    links = "".join(
        f'<a class="tile" href="theme-{i:02d}-{t["slug"]}.html"><span>{i:02d}</span>{html.escape(t["title"])}'
        f'<i style="background:linear-gradient(135deg,{t["blobs"][0][0]},{t["blobs"][1][0]},{t["blobs"][2][0]})"></i></a>'
        for i, t in items)
    return f"""<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>۱۰ تم گرادیان مش · CRM</title>
<style>
@font-face {{ font-family: "Vazir"; src: url("fonts/Vazirmatn-Regular.ttf"); }}
@font-face {{ font-family: "Vazir"; src: url("fonts/Vazirmatn-Bold.ttf"); font-weight: 700; }}
body {{ margin: 0; font-family: "Vazir", system-ui, sans-serif; min-height: 100vh; background: #f4f4f8; padding: 40px 24px; color: #1d1d2b; }}
h1 {{ margin: 0 0 8px; font-size: 28px; }}
p {{ margin: 0 0 28px; color: #666; }}
.grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }}
.tile {{ position: relative; overflow: hidden; background: #fff; border-radius: 18px; padding: 22px 20px 90px; color: #1d1d2b; text-decoration: none; font-weight: 600; box-shadow: 0 6px 18px rgba(0,0,0,.06); }}
.tile span {{ display: block; color: #888; font-size: 13px; margin-bottom: 4px; }}
.tile i {{ position: absolute; left: 0; right: 0; bottom: 0; height: 70px; }}
.tile:hover {{ transform: translateY(-2px); }}
</style></head>
<body>
<h1>۱۰ نمونه‌ی گرادیان مش برای CRM</h1>
<p>روی هر کارت کلیک کن تا داشبورد کامل آن تم باز شود.</p>
<div class="grid">{links}</div>
</body></html>
"""


def main():
    items = list(enumerate(THEMES, 1))
    for i, t in items:
        with open(os.path.join(HERE, f"theme-{i:02d}-{t['slug']}.html"), "w", encoding="utf-8") as f:
            f.write(page(t))
    with open(os.path.join(HERE, "index.html"), "w", encoding="utf-8") as f:
        f.write(index(items))
    print("generated", len(items), "themes + index")


if __name__ == "__main__":
    main()
