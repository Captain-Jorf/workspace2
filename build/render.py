# -*- coding: utf-8 -*-
"""رندرر فارسی راست‌به‌چپ: markdown ساده -> PDF با ReportLab + وزیرمتن."""
import re, sys, arabic_reshaper
from bidi.algorithm import get_display
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER
from reportlab.lib.units import cm, mm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                Table, TableStyle, PageBreak, KeepTogether, NextPageTemplate)
from reportlab.platypus.tableofcontents import TableOfContents

import os
F = os.environ.get('VZ_FONTS', '/home/user/build/fonts/')
for name, fn in [('Vz','Vazirmatn-Regular.ttf'), ('VzM','Vazirmatn-Medium.ttf'),
                 ('VzS','Vazirmatn-SemiBold.ttf'), ('VzB','Vazirmatn-Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name, F+fn))
pdfmetrics.registerFontFamily('Vz', normal='Vz', bold='VzB', italic='Vz', boldItalic='VzB')

BLUE   = colors.HexColor('#12457c')
BLUE2  = colors.HexColor('#2d6fb0')
GREY   = colors.HexColor('#4a5561')
LINE   = colors.HexColor('#c9d4e0')
TINT   = colors.HexColor('#eef3f9')
WHY_BG = colors.HexColor('#e8f1e8'); WHY_BD = colors.HexColor('#3f7d46')
WRN_BG = colors.HexColor('#fdeeee'); WRN_BD = colors.HexColor('#b03a3a')
TIP_BG = colors.HexColor('#eef4fb'); TIP_BD = colors.HexColor('#2d6fb0')

def _fa(x):
    return str(x).translate(str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹'))

def shape(s):
    return get_display(arabic_reshaper.reshape(s))

INLINE = re.compile(r'(\*\*.+?\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)')

def rich(text):
    """متن با markup ساده -> markup گزارش‌لب با شکل‌دهی RTL."""
    toks, pos = [], 0
    for m in INLINE.finditer(text):
        if m.start() > pos:
            toks.append(('n', text[pos:m.start()]))
        s = m.group(0)
        if s.startswith('**'):   toks.append(('b', s[2:-2]))
        elif s.startswith('`'):  toks.append(('c', s[1:-1]))
        else:
            mm_ = re.match(r'\[([^\]]+)\]\(([^)]+)\)', s)
            toks.append(('l', (mm_.group(1), mm_.group(2))))
        pos = m.end()
    if pos < len(text):
        toks.append(('n', text[pos:]))
    pieces = []
    for k, v in toks:
        if k == 'n':
            lead  = v[:len(v)-len(v.lstrip())]
            trail = v[len(v.rstrip()):]
            core  = v.strip()
            if core: pieces.append((lead, shape(core), trail))
        elif k == 'b':
            pieces.append((' ', '<b>%s</b>' % shape(v), ' '))
        elif k == 'c':
            pieces.append((' ', '<font face="Courier" size="8.5">%s</font>' % shape(v), ' '))
        else:
            t, h = v
            pieces.append((' ', '<link href="%s" color="#0b5cad"><u>%s</u></link>' % (h, shape(t)), ' '))
    return ''.join(l + c + t for l, c, t in pieces)

# ---------------------------------------------------------------- سبک‌ها
S = {}
S['body']  = ParagraphStyle('body',  fontName='Vz',  fontSize=10.2, leading=18.5, wordWrap='RTL', alignment=TA_RIGHT, textColor=colors.HexColor('#1c2530'), spaceAfter=6)
S['h1']    = ParagraphStyle('h1',    fontName='VzB', fontSize=19,   leading=28,   wordWrap='RTL', alignment=TA_RIGHT, textColor=BLUE,  spaceBefore=4, spaceAfter=10)
S['h2']    = ParagraphStyle('h2',    fontName='VzB', fontSize=14,   leading=22,   wordWrap='RTL', alignment=TA_RIGHT, textColor=BLUE2, spaceBefore=14, spaceAfter=7)
S['h3']    = ParagraphStyle('h3',    fontName='VzS', fontSize=12,   leading=19,   wordWrap='RTL', alignment=TA_RIGHT, textColor=GREY,  spaceBefore=10, spaceAfter=5)
S['bul']   = ParagraphStyle('bul',   parent=S['body'], rightIndent=14, bulletIndent=2, spaceAfter=3.5)
S['num']   = ParagraphStyle('num',   parent=S['body'], rightIndent=16, bulletIndent=2, spaceAfter=3.5)
S['cell']  = ParagraphStyle('cell',  fontName='Vz',  fontSize=8.9,  leading=14.5, wordWrap='RTL', alignment=TA_RIGHT, textColor=colors.HexColor('#1c2530'))
S['cellh'] = ParagraphStyle('cellh', fontName='VzB', fontSize=9.2,  leading=14.5, wordWrap='RTL', alignment=TA_RIGHT, textColor=colors.white)
S['why']   = ParagraphStyle('why',   fontName='Vz',  fontSize=10,   leading=18,   wordWrap='RTL', alignment=TA_RIGHT, textColor=colors.HexColor('#22402a'))
S['wrn']   = ParagraphStyle('wrn',   parent=S['why'], textColor=colors.HexColor('#5a1f1f'))
S['tip']   = ParagraphStyle('tip',   parent=S['why'], textColor=colors.HexColor('#173a5e'))
S['covt']  = ParagraphStyle('covt',  fontName='VzB', fontSize=30,   leading=44,   wordWrap='RTL', alignment=TA_CENTER, textColor=BLUE)
S['covs']  = ParagraphStyle('covs',  fontName='VzM', fontSize=14,   leading=24,   wordWrap='RTL', alignment=TA_CENTER, textColor=GREY)
S['covm']  = ParagraphStyle('covm',  fontName='Vz',  fontSize=10.5, leading=18,   wordWrap='RTL', alignment=TA_CENTER, textColor=GREY)
S['toc1']  = ParagraphStyle('toc1',  fontName='VzB', fontSize=11.5, leading=21, wordWrap='RTL', alignment=TA_RIGHT, textColor=BLUE2)
S['toc2']  = ParagraphStyle('toc2',  fontName='Vz',  fontSize=10,  leading=18, wordWrap='RTL', alignment=TA_RIGHT, textColor=GREY, rightIndent=16)
S['foot']  = ParagraphStyle('foot',  fontName='Vz',  fontSize=8,   leading=12, wordWrap='RTL', alignment=TA_RIGHT, textColor=GREY)

def callout(kind, text):
    st, bg, bd = {'why':(S['why'],WHY_BG,WHY_BD), 'wrn':(S['wrn'],WRN_BG,WRN_BD), 'tip':(S['tip'],TIP_BG,TIP_BD)}[kind]
    t = Table([[Paragraph(rich(text), st)]], colWidths=[17*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1), bg),
        ('LINEAFTER',(-1,0),(-1,-1), 3, bd),   # در RTL: نوار تأکید در سمت راست
        ('RIGHTPADDING',(0,0),(-1,-1), 10), ('LEFTPADDING',(0,0),(-1,-1), 10),
        ('TOPPADDING',(0,0),(-1,-1), 7), ('BOTTOMPADDING',(0,0),(-1,-1), 7),
    ]))
    return KeepTogether([Spacer(1,3), t, Spacer(1,7)])

def table(rows):
    data = [[Paragraph(rich(c), S['cellh'] if i == 0 else S['cell']) for c in reversed(r)]
            for i, r in enumerate(rows)]
    n = len(rows[0])
    w = 17*cm / n
    widths = [w]*n
    if n == 2: widths = [6*cm, 11*cm]
    if n == 3: widths = [4.5*cm, 6*cm, 6.5*cm]
    if n == 4: widths = [3.4*cm, 4.6*cm, 4.6*cm, 4.4*cm]
    if n == 5: widths = [3.0*cm, 3.4*cm, 3.4*cm, 3.4*cm, 3.8*cm]
    if n == 6: widths = [2.9*cm, 2.6*cm, 2.7*cm, 2.9*cm, 2.9*cm, 3.0*cm]
    widths = widths[::-1]
    t = Table(data, colWidths=widths, repeatRows=1)
    st = [('GRID',(0,0),(-1,-1),0.5,LINE),
          ('BACKGROUND',(0,0),(-1,0), BLUE2),
          ('VALIGN',(0,0),(-1,-1),'TOP'),
          ('RIGHTPADDING',(0,0),(-1,-1),6), ('LEFTPADDING',(0,0),(-1,-1),6),
          ('TOPPADDING',(0,0),(-1,-1),4.5), ('BOTTOMPADDING',(0,0),(-1,-1),4.5)]
    for i in range(1, len(data)):
        if i % 2 == 0: st.append(('BACKGROUND',(0,i),(-1,i), TINT))
    t.setStyle(TableStyle(st))
    return KeepTogether([Spacer(1,4), t, Spacer(1,9)])

def manual_toc(entries):
    rows=[]
    for lvl, txt, pg in entries:
        stl = S['toc1'] if lvl==0 else S['toc2']
        rows.append([Paragraph(shape(_fa(pg)), ParagraphStyle('pg',parent=stl,alignment=TA_RIGHT)),
                     Paragraph(rich(txt), stl)])
    t=Table(rows, colWidths=[1.4*cm, 15.6*cm])
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),
        ('RIGHTPADDING',(0,0),(-1,-1),2),('LEFTPADDING',(0,0),(-1,-1),2),
        ('TOPPADDING',(0,0),(-1,-1),1.5),('BOTTOMPADDING',(0,0),(-1,-1),1.5),
        ('LINEBELOW',(0,0),(-1,-2),0.3,colors.HexColor('#e2e8f0'))]))
    return t

class Doc(BaseDocTemplate):
    def __init__(self, fn, title):
        BaseDocTemplate.__init__(self, fn, pagesize=A4, title=title, author='MURA',
                                 rightMargin=2*cm, leftMargin=2*cm, topMargin=2.1*cm, bottomMargin=1.9*cm)
        self.title_txt = title
        self.entries = []
        fr = Frame(2*cm, 1.9*cm, A4[0]-4*cm, A4[1]-4*cm, id='n')
        self.addPageTemplates([PageTemplate('all', [fr], onPage=self._deco)])
    def _deco(self, c, d):
        c.saveState()
        c.setStrokeColor(LINE); c.setLineWidth(0.6)
        c.line(2*cm, A4[1]-1.75*cm, A4[0]-2*cm, A4[1]-1.75*cm)
        c.setFont('Vz', 8); c.setFillColor(GREY)
        c.drawRightString(A4[0]-2*cm, A4[1]-1.55*cm, shape(self.title_txt))
        c.drawCentredString(A4[0]/2, 1.35*cm, shape('— %s —' % _fa(d.page)))
        c.setFont('Vz', 7.5)
        c.drawString(2*cm, 1.35*cm, shape('سند داخلی · محرمانه'))
        c.restoreState()
    def afterFlowable(self, fl):
        if isinstance(fl, Paragraph):
            sn = fl.style.name
            if sn == 'h1': self.entries.append((0, fl.getPlainText(), self.page))
            elif sn == 'h2': self.entries.append((1, fl.getPlainText(), self.page))

def build(src_path, out_path, title, toc=None):
    raw = open(src_path, encoding='utf-8').read().split('\n')
    story = []
    i, n = 0, len(raw)
    first_h1 = True
    last_break = True
    while i < n:
        ln = raw[i].rstrip()
        if not ln.strip():
            i += 1; continue
        if ln.startswith('# '):
            if not first_h1 and not last_break: story.append(PageBreak())
            last_break = False
            first_h1 = False
            story.append(Paragraph(rich(ln[2:]), S['h1'])); last_break=False; i += 1; continue
        if ln.startswith('## '):
            story.append(Paragraph(rich(ln[3:]), S['h2'])); last_break=False; i += 1; continue
        if ln.startswith('### '):
            story.append(Paragraph(rich(ln[4:]), S['h3'])); last_break=False; i += 1; continue
        if ln == '---':
            if not last_break: story.append(PageBreak())
            last_break = True; i += 1; continue
        if ln == '{{TOC}}':
            story.append(Spacer(1,4))
            if toc: story.append(manual_toc(toc))
            story.append(PageBreak()); last_break=True; i += 1; continue
        if ln.startswith('> '):
            story.append(callout('why', ln[2:])); last_break=False; i += 1; continue
        if ln.startswith('! '):
            story.append(callout('wrn', ln[2:])); last_break=False; i += 1; continue
        if ln.startswith('* '):
            story.append(callout('tip', ln[2:])); last_break=False; i += 1; continue
        if ln.startswith('|'):
            rows = []
            while i < n and raw[i].strip().startswith('|'):
                cells = [c.strip() for c in raw[i].strip().strip('|').split('|')]
                if not all(set(c) <= set('-: ') for c in cells):
                    rows.append(cells)
                i += 1
            story.append(table(rows)); last_break=False; continue
        m = re.match(r'^-\s+(.*)', ln)
        if m:
            story.append(Paragraph(rich(m.group(1)), S['bul'], bulletText=shape('•'))); last_break=False; i += 1; continue
        m = re.match(r'^(\d+)\.\s+(.*)', ln)
        if m:
            story.append(Paragraph(rich(m.group(2)), S['num'], bulletText=shape(m.group(1)+'.'))); last_break=False; i += 1; continue
        buf = [ln]
        i += 1
        while i < n and raw[i].strip() and not re.match(r'^(#|\||-|\d+\.|>|!|\*|---)', raw[i].strip()):
            buf.append(raw[i].strip()); i += 1
        story.append(Paragraph(rich(' '.join(buf)), S['body'])); last_break=False
    doc = Doc(out_path, title)
    doc.build(story)
    return doc.entries

if __name__ == '__main__':
    import os, pymupdf
    src, out, title = sys.argv[1], sys.argv[2], sys.argv[3]
    toc, tmp = None, out + '.tmp.pdf'
    for it in range(5):
        e = build(src, tmp, title, toc=toc)
        if e == toc: break
        toc = e
    build(src, out, title, toc=toc)
    os.remove(tmp)
    d = pymupdf.open(out)
    print('pages:', d.page_count, '| toc entries:', len(toc or []))
