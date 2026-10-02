# -*- coding: utf-8 -*-
"""دک ارائه‌ی MURA به‌صورت PDF تصویری (viewer-proof).
مرحله‌ی ۱: ساخت PDF برداری با ReportLab (متن RTL شکل‌دهی‌شده + تصاویر)
مرحله‌ی ۲: rasterize هر صفحه و ساخت PDF نهایی از تصاویر -> در هیچ نمایشگری بهم نمی‌ریزد."""
import re, arabic_reshaper
from bidi.algorithm import get_display
from reportlab.lib.pagesizes import landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer,
                                Table, TableStyle, PageBreak, Image, KeepTogether)

F = '/home/user/build/fonts/'
IMG = '/home/user/workspace2/build/img/'
for nm, fn in [('Vz', 'Vazirmatn-Regular.ttf'), ('VzM', 'Vazirmatn-Medium.ttf'),
               ('VzS', 'Vazirmatn-SemiBold.ttf'), ('VzB', 'Vazirmatn-Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(nm, F + fn))
pdfmetrics.registerFontFamily('Vz', normal='Vz', bold='VzB', italic='Vz', boldItalic='VzB')

def shape(s):
    return get_display(arabic_reshaper.reshape(s))

INLINE = re.compile(r'(\*\*.+?\*\*)')
def rich(t):
    parts = []
    pos = 0
    for m in INLINE.finditer(t):
        if m.start() > pos:
            parts.append(shape(t[pos:m.start()]))
        parts.append('<b>%s</b>' % shape(m.group(0)[2:-2]))
        pos = m.end()
    if pos < len(t):
        parts.append(shape(t[pos:]))
    return ''.join(parts)

BG    = colors.HexColor('#0b1622')
PANEL = colors.HexColor('#13273c')
BORD  = colors.HexColor('#27455f')
TXT   = colors.HexColor('#d7e2ee')
WHT   = colors.white
TEAL  = colors.HexColor('#7fb3e8')
GRN   = colors.HexColor('#8fd08f')
RED   = colors.HexColor('#ff9d9d')
AMBR  = colors.HexColor('#ffd28a')
NOTE_BG = colors.HexColor('#12351b')
NOTE_BD = colors.HexColor('#3f7d46')

PW, PH = 1024, 576
S = {}
S['k']    = ParagraphStyle('k',  fontName='VzM', fontSize=10.5, leading=15, wordWrap='RTL', alignment=TA_RIGHT, textColor=TEAL, spaceAfter=4)
S['h2']   = ParagraphStyle('h2', fontName='VzB', fontSize=23,  leading=33, wordWrap='RTL', alignment=TA_RIGHT, textColor=WHT, spaceAfter=10)
S['p']    = ParagraphStyle('p',  fontName='Vz',  fontSize=12.5, leading=21, wordWrap='RTL', alignment=TA_RIGHT, textColor=TXT, spaceAfter=5)
S['li']   = ParagraphStyle('li', parent=S['p'], rightIndent=14, bulletIndent=2, spaceAfter=4)
S['cn']   = ParagraphStyle('cn', fontName='VzB', fontSize=24, leading=30, wordWrap='RTL', alignment=TA_RIGHT, textColor=GRN)
S['ct']   = ParagraphStyle('ct', fontName='Vz',  fontSize=10, leading=15.5, wordWrap='RTL', alignment=TA_RIGHT, textColor=colors.HexColor('#a9bdd2'))
S['sn']   = ParagraphStyle('sn', fontName='VzB', fontSize=20, leading=26, wordWrap='RTL', alignment=TA_RIGHT, textColor=TEAL)
S['st']   = ParagraphStyle('st', fontName='Vz',  fontSize=10.5, leading=16, wordWrap='RTL', alignment=TA_RIGHT, textColor=TXT)
S['th']   = ParagraphStyle('th', fontName='VzB', fontSize=11, leading=16, wordWrap='RTL', alignment=TA_RIGHT, textColor=WHT)
S['td']   = ParagraphStyle('td', fontName='Vz',  fontSize=10.5, leading=16, wordWrap='RTL', alignment=TA_RIGHT, textColor=TXT)
S['note'] = ParagraphStyle('note', fontName='Vz', fontSize=11, leading=17.5, wordWrap='RTL', alignment=TA_RIGHT, textColor=colors.HexColor('#cfe8cf'))
S['h3']   = ParagraphStyle('h3', fontName='VzB', fontSize=14, leading=20, wordWrap='RTL', alignment=TA_RIGHT, textColor=WHT, spaceAfter=5)
S['h3n']  = ParagraphStyle('h3n', parent=S['h3'], textColor=RED)

def cards(items):
    cells = []
    for num, txt, col in reversed(items):
        stn = ParagraphStyle('x', parent=S['cn'], textColor=col)
        cells.append([Paragraph(shape(num), stn), Paragraph(rich(txt), S['ct'])])
    t = Table([cells], colWidths=[(PW-80-2*14)/len(cells)]*len(cells))
    st = [('BACKGROUND', (0,0), (-1,-1), PANEL), ('BOX', (0,0), (-1,-1), 0.8, BORD),
          ('INNERGRID', (0,0), (-1,-1), 6, BG),
          ('RIGHTPADDING', (0,0), (-1,-1), 12), ('LEFTPADDING', (0,0), (-1,-1), 12),
          ('TOPPADDING', (0,0), (-1,-1), 10), ('BOTTOMPADDING', (0,0), (-1,-1), 10),
          ('VALIGN', (0,0), (-1,-1), 'TOP')]
    t.setStyle(TableStyle(st))
    return t

def steps(items):
    cells = []
    for n, txt in reversed(items):
        cells.append([Paragraph(shape(n), S['sn']), Paragraph(rich(txt), S['st'])])
    t = Table([cells], colWidths=[(PW-80-3*12)/4]*4)
    t.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), PANEL), ('BOX', (0,0), (-1,-1), 0.8, BORD),
        ('INNERGRID', (0,0), (-1,-1), 6, BG),
        ('RIGHTPADDING', (0,0), (-1,-1), 12), ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 10), ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('VALIGN', (0,0), (-1,-1), 'TOP')]))
    return t

def table(rows, widths=None):
    data = [[Paragraph(rich(c), S['th'] if i == 0 else S['td']) for c in reversed(r)] for i, r in enumerate(rows)]
    n = len(rows[0])
    w = widths or [(PW-80)/n]*n
    t = Table(data, colWidths=w[::-1], repeatRows=1)
    st = [('GRID', (0,0), (-1,-1), 0.7, BORD), ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1d3a52')),
          ('RIGHTPADDING', (0,0), (-1,-1), 9), ('LEFTPADDING', (0,0), (-1,-1), 9),
          ('TOPPADDING', (0,0), (-1,-1), 6), ('BOTTOMPADDING', (0,0), (-1,-1), 6),
          ('VALIGN', (0,0), (-1,-1), 'TOP')]
    t.setStyle(TableStyle(st))
    return t

def note(txt):
    t = Table([[Paragraph(rich(txt), S['note'])]], colWidths=[PW-80])
    t.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,-1), NOTE_BG), ('LINEAFTER', (-1,0), (-1,-1), 4, NOTE_BD),
        ('RIGHTPADDING', (0,0), (-1,-1), 12), ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 8), ('BOTTOMPADDING', (0,0), (-1,-1), 8)]))
    return t

def imgflow(name, w, maxh=None):
    im = Image(IMG + name)
    r = w / float(im.imageWidth)
    if maxh and im.imageHeight * r > maxh:
        r = maxh / float(im.imageHeight)
    im.drawWidth = im.imageWidth * r
    im.drawHeight = im.imageHeight * r
    return im

def split(text_flow, imgname, imgw=330):
    im = imgflow(imgname, imgw)
    t = Table([[im, text_flow]], colWidths=[imgw+16, PW-80-imgw-16])
    t.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('RIGHTPADDING', (0,0), (0,-1), 0), ('LEFTPADDING', (1,0), (1,-1), 0),
        ('RIGHTPADDING', (1,0), (1,-1), 0), ('LEFTPADDING', (0,0), (0,-1), 16)]))
    return t

BGMAP = {}
def slide(story_list, bgimg=None, bgalpha=0.3):
    BGMAP[len(SLIDES)] = (bgimg, bgalpha)
    SLIDES.append(story_list)

SLIDES = []

# ۱ جلد
slide([Paragraph(shape('MURA · سند ارائه · نسخه‌ی ۱٫۰ · اکتبر ۲۰۲۶'), S['k']),
       Paragraph(shape('هدایت‌گر هوشمند تزریق ایمن'), ParagraphStyle('t', parent=S['h2'], fontSize=34, leading=46)),
       Paragraph(rich('اولتراسوند بی‌سیم فرکانس‌بالا + هوش مصنوعی + واقعیت افزوده، برای تزریق فیلر و بوتاکس به صورت'), S['p']),
       Spacer(1, 8),
       Paragraph(rich('این سند تنها شامل محتوای فنی، بالینی و محصول است.'), ParagraphStyle('s', parent=S['p'], textColor=colors.HexColor('#8fa8c0'), fontSize=11))],
      bgimg='cover.jpg', bgalpha=0.34)

# ۲ مسئله
slide([Paragraph(shape('مسئله'), S['k']),
       Paragraph(shape('یک اشتباه کوچک در تزریق، پیامدی برگشت‌ناپذیر دارد'), S['h2']),
       split([Paragraph(rich('اگر فیلر وارد رگ شود، جریان خون قطع می‌شود؛ و اگر آن رگ به چشم راه داشته باشد، بیمار بینایی‌اش را از دست می‌دهد.'), S['li'], bulletText=shape('•')),
              Paragraph(rich('حجم شریان چشمی حدود **۰٫۲ میلی‌لیتر** است؛ پس مقدار بسیار کمی از ماده‌ی تزریقی برای فاجعه کافی است.'), S['li'], bulletText=shape('•')),
              Paragraph(rich('در مرور ۹۳ مورد عارضه‌ی عروقی، **۶۱٪ به کوری** انجامید و **۷۲٪ آن موارد هرگز بهبود نیافتند**.'), S['li'], bulletText=shape('•')),
             ],
            'map3d.jpg'),
      Spacer(1, 8),
      cards([('۱ : ۶,۵۵۸', 'نرخ انسداد عروقی به ازای هر تزریق', RED),
             ('۶۱٪', 'سهم کوری از عوارض عروقی گزارش‌شده', RED)])])
SLIDES[-1].append(note('چرا: کل ارزش این محصول از همین ریسکِ پیشگیری‌پذیر می‌آید، نه از فناوری‌اش.'))

# ۳ گلوگاه
sl = [Paragraph(shape('گلوگاه واقعی'), S['k']),
      Paragraph(shape('مشکل، کمبود دستگاه نیست؛ دشواری کار است'), S['h2']),
      split([Paragraph(rich('اولتراسوند زیبایی امروز برای رسیدن به اتکای بالینی به حدود **۴۰ ساعت آموزش و ۱۰۰ اسکن نظارت‌شده** نیاز دارد.'), S['li'], bulletText=shape('•')),
             Paragraph(rich('در مطالعه‌ی JAAD 2025 تنها پس از همین آموزش، سهم تزریق‌های بدون کبودی به **۷۰٪** رسید، در برابر ۲۸٫۸٪ در گروه شاهد.'), S['li'], bulletText=shape('•')),
             Paragraph(rich('پس گلوگاه واقعی بازار، **نیروی انسانی متخصص** است، نه سخت‌افزار.'), S['li'], bulletText=shape('•'))],
            'scan.jpg'),
      note('چرا: پیام فروش درست ما این است: «هر تزریق‌کننده‌ای را به سطح یک سونوگرافیست باتجربه می‌رسانیم.»')]
slide(sl)

# ۴ راه‌حل
sl = [Paragraph(shape('راه‌حل'), S['k']),
      Paragraph(shape('گردش‌کار MURA در چهار گام'), S['h2']),
      steps([('۱', 'جاروب صورت با پروب بی‌سیم فرکانس‌بالا'), ('۲', 'تفکیک بلادرنگ عروق و لایه‌های بافتی'),
             ('۳', 'بازسازی سه‌بعدی و ثبت روی صورت، بدون نشانگر خارجی'), ('۴', 'خروجی: نمایش تبلت، شابلون چاپی و پرونده‌ی PDF')]),
      Spacer(1, 6), imgflow('workflow.jpg', 640, 235),
      Spacer(1, 6),
      note('چرا: خروجی فقط یک نمایش نیست؛ شابلون چاپی، ارزش را بدون نیاز به هدست وارد اتاق درمان می‌کند.')]
slide(sl)

# ۵ چرا اولتراسوند
sl = [Paragraph(shape('انتخاب مدالیته'), S['k']),
      Paragraph(shape('چرا اولتراسوند، و نه جایگزین‌ها'), S['h2']),
      table([['مدالیته', 'چرا کافی نیست'],
             ['MRI', 'جریان خون را در لحظه‌ی تزریق نشان نمی‌دهد و به دستگاه و نوبت تصویربرداری نیاز دارد.'],
             ['نور مادون قرمز نزدیک', 'تنها وریدهای سطحی را نشان می‌دهد؛ نه شریان را می‌بیند، نه عمق را.'],
             ['سی‌تی‌اسکن', 'اشعه دارد و در کلینیک زیبایی عملی نیست.'],
             ['**اولتراسوند فرکانس‌بالا**', 'بلادرنگ است، اشعه ندارد، در همان کلینیک انجام می‌شود و عمق کافی می‌دهد.']],
            widths=[220, PW-80-220]),
      Spacer(1, 6),
      note('چرا: انتخاب مدالیته درست است؛ ایراد دک پیشین در ادعاهای پیرامون آن بود، نه در خود مدالیته.')]
slide(sl)

# ۶ سخت‌افزار
sl = [Paragraph(shape('سخت‌افزار'), S['k']),
      Paragraph(shape('ما پروب نمی‌سازیم؛ روی پروب موجود سوار می‌شویم'), S['h2']),
      split([Paragraph(rich('دستگاه هدف، **Clarius L20 HD3** است: ۸ تا ۲۰ مگاهرتز، عمق تا ۴ سانتی‌متر، میدان دید ۲۵ میلی‌متر.'), S['li'], bulletText=shape('•')),
             Paragraph(rich('این دستگاه رابط برنامه‌نویسی رسمی و متن‌باز دارد و جریان تصویر را بلادرنگ در اختیار اپلیکیشن ما می‌گذارد.'), S['li'], bulletText=shape('•')),
             Paragraph(rich('یک سنسور حرکتی نُه‌درجه‌آزادی داخل خود پروب است؛ یعنی جهت‌گیری پروب برای بازسازی سه‌بعدی، رایگان به دست می‌آید.'), S['li'], bulletText=shape('•')),
             Paragraph(rich('همین دستگاه در مطالعات بالینی این حوزه به کار رفته است؛ پس اعداد ادبیات، مستقیماً درباره‌ی سخت‌افزار ما هم صادق‌اند.'), S['li'], bulletText=shape('•'))],
            'probe.jpg', 300),
      note('چرا: ساخت پروب، ورود به بازی پرریسک تولید انبوه است؛ ارزش افزوده‌ی ما در نرم‌افزار است، نه در سخت‌افزار.')]
slide(sl)

# ۷ هوش مصنوعی
sl = [Paragraph(shape('هوش مصنوعی'), S['k']),
      Paragraph(shape('مدل چه چیزی را می‌بیند و چه چیزی را نمی‌بیند'), S['h2']),
      split([Paragraph(rich('ورودی مدل، تصویر B-mode همراه با داپلر رنگی و پاور داپلر است؛ خروجی، ماسک عروق و لایه‌هاست.'), S['li'], bulletText=shape('•')),
             Paragraph(rich('مرزهای عروق با یک پیش‌دانسته‌ی فیزیکی (نقشه‌ی «عروق‌نمایی») در تابع هزینه تقویت می‌شود؛ همان ترفندی که خطای مرزی را در کارهای پیشین تا نصف کاهش داد.'), S['li'], bulletText=shape('•')),
             Paragraph(rich('مدل به‌جای فریم‌های مستقل، **پیوستگی زمانی ویدیو** را می‌بیند تا لرزش و حفره‌های لحظه‌ای داپلر پر شود.'), S['li'], bulletText=shape('•')),
             Paragraph(rich('اعصاب در خروجی نیستند: در فرکانس ۸ تا ۲۰ مگاهرتز هیچ شواهدی برای دیدن‌شان وجود ندارد.'), S['li'], bulletText=shape('•'))],
            'segment.jpg'),
      note('چرا: هر قابلیتی که پشتوانه‌ی فیزیکی ندارد، از محصول حذف می‌شود؛ حتی اگر برای فروش جذاب باشد.')]
slide(sl)

# ۸ نقشه و ثبت
sl = [Paragraph(shape('بازسازی و ثبت'), S['k']),
      Paragraph(shape('نقشه‌ی سه‌بعدی عروق، ثبت‌شده روی صورت بیمار'), S['h2']),
      split([Paragraph(rich('با ترکیب سنسور حرکتی پروب و ردیابی بصری، مسیر جاروب بازسازی می‌شود و فریم‌ها در فضای سه‌بعدی می‌نشینند.'), S['li'], bulletText=shape('•')),
             Paragraph(rich('ثبت روی صورت بدون هیچ نشانگر خارجی، با لندمارک‌های چهره انجام می‌شود؛ بنابراین گردش‌کار کلینیک تغییر نمی‌کند.'), S['li'], bulletText=shape('•')),
             Paragraph(rich('نتیجه، یک نقشه‌ی فردی است: همین نقشه، مبنای شابلون چاپی و پرونده‌ی PDF است.'), S['li'], bulletText=shape('•'))],
            'cover.jpg'),
      note('چرا: «فردی‌بودن» نقشه، همان چیزی است که هیچ‌کدام از رقبا با این گردش‌کار سبک ارائه نمی‌دهند.')]
slide(sl)

# ۹ صداقت فنی
sl = [Paragraph(shape('صداقت فنی'), S['k']),
      Paragraph(shape('اعدادی که خودمان اول می‌گوییم'), S['h2']),
      cards([('۰٫۸ تا ۱٫۸', 'میلی‌متر؛ قطر رگ‌های هدف', AMBR),
             ('۲٫۳ تا ۴٫۴', 'میلی‌متر؛ خطای واقعی ثبت در ادبیات علمی', AMBR),
             ('۰٫۶۲۴', 'Dice؛ سقف کنونی تفکیک خودکار عروق کرانیوفاسیال', AMBR)]),
      Spacer(1, 6),
      split([Paragraph(rich('پاسخ ما به این اعداد، ادعای بهتر نیست؛ **نمایش حاشیه‌ی عدم‌قطعیت** است: سامانه صریحاً نشان می‌دهد کجا را نمی‌داند.'), S['p'])],
            'margin.jpg', 300),
      note('چرا: سیستمی که نمی‌داند کجا را نمی‌داند، در پزشکی خطرناک‌تر از نبودنِ سیستم است.')]
slide(sl)

# ۱۰ محصول v1
yes = ['کوپایلوت تبلت برای برنامه‌ریزی پیش از تزریق', 'شابلون چاپی علامت‌گذاری پوست',
       'پرونده‌ی PDF با نقشه و حاشیه‌ی ایمنی', 'حاشیه‌ی عدم‌قطعیت صریح، حدود ۳ میلی‌متر']
no = ['تشخیص اعصاب؛ در این فرکانس پشتوانه ندارد', 'هدست واقعیت افزوده؛ با خطای کنونی ثبت، گمراه‌کننده است',
      'هدایت بلادرنگ سوزن؛ کلاس خطر را بالا می‌برد']
sl = [Paragraph(shape('محصول نسخه‌ی یک'), S['k']),
      Paragraph(shape('چه چیزی هست، و چه چیزی عمداً نیست'), S['h2']),
      Table([[[Paragraph(shape('نیست'), S['h3n'])] + [Paragraph(rich(x), S['li'], bulletText=shape('•')) for x in no],
              [Paragraph(shape('هست'), S['h3'])] + [Paragraph(rich(x), S['li'], bulletText=shape('•')) for x in yes]]],
            colWidths=[(PW-80-14)/2]*2,
            style=TableStyle([('BACKGROUND', (0,0), (-1,-1), PANEL), ('BOX', (0,0), (-1,-1), 0.8, BORD),
                              ('INNERGRID', (0,0), (-1,-1), 6, BG),
                              ('RIGHTPADDING', (0,0), (-1,-1), 12), ('LEFTPADDING', (0,0), (-1,-1), 12),
                              ('TOPPADDING', (0,0), (-1,-1), 9), ('BOTTOMPADDING', (0,0), (-1,-1), 9),
                              ('VALIGN', (0,0), (-1,-1), 'TOP')])),
      Spacer(1, 6), imgflow('tablet.jpg', 430, 235),
      Spacer(1, 5),
      note('چرا: هر «نیست»، یک ریسک حذف‌شده است: ریسک فنی، ریسک ایمنی و ریسک انطباق.')]
slide(sl)

# ۱۱ رقبا
sl = [Paragraph(shape('رقبا'), S['k']),
      Paragraph(shape('همه‌ی تکه‌ها ساخته شده‌اند؛ تلاقی‌شان نه'), S['h2']),
      table([['رقیب', 'چه دارد', 'چه ندارد'],
             ['ARtery3D (بلژیک)', 'نقشه‌ی واقعیت افزوده‌ی عروق', 'لحظه‌ی واقعی؛ نقشه‌اش از MRI می‌آید'],
             ['Clarius T-Mode', 'هوش مصنوعی لایه‌ها روی خود دستگاه', 'نقشه‌ی عروق، ثبت روی صورت، ادعای بالینی'],
             ['MediView XR90', 'واقعیت افزوده با مجوز FDA', 'کاربرد صورت و زیبایی'],
             ['AccuVein', 'نمایش رگ روی پوست', 'شریان و عمق']],
            widths=[200, (PW-80-200)/2, (PW-80-200)/2]),
      Spacer(1, 4),
      Paragraph(rich('استراتژی ما جنگیدن با هیچ‌کدام بر زمین خودش نیست؛ بازی در **تلاقی چهار قابلیت** است: اولتراسوند زنده، نقشه‌ی عروق، ثبت روی صورت و خروجی قابل‌اتکا.'), S['p']),
      note('چرا: نزدیک‌ترین رقیب از سال ۲۰۲۰ در بازار است؛ نقطه‌ضعفش دقیقاً نقطه‌قوت ماست: لحظه‌ی واقعی تزریق.')]
slide(sl)

# ۱۲ نقشه‌ی اجرا
sl = [Paragraph(shape('نقشه‌ی اجرا'), S['k']),
      Paragraph(shape('فازها، با دروازه‌های توقف از پیش نوشته‌شده'), S['h2']),
      split([table([['فاز', 'ماه', 'خروجی قابل راستی‌آزمایی'],
                    ['۰ · پیش‌مطالعه و ریگ', '۰ تا ۳', 'فانتوم با ground truth، پروتکل اخلاق، اولین استریم زنده'],
                    ['۱ · داده، مدل و MVP', '۳ تا ۱۲', 'بیش از ۵۰۰ اسکن، عدد Dice منتشرشده، اپ تبلت، دو کلینیک شریک'],
                    ['۲ · انطباق و مطالعه', '۱۲ تا ۲۴', 'مطالعه‌ی پیامد جایگزین (کبودی) و مقاله‌ی همتا-داوری'],
                    ['۳ · پرونده و مجوز', '۲۴ تا ۳', 'مجوز CE']],
                   widths=[140, 60, 380]),
             Spacer(1, 5),
             Paragraph(rich('معیار توقف: اگر Dice روی رگ‌های دست‌کم ۰٫۸ میلی‌متر زیر ۰٫۵ بماند، مسیر عوض می‌شود.'), S['p'])],
            'phantom.jpg', 300),
      note('چرا: بدترین سناریو، دیر فهمیدن شکست است؛ عددِ از پیش نوشته‌شده، تصمیم احساسی را حذف می‌کند.')]
slide(sl)

# ۱۳ تیم
sl = [Paragraph(shape('تیم'), S['k']),
      Paragraph(shape('سه رشته‌ی مهندسی، به‌علاوه‌ی لنگر بالینی'), S['h2']),
      Paragraph(rich('مهندس یادگیری ماشین و بینایی ماشین'), S['li'], bulletText=shape('•')),
      Paragraph(rich('مهندس موبایل و واقعیت افزوده'), S['li'], bulletText=shape('•')),
      Paragraph(rich('مهندس اولتراسوند و سخت‌افزار'), S['li'], bulletText=shape('•')),
      Paragraph(rich('**شریک بالینی:** پزشک زیبایی با سهام؛ طراح پروتکل، مسئول اعتبار بالینی و پل ارتباطی با کلینیک‌ها'), S['li'], bulletText=shape('•')),
      Spacer(1, 6), imgflow('scan.jpg', 420, 225),
      Spacer(1, 5),
      note('چرا: بدون شریک بالینی، نه پروتکل درست است و نه هیچ پزشکی به خروجی اعتماد می‌کند.')]
slide(sl)

# ۱۴ پایان
slide([Paragraph(shape('پایان'), S['k']),
       Paragraph(shape('پرسش درست، «آیا ممکن است؟» نیست'), S['h2']),
       Paragraph(rich('پرسش درست این است: **«اولین عدد Dice شما روی رگ ۰٫۸ میلی‌متر، کی و با چه پروتکلی گزارش می‌شود؟»**'), S['p']),
       Spacer(1, 6),
       Paragraph(rich('پاسخ ما: ماه ششم، روی فانتوم با ground truth معلوم، با پروتول گزارش استاندارد.'), S['p']),
       Spacer(1, 10),
       Paragraph(rich('این جمله، تفاوت میان یک ایده و یک برنامه‌ی اجرایی است.'), ParagraphStyle('e', parent=S['p'], textColor=colors.HexColor('#8fa8c0'), fontSize=11.5))],
      bgimg='cover.jpg', bgalpha=0.16)

# ---------------------------------------------------------------- ساخت PDF برداری
class Deck(BaseDocTemplate):
    def __init__(self, fn):
        BaseDocTemplate.__init__(self, fn, pagesize=(PW, PH), title='MURA — ارائه',
                                 rightMargin=40, leftMargin=40, topMargin=34, bottomMargin=26)
        fr = Frame(40, 26, PW-80, PH-60, id='s')
        self.addPageTemplates([PageTemplate('all', [fr], onPage=self._bg)])
        self.idx = [0]
    def _bg(self, c, d):
        c.saveState()
        c.setFillColor(BG); c.rect(0, 0, PW, PH, stroke=0, fill=1)
        info = BGMAP.get(d.page-1)
        if info and info[0]:
            c.setFillAlpha(info[1])
            c.drawImage(IMG+info[0], 0, 0, PW, PH, preserveAspectRatio=False, mask=None)
            c.setFillAlpha(1)
        c.restoreState()

story = []
for i, sl in enumerate(SLIDES):
    if i:
        story.append(PageBreak())
    story.extend(sl)
VEC = '/home/user/build/deck_vec.pdf'
Deck(VEC).build(story)
print('vector pages ok')

# ---------------------------------------------------------------- rasterize -> PDF تصویری
import pymupdf
d = pymupdf.open(VEC)
out = pymupdf.open()
for pg in d:
    pix = pg.get_pixmap(dpi=150)
    jpg = '/home/user/build/pg_%02d.jpg' % pg.number
    pix.save(jpg, jpg_quality=88)
    p = out.new_page(width=PW, height=PH)
    p.insert_image(pymupdf.Rect(0, 0, PW, PH), filename=jpg)
FINAL = '/home/user/workspace2/MURA-presentation.pdf'
out.save(FINAL, deflate=True, garbage=3)
print('FINAL', FINAL, out.page_count, 'pages')
