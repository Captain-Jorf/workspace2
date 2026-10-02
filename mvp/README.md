# MVP — اسکلت کد MURA

این پوشه، استخوان‌بندی اجرایی فاز ۰ و ۱ است؛ همان چیزی که در `research/05-roadmap.md` و `MURA-roadmap.pdf` بخش ۳ توصیف شد.
هیچ‌چیز اینجا ادعا نیست: هر جا کار واقعی به سخت‌افزار یا داده‌ی واقعی نیاز دارد، با `TODO(REAL)` علامت خورده است.

## اصل حاکم

> اول ریگ ضبط/بازپخش، بعد مدل. باگی که فقط حین اسکن زنده دیده می‌شود، بدون replay قابل دیباگ نیست.

## ساختار

```
mvp/
├── README.md                  همین فایل
├── requirements.txt
├── phantom/protocol.md        پروتکل ساخت فانتوم و ضبط ground truth (مطالعه‌ی ۱)
── src/
│   ├── acquisition/
│   │   ├── clarius_cast.py    شنونده‌ی Cast + صف هم‌زمان فریم/متادیتا + منبع جعلی برای توسعه‌ی آفلاین
│   │   └── record_replay.py   ضبط جلسه به دیسک و بازپخش دقیق (ریگ دیباگ)
│   ├── eval/
│   │   ├── metrics.py         Dice / IoU / ASSD پیاده‌سازی مستقل + گزارش تفکیکی
│   │   └── report.py          خروجی جدول مارک‌داون برای «مجموعه‌ی طلایی» و مقاله
│   └── seg/
│       └── train_nnunet.sh    فراخوان استاندارد nnU-Net v2 (baseline پذیرفته‌شده)
└── tests/
    └── test_metrics.py        تست‌های سلامت معیارها (باید همیشه سبز بمانند)
```

## اجرای سریع (بدون پروب)

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r mvp/requirements.txt
python -m mvp.src.acquisition.record_replay --fake --seconds 3 --out data/session_demo
python -m mvp.src.acquisition.record_replay --replay data/session_demo --frames 5
python -m pytest mvp/tests -q
```

## اجرای واقعی (نیازمند پیش‌نیاز)

- لایسنس پژوهشی Clarius + پروب لایسنس‌شده (IP/پورت Cast فقط برای پروب لایسنس‌شده نمایش داده می‌شود)
- شبکه‌ی محلی پایدار؛ اپ Clarius باید روی همان دستگاه اجرا باشد (Cast بدون اپ کلاریوس کار نمی‌کند)
- `TODO(REAL)` داخل `clarius_cast.py` را با bind شدن به سوکت Cast جایگزین کنید

## پروتول گزارش عدد (تعهد ما)

هر عدد Dice که از این مخزن بیرون می‌آید باید با `report.py` و **به تفکیک قطر رگ و عمق** گزارش شود، روی مجموعه‌ی آزمون ثابت (`data/golden/`).
معیار توقف G1: اگر Dice روی رگ‌های ≥۰٫۸ میلی‌متر زیر ۰٫۵ ماند، پروژه pivot می‌کند. این عدد را احساسی تصمیم نمی‌گیریم.
