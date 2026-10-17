// پنج کسب‌وکار نمونه (طبق docs/sample-businesses.md). هر کدام مراحل فروش، فیلدهای اختصاصی و منبع آشنایی دارد.
// stage: amount = مبلغ الزامی است؛ won = موفق (بسته)؛ lost = منصرف (بسته).

export const BUSINESSES = {
  parts: {
    key: 'parts',
    title: 'پخش عمده‌ی لوازم یدکی خودرو',
    short: 'لوازم یدکی',
    description: 'فروش عمده به تعمیرگاه و فروشگاه قطعه',
    nameStyle: 'company',
    stages: [
      { label: 'اطلاعیه‌ی جدید' },
      { label: 'لیست قیمت ارسال شد' },
      { label: 'پیش‌فاکتور', amount: true },
      { label: 'فاکتور صادر شد', amount: true },
      { label: 'وصول شد', amount: true, won: true }
    ],
    sources: ['معرفی دوستان', 'بازدید حضوری', 'تماس ورودی', 'وب‌سایت', 'اینستاگرام'],
    fields: [
      { key: 'city', label: 'شهر', kind: 'text' },
      { key: 'creditLimit', label: 'سقف اعتبار (تومان)', kind: 'money' },
      { key: 'debt', label: 'مانده‌ی بدهی (تومان)', kind: 'money' },
      { key: 'payment', label: 'روش پرداخت', kind: 'select', options: ['نقد', 'چک', '۳۰ روزه'] }
    ],
    items: ['ترمز جلو', 'فیلتر روغن', 'لنت ترمز', 'روغن موتور ۵W30', 'تسمه تایم', 'شمع احتراق', 'کمک فنر'],
    companyParts: {
      prefix: ['تعمیرگاه', 'فروشگاه قطعه', 'انبار', 'پخش'],
      names: ['آریا', 'مهر', 'نیک', 'پارس', 'اطمینان', 'سریع', 'ملی', 'دقت', 'بهمن', 'رهام'],
      suffix: ['مرکزی', 'شرق', 'غرب', 'شمال', 'جنوب']
    }
  },
  school: {
    key: 'school',
    title: 'آموزشگاه زبان و کلاس‌های خصوصی',
    short: 'آموزشگاه زبان',
    description: 'ثبت‌نام، کلاس آزمایشی و پیگیری انصراف',
    nameStyle: 'person',
    stages: [
      { label: 'اطلاعیه' },
      { label: 'کلاس آزمایشی' },
      { label: 'ثبت‌نام شده', amount: true, won: true },
      { label: 'در حال تحصیل', amount: true, won: true },
      { label: 'منصرف', lost: true }
    ],
    sources: ['اینستاگرام', 'معرفی دوستان', 'سایت', 'تبلیغ محیطی'],
    fields: [
      { key: 'course', label: 'زبان / دوره', kind: 'select', options: ['انگلیسی', 'آلمانی', 'آیلتس', 'کودکان'] },
      { key: 'parent', label: 'نام والد (زیر ۱۸ سال)', kind: 'text' },
      { key: 'teacher', label: 'مدرس', kind: 'select', options: ['خانم رضایی', 'آقای کریمی', 'خانم احمدی'] }
    ],
    items: ['شهریه‌ی ترم', 'کلاس خصوصی', 'کتاب و جزوه', 'آزمون تعیین سطح'],
    companyParts: null
  },
  clinic: {
    key: 'clinic',
    title: 'کلینیک زیبایی (بدون پرونده‌ی درمانی)',
    short: 'کلینیک زیبایی',
    description: 'نوبت، یادآوری ویزیت و فروش بسته‌ی خدمات',
    nameStyle: 'person',
    stages: [
      { label: 'اطلاعیه' },
      { label: 'نوبت رزرو شد' },
      { label: 'ویزیت انجام شد' },
      { label: 'بسته‌ی خدمات فروخته شد', amount: true, won: true },
      { label: 'منصرف', lost: true }
    ],
    sources: ['اینستاگرام', 'معرفی دوستان', 'تماس ورودی'],
    fields: [
      { key: 'service', label: 'خدمت مورد علاقه', kind: 'select', options: ['لیزر', 'پاکسازی', 'کاشت', 'میکروبلیدینگ'] },
      { key: 'birth', label: 'سال تولد', kind: 'text' },
      { key: 'appointment', label: 'وضعیت آخرین نوبت', kind: 'select', options: ['حاضر', 'غایب', 'لغو شده'] }
    ],
    items: ['بسته‌ی ۴ جلسه‌ای لیزر', 'پاکسازی پوست', 'مشاوره‌ی تخصصی'],
    companyParts: null
  },
  renovation: {
    key: 'renovation',
    title: 'پیمانکاری بازسازی و نوسازی منزل',
    short: 'بازسازی منزل',
    description: 'بازدید، برآورد و قرارداد پروژه‌ای',
    nameStyle: 'person',
    stages: [
      { label: 'اطلاعیه' },
      { label: 'بازدید انجام شد' },
      { label: 'برآورد ارسال شد', amount: true },
      { label: 'قرارداد امضا شد', amount: true, won: true },
      { label: 'منصرف', lost: true }
    ],
    sources: ['معرفی دوستان', 'وب‌سایت', 'تماس ورودی', 'بازدید تبلیغاتی'],
    fields: [
      { key: 'area', label: 'متراژ (متر)', kind: 'text' },
      { key: 'work', label: 'نوع کار', kind: 'select', options: ['بازسازی آشپزخانه', 'بازسازی حمام', 'کفسازی', 'نقاشی'] },
      { key: 'neighborhood', label: 'محله', kind: 'text' }
    ],
    items: ['متریال کفسازی', 'دستمزد نصب', 'نقاشی ساختمان', 'تعویض کابینت'],
    companyParts: null
  },
  uniform: {
    key: 'uniform',
    title: 'تولیدی لباس کار و یونیفرم (فروش سازمانی)',
    short: 'یونیفرم سازمانی',
    description: 'نیازسنجی، نمونه‌سازی و سفارش تولید',
    nameStyle: 'company',
    stages: [
      { label: 'اطلاعیه' },
      { label: 'نیازسنجی' },
      { label: 'نمونه‌سازی', amount: true },
      { label: 'سفارش تولید', amount: true, won: true },
      { label: 'تحویل شد', amount: true, won: true }
    ],
    sources: ['معرفی', 'بازدید حضوری', 'نمایشگاه', 'وب‌سایت'],
    fields: [
      { key: 'industry', label: 'صنعت', kind: 'select', options: ['کارخانه', 'بیمارستان', 'هتل', 'شرکت خدماتی'] },
      { key: 'headcount', label: 'تعداد نفرات', kind: 'text' },
      { key: 'fabric', label: 'نوع پارچه', kind: 'select', options: ['پلی‌استر', 'پنبه', 'جین'] }
    ],
    items: ['یونیفرم کار (سرهمی)', 'پیراهن پرسنلی', 'کاپشن کار', 'لوگودوزی'],
    companyParts: {
      prefix: ['شرکت', 'کارخانه', 'مجتمع'],
      names: ['پارس‌فولاد', 'آذر', 'کیمیا', 'البرز', 'سپهر', 'توسعه', 'نیرو', 'پاسارگاد'],
      suffix: ['صنعتی', 'خدماتی', 'تولیدی']
    }
  }
};

export const BUSINESS_KEYS = Object.keys(BUSINESSES);
