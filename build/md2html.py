# -*- coding: utf-8 -*-
"""roadmap.md -> HTML تک‌فایلی RTL با فونت embed (مرورگر فارسی را بومی شکل‌دهی می‌کند)."""
import re, base64, html

SRC = '/home/user/workspace2/build/roadmap.md'
OUT = '/home/user/workspace2/MURA-roadmap.html'
FONTS = '/home/user/build/fonts/'

def b64(name):
    return base64.b64encode(open(FONTS + name, 'rb').read()).decode()

FACES = ''.join("@font-face{font-family:'Vazir';font-weight:%d;src:url(data:font/ttf;base64,%s) format('truetype');}" % (w, b64(f))
                for w, f in [(400, 'Vazirmatn-Regular.ttf'), (600, 'Vazirmatn-SemiBold.ttf'), (700, 'Vazirmatn-Bold.ttf')])

CSS = """
*{box-sizing:border-box}
html{direction:rtl}
body{font-family:'Vazir',Tahoma,sans-serif;font-size:15px;line-height:2;color:#1c2530;
     max-width:900px;margin:0 auto;padding:48px 28px 90px;background:#fbfcfe}
h1{font-size:30px;color:#12457c;border-bottom:3px solid #12457c;padding-bottom:10px;margin:56px 0 18px;page-break-before:always}
h1.first{page-break-before:auto;margin-top:0}
h2{font-size:22px;color:#2d6fb0;margin:34px 0 12px}
h3{font-size:18px;color:#4a5561;margin:24px 0 8px}
p{margin:10px 0}
a{color:#0b5cad}
table{border-collapse:collapse;width:100%;margin:16px 0;font-size:13.5px;line-height:1.8;page-break-inside:auto}
th{background:#2d6fb0;color:#fff;font-weight:700}
th,td{border:1px solid #c9d4e0;padding:8px 10px;text-align:right;vertical-align:top}
tr:nth-child(even) td{background:#eef3f9}
ul{padding-right:22px;margin:8px 0}
li{margin:5px 0}
.box{border-radius:6px;padding:12px 16px;margin:14px 0;page-break-inside:avoid}
.why{background:#e8f1e8;border-right:5px solid #3f7d46;color:#22402a}
.wrn{background:#fdeeee;border-right:5px solid #b03a3a;color:#5a1f1f}
.tip{background:#eef4fb;border-right:5px solid #2d6fb0;color:#173a5e}
.toc{background:#fff;border:1px solid #c9d4e0;border-radius:8px;padding:18px 26px;margin:24px 0}
.toc a{text-decoration:none;color:#2d6fb0}
.toc .l1{font-weight:700;margin-top:10px}
.toc .l2{padding-right:22px;font-size:14px}
.cover{background:#12457c;color:#fff;border-radius:10px;padding:40px 36px;margin-bottom:30px}
.cover h1{color:#fff;border:none;margin:0 0 10px;page-break-before:auto}
.cover p{color:#dce7f3}
code{background:#eef1f5;padding:1px 6px;border-radius:4px;font-size:13px}
@media print{
  body{max-width:none;padding:0;font-size:12.5px}
  h1{page-break-before:always} h1.first{page-break-before:auto}
  .box,table{page-break-inside:avoid}
  a{color:#0b5cad;text-decoration:none}
}
"""

INLINE = re.compile(r'(\*\*.+?\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)')

def inline(t):
    t = html.escape(t, quote=False)
    def rep(m):
        s = m.group(0)
        if s.startswith('**'): return '<strong>%s</strong>' % html.escape(s[2:-2], quote=False)
        if s.startswith('`'):  return '<code>%s</code>' % html.escape(s[1:-1], quote=False)
        mm = re.match(r'\[([^\]]+)\]\(([^)]+)\)', s)
        return '<a href="%s">%s</a>' % (mm.group(2), html.escape(mm.group(1), quote=False))
    return INLINE.sub(rep, t)

def main():
    raw = open(SRC, encoding='utf-8').read().split('\n')
    out, toc, hid = [], [], [0]
    def anchor(t):
        hid[0] += 1
        return 's%d' % hid[0]
    i, n = 0, len(raw)
    first_h1 = True
    while i < n:
        ln = raw[i].rstrip()
        if not ln.strip():
            i += 1; continue
        if ln.startswith('# '):
            a = anchor(ln[2:]); toc.append((1, ln[2:], a))
            cls = ' class="first"' if first_h1 else ''
            out.append('<h1%s id="%s">%s</h1>' % (cls, a, inline(ln[2:])))
            first_h1 = False; i += 1; continue
        if ln.startswith('## '):
            a = anchor(ln[3:]); toc.append((2, ln[3:], a))
            out.append('<h2 id="%s">%s</h2>' % (a, inline(ln[3:]))); i += 1; continue
        if ln.startswith('### '):
            out.append('<h3>%s</h3>' % inline(ln[4:])); i += 1; continue
        if ln == '---':
            i += 1; continue
        if ln == '{{TOC}}':
            out.append('{{TOC}}'); i += 1; continue
        if ln.startswith('> '):
            out.append('<div class="box why">%s</div>' % inline(ln[2:])); i += 1; continue
        if ln.startswith('! '):
            out.append('<div class="box wrn">%s</div>' % inline(ln[2:])); i += 1; continue
        if ln.startswith('* '):
            out.append('<div class="box tip">%s</div>' % inline(ln[2:])); i += 1; continue
        if ln.startswith('|'):
            rows = []
            while i < n and raw[i].strip().startswith('|'):
                cells = [c.strip() for c in raw[i].strip().strip('|').split('|')]
                if not all(set(c) <= set('-: ') for c in cells):
                    rows.append(cells)
                i += 1
            h = '<table><thead><tr>%s</tr></thead><tbody>' % ''.join('<th>%s</th>' % inline(c) for c in rows[0])
            for r in rows[1:]:
                h += '<tr>%s</tr>' % ''.join('<td>%s</td>' % inline(c) for c in r)
            out.append(h + '</tbody></table>'); continue
        m = re.match(r'^-\s+(.*)', ln)
        if m:
            buf = [m.group(1)]; i += 1
            while i < n and raw[i].startswith('  '):
                buf.append(raw[i].strip()); i += 1
            out.append('<li>%s</li>' % inline(' '.join(buf))); continue
        m = re.match(r'^(\d+)\.\s+(.*)', ln)
        if m:
            out.append('<li><strong>%s)</strong> %s</li>' % (m.group(1), inline(m.group(2)))); i += 1; continue
        buf = [ln]; i += 1
        while i < n and raw[i].strip() and not re.match(r'^(#|\||-|\d+\.|>|!|\*|---)', raw[i].strip()):
            buf.append(raw[i].strip()); i += 1
        out.append('<p>%s</p>' % inline(' '.join(buf)))
    body = '\n'.join(out)
    toc_html = '<div class="toc"><strong>فهرست مطالب</strong>' + ''.join(
        '<div class="l%d"><a href="#%s">%s</a></div>' % (lv, a, html.escape(t, quote=False)) for lv, t, a in toc) + '</div>'
    body = body.replace('{{TOC}}', toc_html)
    doc = """<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>نقشه‌ی راه ساخت MURA</title><style>%s%s</style></head><body>
<div class="cover"><h1 class="first">نقشه‌ی راه ساخت MURA</h1>
<p>هدایت‌گر هوشمند تزریق ایمن · اولتراسوند بی‌سیم فرکانس‌بالا + هوش مصنوعی + واقعیت افزوده</p>
<p>نسخه‌ی ۱٫۱ — ۲ اکتبر ۲۰۲۶ · سند اجرایی، هر بخش با کادر «چرا» · ویراسته</p></div>
%s
</body></html>""" % (FACES, CSS, body)
    open(OUT, 'w', encoding='utf-8').write(doc)
    print('written', OUT, len(doc), 'bytes')

main()
