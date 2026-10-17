// تولید داده‌ی نمونه‌ی ساختگی برای هر کسب‌وکار (بدون وابستگی به db، کاملاً تابعی و قابل تست).
// هر کسب‌وکار: ۱۵۰ رکورد مشتری/اطلاعیه، که ۵۰ تای آن «انجام‌شده» و فاکتور دارند؛ ۱۰۰ تای دیگر در پایپ‌لاین‌اند.
import { BUSINESSES, SOURCES, MONEY_FROM_STAGE } from '../config/businesses.js';
import { createRng } from '../core/rng.js';
import { makeInvoiceCode } from '../core/invoiceCode.js';
import { toFa } from '../core/format.js';

const DAY = 24 * 60 * 60 * 1000;
const CUSTOMERS_PER_BIZ = 150;
const WON_PER_BIZ = 50;

const AREAS = ['شرق', 'غرب', 'مرکزی', 'نارمک', 'تهرانپارس', 'ستارخان', 'شهریار', 'کرج', 'ولنجک', 'ونک', 'پونک', 'جنت‌آباد', 'اکباتان', 'رباط‌کریم', 'کردان'];
const NEIGHBORHOODS = ['نارمک', 'زعفرانیه', 'ستارخان', 'سعادت‌آباد', 'اکباتان', 'پونک', 'جردن', 'تهران‌پارس', 'شهرک غرب', 'یوسف‌آباد'];
const CITIES = ['تهران', 'کرج', 'شهریار', 'قم', 'اصفهان', 'مشهد', 'شیراز', 'تبریز'];
const FIRST_NAMES = ['نسترن', 'آوا', 'پارسا', 'سحر', 'امیرعلی', 'ترنم', 'نیلوفر', 'سارا', 'مهسا', 'پریسا', 'الهام', 'شیدا', 'علی', 'رضا', 'محمد', 'حسین', 'مریم', 'زهرا', 'کیان', 'آرش', 'بهنام', 'نگار', 'سپیده', 'یاسمن', 'مهدی', 'ساینا', 'هومن', 'فرزاد', 'لیلا', 'نازنین'];
const LAST_NAMES = ['رستمی', 'جعفری', 'کریمی', 'احمدی', 'حیدری', 'مرادی', 'نوری', 'صادقی', 'موسوی', 'اکبری', 'قاسمی', 'یوسفی', 'رحیمی', 'عبادی', 'شریفی', 'طاهری', 'مهدوی', 'ساعی', 'کاظمی', 'فتحی'];
const ORGS = ['کارخانه‌ی نساجی', 'بیمارستان', 'هتل', 'شرکت خدماتی', 'کارخانه‌ی لبنیات', 'شرکت پیمانکاری', 'مجتمع تجاری', 'شهرداری منطقه'];
const ORG_WORDS = ['آریا', 'سپهر', 'البرز', 'پارس', 'آرمان', 'ماهان', 'فارس', 'سهند', 'نیلوفر', 'ایران'];
const PARTS_PREFIX = ['تعمیرگاه', 'فروشگاه قطعه', 'پخش', 'گاراژ', 'انبار'];
const PARTS_WORDS = ['یدک', 'سریع', 'ملی', 'نیک', 'پارس', 'آریا', 'دقت', 'اطمینان', 'البرز', 'مهر'];
const SERVICES = ['لیزر', 'پاکسازی پوست', 'میکرودرم', 'مزوتراپی', 'بوتاکس', 'کاشت مو'];
const COURSE_LEVELS = ['مبتدی', 'متوسط', 'پیشرفته'];
const FABRICS = ['گابردین', 'جین', 'تترون', 'نخی'];
const WORKS = ['آشپزخانه', 'حمام', 'کفسازی', 'نقاشی', 'بازسازی کامل'];

const NOTE_TEMPLATES = [
  ['پیگیری با مسئول خرید', 'قرار شد هفته‌ی بعد پیش‌فاکتور تازه ارسال شود و نظر مسئول خرید گرفته شود.'],
  ['قیمت ویژه‌ی خرید عمده', 'برای خریدهای بالای ۵۰ میلیون تخفیف محدود داده شود؛ تأیید مدیر لازم است.'],
  ['مدارک و کد اقتصادی', 'مشتری کد اقتصادی و کارت بازرگانی را فرستاد؛ فایل‌ها در پوشه‌ی مشتری ذخیره شود.'],
  ['یادآوری تمدید', 'قرارداد یا پیش‌پرداخت سال گذشته را بررسی کن و پیشنهاد تجدید بده.'],
  ['حساسیت روی قیمت', 'مشتری مقایسه‌ی قیمت با دو رقیب دارد؛ روی کیفیت و زمان تحویل تمرکز کن.'],
  ['ایده برای پیگیری بعد', 'اگر تماس اول جواب نداد، پیام کوتاه با نمونه‌ی کار بفرست و دو روز بعد دوباره تماس بگیر.']
];

function hashSeed(text) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0;
  return h;
}

function uniqueNamer(rng, makeBase) {
  const used = new Set();
  return () => {
    let name = makeBase(rng);
    let n = 2;
    while (used.has(name)) name = `${makeBase(rng)} شعبه‌ی ${toFa(n++)}`;
    used.add(name);
    return name;
  };
}

function nameMaker(key, rng) {
  switch (key) {
    case 'parts':
      return uniqueNamer(rng, (r) => `${r.pick(PARTS_PREFIX)} ${r.pick(PARTS_WORDS)} ${r.pick(AREAS)}`);
    case 'school':
      return uniqueNamer(rng, (r) => `${r.pick(FIRST_NAMES)} ${r.pick(LAST_NAMES)}`);
    case 'clinic':
      return uniqueNamer(rng, (r) => `${r.pick(FIRST_NAMES)} ${r.pick(LAST_NAMES)}`);
    case 'reno':
      return uniqueNamer(rng, (r) => `${r.chance(0.5) ? 'خانم' : 'آقای'} ${r.pick(LAST_NAMES)} (${r.pick(NEIGHBORHOODS)})`);
    default:
      return uniqueNamer(rng, (r) => `${r.pick(ORGS)} ${r.pick(ORG_WORDS)}`);
  }
}

function phoneMaker(rng) {
  const used = new Set();
  return () => {
    let phone;
    do {
      phone = `09${rng.int(100000000, 999999999)}`;
    } while (used.has(phone));
    used.add(phone);
    return phone;
  };
}

/** مقدار فیلد اختصاصی را بر اساس نوعش می‌سازد */
function extraValue(field, rng, ctx) {
  const k = field.k;
  if (field.t === 'sel') return rng.pick(field.o);
  if (field.t === 'text') {
    if (k === 'eco') return String(rng.int(100000000000, 999999999999));
    if (k === 'address') return `${rng.pick(NEIGHBORHOODS)}، خیابان ${rng.pick(['گلستان', 'بهار', 'نیایش', 'آزادی', 'مطهری'])}، پلاک ${rng.int(1, 240)}`;
    if (k === 'days') return rng.pick(['شنبه و دوشنبه', 'یکشنبه و سه‌شنبه', 'سه‌شنبه و پنجشنبه', 'شنبه تا چهارشنبه']);
    if (k === 'service') return rng.pick(SERVICES);
    if (k === 'city') return rng.pick(CITIES);
    if (k === 'deliver' || k === 'visit') return toFa(`۱۴۰۵/${String(rng.int(7, 12)).padStart(2, '0')}/${String(rng.int(1, 28)).padStart(2, '0')}`);
    return rng.pick(['نمونه', 'ثبت شده', 'در انتظار']);
  }
  // num
  const ranges = {
    credit: [20, 400, 5], debt: [0, 80, 1], remain: [0, 30, 1], age: [7, 60, 1], area: [40, 250, 1],
    count: [20, 800, 1], inst: [1, 12, 1], birth: [1962, 2008, 1], guardian: [0, 0, 1], budget: [20, 300, 1], quote: [50, 900, 1]
  };
  const range = ranges[k] || [1, 100, 1];
  if (k === 'birth') return rng.int(range[0], range[1]);
  if (['credit', 'debt', 'remain', 'quote', 'budget'].includes(k)) return rng.int(range[0], range[1]) * 1000000;
  return rng.int(range[0], range[1]);
}

function buildExtra(bizKey, rng, ctx) {
  const extra = {};
  BUSINESSES[bizKey].fields.forEach((field) => {
    if (field.k === 'org') { extra.org = ctx.name; return; }
    if (field.k === 'guardian' && bizKey === 'school' && ctx.age < 18) {
      extra[field.k] = `09${rng.int(100000000, 999999999)}`;
      return;
    }
    if (field.k === 'guardian') { extra[field.k] = ''; return; }
    if (field.k === 'city') { extra[field.k] = rng.pick(CITIES); return; }
    if (field.k === 'age') { ctx.age = rng.int(7, 60); extra.age = ctx.age; return; }
    extra[field.k] = extraValue(field, rng, ctx);
  });
  return extra;
}

/**
 * یک کسب‌وکار کامل را می‌سازد.
 * خروجی: مشتری‌ها، فاکتورها، یادداشت‌ها و شمارنده‌های بعدی.
 */
export function buildDemo(bizKey, now = Date.now()) {
  const biz = BUSINESSES[bizKey];
  const rng = createRng(hashSeed(bizKey));
  const nameOf = nameMaker(bizKey, rng);
  const phoneOf = phoneMaker(rng);
  const customers = [];
  const invoices = [];
  const notes = [];
  let nextId = 1;
  let nextInv = 1;
  let nextNote = 1;
  const takenCodes = new Set();

  const nonWon = biz.stages.map((_, i) => i).filter((i) => !biz.won.includes(i));

  for (let n = 0; n < CUSTOMERS_PER_BIZ; n++) {
    const won = n < WON_PER_BIZ;
    const stage = won ? rng.pick(biz.won) : rng.pick(nonWon);
    const createdAt = now - rng.int(12, 200) * DAY - rng.int(0, 86399) * 1000;
    const stageSince = Math.min(now, createdAt + rng.int(1, 30) * DAY);
    const needsMoney = won || stage >= MONEY_FROM_STAGE;
    const amount = needsMoney ? rng.int(4, 120) * 500000 : 0;
    const offset = won ? rng.int(10, 40) : rng.int(-6, 14);
    const name = nameOf();
    const ctx = { age: 0, name };
    const customer = {
      id: nextId++,
      name,
      phone: phoneOf(),
      source: rng.pick(SOURCES),
      stage,
      stageSince,
      amount,
      next: now + offset * DAY,
      createdAt,
      archived: false,
      notes: rng.chance(0.4) ? 'مشتری پیشنهاد داد جلسه‌ی حضوری برگزار شود.' : '',
      extra: buildExtra(bizKey, rng, ctx),
      log: [{ at: createdAt, type: 'created', text: 'ثبت شد' }]
    };
    if (stage > 0) customer.log.push({ at: stageSince, type: 'stage', text: `مرحله: ${biz.stages[stage]}` });
    if (rng.chance(0.6)) customer.log.push({ at: Math.min(now, createdAt + rng.int(1, 9) * DAY), type: 'call', text: 'تماس انجام شد؛ نیاز مشتری بررسی شد.' });
    customers.push(customer);

    if (won) {
      const count = rng.chance(0.15) ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const issued = Math.min(now - DAY, customer.createdAt + rng.int(3, 40) * DAY + rng.int(0, 86399) * 1000);
        const draft = rng.chance(0.06);
        const invAmount = count === 2 ? Math.round(amount / 2 / 500000) * 500000 : amount;
        const roll = rng.next();
        const payments = [];
        if (!draft && roll < 0.45) payments.push({ at: Math.min(now, issued + rng.int(2, 20) * DAY), amount: invAmount });
        else if (!draft && roll < 0.7) payments.push({ at: Math.min(now, issued + rng.int(2, 10) * DAY), amount: Math.round(invAmount * 0.4 / 500000) * 500000 });
        const inv = {
          id: nextInv,
          no: nextInv,
          code: makeInvoiceCode(issued, takenCodes),
          customerId: customer.id,
          custName: customer.name,
          amount: invAmount,
          issued,
          due: issued + 14 * DAY,
          draft,
          notes: '',
          payments
        };
        nextInv++;
        invoices.push(inv);
        customer.log.push({ at: issued, type: 'invoice', text: `فاکتور ${inv.code} صادر شد` });
      }
    }
  }

  for (let i = 0; i < 6; i++) {
    const [title, body] = NOTE_TEMPLATES[i];
    const linked = i % 2 === 0 ? customers[(i * 17) % customers.length] : null;
    notes.push({
      id: nextNote++,
      title,
      body,
      customerId: linked ? linked.id : null,
      createdAt: now - (i + 1) * DAY,
      updatedAt: now - (i + 1) * DAY
    });
  }

  return { customers, invoices, notes, nextId, nextInv, nextNote };
}
