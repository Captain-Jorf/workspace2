# -*- coding: utf-8 -*-
"""دک ارائه‌ی MURA — نسخه‌ی ۲
بدون محتوای مالی و حقوقی، با تصاویر زیاد، متن فارسی ویراسته.
خروجی: یک فایل HTML تک‌فایلی (فونت و تصاویر embed شده)."""
import base64, os

IMG = '/home/user/build/img/'
FONTS = '/home/user/build/fonts/'
OUT = '/home/user/workspace2/MURA-presentation.html'

def b64f(path):
    return base64.b64encode(open(path, 'rb').read()).decode()

FACES = ''.join("@font-face{font-family:'Vazir';font-weight:%d;src:url(data:font/ttf;base64,%s) format('truetype');}" % (w, b64f(FONTS + f))
                for w, f in [(400, 'Vazirmatn-Regular.ttf'), (600, 'Vazirmatn-SemiBold.ttf'), (700, 'Vazirmatn-Bold.ttf')])

def img(name):
    return 'data:image/jpeg;base64,' + b64f(IMG + name)

CSS = """
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;direction:rtl;font-family:'Vazir',Tahoma,sans-serif;background:#0b1622}
.slide{display:none;position:absolute;inset:0;padding:5vh 6vw 7vh;color:#e8eef5;overflow:hidden}
.slide.on{display:flex;flex-direction:column;justify-content:center}
.split{display:flex;gap:44px;align-items:center}
.split .txt{flex:1.15}
.split .pic{flex:.85}
.split .pic img,.full img{width:100%;border-radius:14px;border:1px solid #27455f;box-shadow:0 12px 40px rgba(0,0,0,.45)}
.k{font-size:14px;letter-spacing:1px;color:#7fb3e8;margin-bottom:12px}
h1{font-size:50px;line-height:1.4;color:#fff;margin-bottom:16px}
h2{font-size:35px;line-height:1.45;color:#fff;margin-bottom:22px}
p,li{font-size:21px;line-height:2;color:#d7e2ee}
ul{padding-right:28px}
li{margin:9px 0}
strong{color:#fff}
.row{display:flex;gap:26px;flex-wrap:wrap;margin:16px 0}
.card{flex:1;min-width:200px;background:#13273c;border:1px solid #27455f;border-radius:12px;padding:20px 22px}
.card .n{font-size:38px;font-weight:700;color:#8fd08f;line-height:1.3}
.card .t{font-size:16.5px;color:#a9bdd2;margin-top:6px;line-height:1.7}
.bad{color:#ff9d9d}.warn{color:#ffd28a}
.note{margin-top:22px;padding:13px 18px;background:#12351b;border-right:5px solid #3f7d46;border-radius:8px;font-size:18px;line-height:1.9;color:#cfe8cf}
table{border-collapse:collapse;width:100%;margin:12px 0;font-size:18.5px}
th,td{border:1px solid #2c4a66;padding:9px 13px;text-align:right;color:#d7e2ee;line-height:1.8}
th{background:#1d3a52;color:#fff}
.steps{display:flex;gap:18px;margin:14px 0}
.step{flex:1;background:#13273c;border:1px solid #27455f;border-radius:12px;padding:16px 18px}
.step .i{font-size:30px;font-weight:700;color:#7fb3e8}
.step .t{font-size:17.5px;line-height:1.8;color:#d7e2ee;margin-top:6px}
.coverbg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.34}
.coverbg.dim{opacity:.16}
.ontop{position:relative}
.two{display:flex;gap:26px}
.two>div{flex:1;background:#13273c;border:1px solid #27455f;border-radius:12px;padding:18px 22px}
.two h3{font-size:22px;color:#fff;margin-bottom:10px}
.two .no h3{color:#ff9d9d}
.bar{position:fixed;bottom:0;right:0;height:5px;background:#3f7d46;z-index:9}
.num{position:fixed;bottom:12px;left:24px;font-size:14px;color:#5d7a99;z-index:9}
.hint{position:fixed;bottom:12px;right:24px;font-size:13px;color:#40607f;z-index:9}
@media print{
  .slide{position:static;display:flex!important;page-break-after:always;height:100vh}
  .bar,.num,.hint{display:none}
}
"""

SL = []
def S(body, note=None):
    SL.append((body, note))

# ۱ ------------------------------------------------------------- جلد
S('<div class="coverbg ontop"></div><div class="ontop">'
  '<div class="k">MURA · سند ارائه · نسخه‌ی ۱٫۰ · اکتبر ۲۰۲۶</div>'
  '<h1>هدایت‌گر هوشمند تزریق ایمن</h1>'
  '<p>اولتراسوند بی‌سیم فرکانس‌بالا + هوش مصنوعی + واقعیت افزوده، برای تزریق فیلر و بوتاکس به صورت</p>'
  '<p style="margin-top:14px;color:#8fa8c0;font-size:18px">این سند تنها شامل محتوای فنی، بالینی و محصول است.</p></div>')

# ۲ ------------------------------------------------------------- مسئله
S('<div class="split"><div class="txt">'
  '<div class="k">مسئله</div><h2>یک اشتباه کوچک در تزریق، پیامدی برگشت‌ناپذیر دارد</h2>'
  '<ul><li>اگر فیلر وارد رگ شود، جریان خون قطع می‌شود؛ و اگر آن رگ به چشم راه داشته باشد، بیمار بینایی‌اش را از دست می‌دهد.</li>'
  '<li>حجم شریان چشمی حدود <strong>۰٫۲ میلی‌لیتر</strong> است؛ پس مقدار بسیار کمی از ماده‌ی تزریقی برای فاجعه کافی است.</li>'
  '<li>در مرور ۹۳ مورد عارضه‌ی عروقی، <strong>۶۱٪ به کوری</strong> انجامید و <strong>۷۲٪ آن موارد هرگز بهبود نیافتند</strong>.</li></ul>'
  '<div class="row"><div class="card"><div class="n bad">۱ : ۶,۵۵۸</div><div class="t">نرخ انسداد عروقی به ازای هر تزریق</div></div>'
  '<div class="card"><div class="n bad">۶۱٪</div><div class="t">سهم کوری از عوارض عروقی گزارش‌شده</div></div></div>'
  '</div><div class="pic"><img src="{{map3d}}" alt=""></div></div>',
  'کل ارزش این محصول از همین ریسکِ پیشگیری‌پذیر می‌آید، نه از فناوری‌اش.')

# ۳ ------------------------------------------------------------- گلوگاه
S('<div class="split"><div class="txt">'
  '<div class="k">گلوگاه واقعی</div><h2>مشکل، کمبود دستگاه نیست؛ دشواری کار است</h2>'
  '<ul><li>اولتراسوند زیبایی امروز برای رسیدن به اتکای بالینی به حدود <strong>۴۰ ساعت آموزش و ۱۰۰ اسکن نظارت‌شده</strong> نیاز دارد.</li>'
  '<li>در مطالعه‌ی JAAD 2025 تنها پس از همین آموزش، سهم تزریق‌های بدون کبودی به <strong>۷۰٪</strong> رسید، در برابر ۲۸٫۸٪ در گروه شاهد.</li>'
  '<li>پس گلوگاه واقعی بازار، <strong>نیروی انسانی متخصص</strong> است، نه سخت‌افزار.</li></ul>'
  '</div><div class="pic"><img src="{{scan}}" alt=""></div></div>',
  'پیام فروش درست ما این است: «هر تزریق‌کننده‌ای را به سطح یک سونوگرافیست باتجربه می‌رسانیم.»')

# ۴ ------------------------------------------------------------- راه‌حل
S('<div class="k">راه‌حل</div><h2>گردش‌کار MURA در چهار گام</h2>'
  '<div class="steps">'
  '<div class="step"><div class="i">۱</div><div class="t">جاروب صورت با پروب بی‌سیم فرکانس‌بالا</div></div>'
  '<div class="step"><div class="i">۲</div><div class="t">تفکیک بلادرنگ عروق و لایه‌های بافتی</div></div>'
  '<div class="step"><div class="i">۳</div><div class="t">بازسازی سه‌بعدی و ثبت روی صورت، بدون نشانگر خارجی</div></div>'
  '<div class="step"><div class="i">۴</div><div class="t">خروجی: نمایش تبلت، شابلون چاپی و پرونده‌ی PDF</div></div></div>'
  '<div class="full"><img src="{{workflow}}" alt=""></div>',
  'خروجی فقط یک نمایش نیست؛ شابلون چاپی، ارزش را بدون نیاز به هدست وارد اتاق درمان می‌کند.')

# ۵ ------------------------------------------------------------- چرا اولتراسوند
S('<div class="k">انتخاب مدالیته</div><h2>چرا اولتراسوند، و نه جایگزین‌ها</h2>'
  '<table><tr><th>مدالیته</th><th>چرا کافی نیست</th></tr>'
  '<tr><td>MRI</td><td>جریان خون را در لحظه‌ی تزریق نشان نمی‌دهد و به دستگاه و نوبت تصویربرداری نیاز دارد.</td></tr>'
  '<tr><td>نور مادون قرمز نزدیک</td><td>تنها وریدهای سطحی را نشان می‌دهد؛ نه شریان را می‌بیند، نه عمق را.</td></tr>'
  '<tr><td>سی‌تی‌اسکن</td><td>اشعه دارد و در کلینیک زیبایی عملی نیست.</td></tr>'
  '<tr><td><strong>اولتراسوند فرکانس‌بالا</strong></td><td>بلادرنگ است، اشعه ندارد، در همان کلینیک انجام می‌شود و عمق کافی می‌دهد.</td></tr></table>',
  'انتخاب مدالیته درست است؛ ایراد دک پیشین در ادعاهای پیرامون آن بود، نه در خود مدالیته.')

# ۶ ------------------------------------------------------------- سخت‌افزار
S('<div class="split"><div class="txt">'
  '<div class="k">سخت‌افزار</div><h2>ما پروب نمی‌سازیم؛ روی پروب موجود سوار می‌شویم</h2>'
  '<ul><li>دستگاه هدف، <strong>Clarius L20 HD3</strong> است: ۸ تا ۲۰ مگاهرتز، عمق تا ۴ سانتی‌متر، میدان دید ۲۵ میلی‌متر.</li>'
  '<li>این دستگاه رابط برنامه‌نویسی رسمی و متن‌باز دارد و جریان تصویر را بلادرنگ در اختیار اپلیکیشن ما می‌گذارد.</li>'
  '<li>یک سنسور حرکتی نُه‌درجه‌آزادی داخل خود پروب است؛ یعنی جهت‌گیری پروب برای بازسازی سه‌بعدی، رایگان به دست می‌آید.</li>'
  '<li>همین دستگاه در مطالعات بالینی این حوزه به کار رفته است؛ پس اعداد ادبیات، مستقیماً درباره‌ی سخت‌افزار ما هم صادق‌اند.</li></ul>'
  '</div><div class="pic"><img src="{{probe}}" alt=""></div></div>',
  'ساخت پروب، ورود به بازی پرریسک تولید انبوه است؛ ارزش افزوده‌ی ما در نرم‌افزار است، نه در سخت‌افزار.')

# ۷ ------------------------------------------------------------- هوش مصنوعی
S('<div class="split"><div class="txt">'
  '<div class="k">هوش مصنوعی</div><h2>مدل چه چیزی را می‌بیند و چه چیزی را نمی‌بیند</h2>'
  '<ul><li>ورودی مدل، تصویر B-mode همراه با داپلر رنگی و پاور داپلر است؛ خروجی، ماسک عروق و لایه‌هاست.</li>'
  '<li>مرزهای عروق با یک پیش‌دانسته‌ی فیزیکی (نقشه‌ی «عروق‌نمایی») در تابع هزینه تقویت می‌شود؛ همان ترفندی که خطای مرزی را در کارهای پیشین تا نصف کاهش داد.</li>'
  '<li>مدل به‌جای فریم‌های مستقل، <strong>پیوستگی زمانی ویدیو</strong> را می‌بیند تا لرزش و حفره‌های لحظه‌ای داپلر پر شود.</li>'
  '<li>اعصاب در خروجی نیستند: در فرکانس ۸ تا ۲۰ مگاهرتز هیچ شواهدی برای دیدن‌شان وجود ندارد.</li></ul>'
  '</div><div class="pic"><img src="{{segment}}" alt=""></div></div>',
  'هر قابلیتی که پشتوانه‌ی فیزیکی ندارد، از محصول حذف می‌شود؛ حتی اگر برای فروش جذاب باشد.')

# ۸ ------------------------------------------------------------- نقشه و ثبت
S('<div class="split"><div class="txt">'
  '<div class="k">بازسازی و ثبت</div><h2>نقشه‌ی سه‌بعدی عروق، ثبت‌شده روی صورت بیمار</h2>'
  '<ul><li>با ترکیب سنسور حرکتی پروب و ردیابی بصری، مسیر جاروب بازسازی می‌شود و فریم‌ها در فضای سه‌بعدی می‌نشینند.</li>'
  '<li>ثبت روی صورت بدون هیچ نشانگر خارجی، با لندمارک‌های چهره انجام می‌شود؛ بنابراین گردش‌کار کلینیک تغییر نمی‌کند.</li>'
  '<li>نتیجه، یک نقشه‌ی فردی است: همین نقشه، مبنای شابلون چاپی و پرونده‌ی PDF است.</li></ul>'
  '</div><div class="pic"><img src="{{cover}}" alt=""></div></div>',
  '«فردی‌بودن» نقشه، همان چیزی است که هیچ‌کدام از رقبا با این گردش‌کار سبک ارائه نمی‌دهند.')

# ۹ ------------------------------------------------------------- صداقت فنی
S('<div class="split"><div class="txt">'
  '<div class="k">صداقت فنی</div><h2>اعدادی که خودمان اول می‌گوییم</h2>'
  '<div class="row">'
  '<div class="card"><div class="n warn">۰٫۸ تا ۱٫۸</div><div class="t">میلی‌متر؛ قطر رگ‌های هدف</div></div>'
  '<div class="card"><div class="n warn">۲٫۳ تا ۴٫۴</div><div class="t">میلی‌متر؛ خطای واقعی ثبت در ادبیات علمی</div></div>'
  '<div class="card"><div class="n warn">۰٫۶۲۴</div><div class="t">Dice؛ سقف کنونی تفکیک خودکار عروق کرانیوفاسیال</div></div></div>'
  '<p>پاسخ ما به این اعداد، ادعای بهتر نیست؛ <strong>نمایش حاشیه‌ی عدم‌قطعیت</strong> است: سامانه صریحاً نشان می‌دهد کجا را نمی‌داند.</p>'
  '</div><div class="pic"><img src="{{margin}}" alt=""></div></div>',
  'سیستمی که نمی‌داند کجا را نمی‌داند، در پزشکی خطرناک‌تر از نبودنِ سیستم است.')

# ۱۰ ------------------------------------------------------------- محصول v1
S('<div class="k">محصول نسخه‌ی یک</div><h2>چه چیزی هست، و چه چیزی عمداً نیست</h2>'
  '<div class="two"><div><h3>هست</h3><ul>'
  '<li>کوپایلوت تبلت برای برنامه‌ریزی پیش از تزریق</li>'
  '<li>شابلون چاپی علامت‌گذاری پوست</li>'
  '<li>پرونده‌ی PDF با نقشه و حاشیه‌ی ایمنی</li>'
  '<li>حاشیه‌ی عدم‌قطعیت صریح، حدود ۳ میلی‌متر</li></ul></div>'
  '<div class="no"><h3>نیست</h3><ul>'
  '<li>تشخیص اعصاب؛ در این فرکانس پشتوانه ندارد</li>'
  '<li>هدست واقعیت افزوده؛ با خطای کنونی ثبت، گمراه‌کننده است</li>'
  '<li>هدایت بلادرنگ سوزن؛ کلاس خطر را بالا می‌برد</li></ul></div></div>'
  '<div class="full" style="margin-top:18px"><img src="{{tablet}}" alt=""></div>',
  'هر «نیست»، یک ریسک حذف‌شده است: ریسک فنی، ریسک ایمنی و ریسک انطباق.')

# ۱۱ ------------------------------------------------------------- رقبا
S('<div class="k">رقبا</div><h2>همه‌ی تکه‌ها ساخته شده‌اند؛ تلاقی‌شان نه</h2>'
  '<table><tr><th>رقیب</th><th>چه دارد</th><th>چه ندارد</th></tr>'
  '<tr><td>ARtery3D (بلژیک)</td><td>نقشه‌ی واقعیت افزوده‌ی عروق</td><td>لحظه‌ی واقعی؛ نقشه‌اش از MRI می‌آید</td></tr>'
  '<tr><td>Clarius T-Mode</td><td>هوش مصنوعی لایه‌ها روی خود دستگاه</td><td>نقشه‌ی عروق، ثبت روی صورت، ادعای بالینی</td></tr>'
  '<tr><td>MediView XR90</td><td>واقعیت افزوده با مجوز FDA</td><td>کاربرد صورت و زیبایی</td></tr>'
  '<tr><td>AccuVein</td><td>نمایش رگ روی پوست</td><td>شریان و عمق</td></tr></table>'
  '<p>استراتژی ما جنگیدن با هیچ‌کدام بر زمین خودش نیست؛ بازی در <strong>تلاقی چهار قابلیت</strong> است: اولتراسوند زنده، نقشه‌ی عروق، ثبت روی صورت و خروجی قابل‌اتکا.</p>',
  'نزدیک‌ترین رقیب از سال ۲۰۲۰ در بازار است؛ نقطه‌ضعفش دقیقاً نقطه‌قوت ماست: لحظه‌ی واقعی تزریق.')

# ۱۲ ------------------------------------------------------------- نقشه‌ی اجرا
S('<div class="split"><div class="txt">'
  '<div class="k">نقشه‌ی اجرا</div><h2>فازها، با دروازه‌های توقف از پیش نوشته‌شده</h2>'
  '<table><tr><th>فاز</th><th>ماه</th><th>خروجی قابل راستی‌آزمایی</th></tr>'
  '<tr><td>۰ · پیش‌مطالعه و ریگ</td><td>۰ تا ۳</td><td>فانتوم با ground truth، پروتکل اخلاق، اولین استریم زنده</td></tr>'
  '<tr><td>۱ · داده، مدل و MVP</td><td>۳ تا ۱۲</td><td>بیش از ۵۰۰ اسکن، عدد Dice منتشرشده، اپ تبلت، دو کلینیک شریک</td></tr>'
  '<tr><td>۲ · انطباق و مطالعه</td><td>۱۲ تا ۲۴</td><td>مطالعه‌ی پیامد جایگزین (کبودی) و مقاله‌ی همتا-داوری</td></tr>'
  '<tr><td>۳ · پرونده و مجوز</td><td>۲۴ تا ۳۳</td><td>مجوز CE</td></tr></table>'
  '<p>معیار توقف: اگر Dice روی رگ‌های دست‌کم ۰٫۸ میلی‌متر زیر ۰٫۵ بماند، مسیر عوض می‌شود.</p>'
  '</div><div class="pic"><img src="{{phantom}}" alt=""></div></div>',
  'بدترین سناریو، دیر فهمیدن شکست است؛ عددِ از پیش نوشته‌شده، تصمیم احساسی را حذف می‌کند.')

# ۱۳ ------------------------------------------------------------- تیم
S('<div class="k">تیم</div><h2>سه رشته‌ی مهندسی، به‌علاوه‌ی لنگر بالینی</h2>'
  '<ul><li>مهندس یادگیری ماشین و بینایی ماشین</li>'
  '<li>مهندس موبایل و واقعیت افزوده</li>'
  '<li>مهندس اولتراسوند و سخت‌افزار</li>'
  '<li><strong>شریک بالینی:</strong> پزشک زیبایی با سهام؛ طراح پروتکل، مسئول اعتبار بالینی و پل ارتباطی با کلینیک‌ها</li></ul>',
  'بدون شریک بالینی، نه پروتکل درست است و نه هیچ پزشکی به خروجی اعتماد می‌کند.')

# ۱۴ ------------------------------------------------------------- پایان
S('<div class="coverbg dim ontop"></div><div class="ontop">'
  '<div class="k">پایان</div><h2>پرسش درست، «آیا ممکن است؟» نیست</h2>'
  '<p>پرسش درست این است: <strong>«اولین عدد Dice شما روی رگ ۰٫۸ میلی‌متر، کی و با چه پروتکلی گزارش می‌شود؟»</strong></p>'
  '<p style="margin-top:16px">پاسخ ما: ماه ششم، روی فانتوم با ground truth معلوم، با پروتول گزارش استاندارد.</p>'
  '<p style="margin-top:26px;color:#8fa8c0;font-size:18px">این جمله، تفاوت میان یک ایده و یک برنامه‌ی اجرایی است.</p></div>')

# ---------------------------------------------------------------- ساخت
html_slides = []
for i, (body, note) in enumerate(SL):
    inner = body
    for key in ('cover', 'map3d', 'scan', 'workflow', 'probe', 'segment', 'margin', 'tablet', 'phantom'):
        inner = inner.replace('{{%s}}' % key, img(key + '.jpg'))
    if note:
        inner += '<div class="note"><strong>چرا: </strong>%s</div>' % note
    html_slides.append('<section class="slide%s">%s</section>' % (' on' if i == 0 else '', inner))

JS = """
var i=0,ss=document.querySelectorAll('.slide');
function go(n){i=Math.max(0,Math.min(ss.length-1,n));
 for(var j=0;j<ss.length;j++)ss[j].classList.toggle('on',j===i);
 document.getElementById('bar').style.width=(100*(i+1)/ss.length)+'%';
 document.getElementById('num').textContent=(i+1)+' / '+ss.length;}
document.addEventListener('keydown',function(e){
 if(e.key==='ArrowLeft'||e.key==='PageDown'||e.key===' ')go(i+1);
 else if(e.key==='ArrowRight'||e.key==='PageUp')go(i-1);
 else if(e.key==='Home')go(0);else if(e.key==='End')go(ss.length-1);
 else if(e.key==='f'||e.key==='F'){(document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen());}});
document.addEventListener('click',function(){go(i+1);});
go(0);
"""

doc = """<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MURA — ارائه</title><style>%s%s</style></head><body>
%s
<div class="bar" id="bar"></div><div class="num" id="num"></div>
<div class="hint">کلیدهای جهت یا Space برای جابه‌جایی · F برای تمام‌صفحه</div>
<script>%s</script></body></html>""" % (FACES, CSS, '\n'.join(html_slides), JS)
open(OUT, 'w', encoding='utf-8').write(doc)
print('written', OUT, round(len(doc) / 1e6, 2), 'MB,', len(SL), 'slides')
