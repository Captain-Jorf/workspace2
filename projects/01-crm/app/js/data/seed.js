// داده‌ی نمونه‌ی ساختگی: برای هر کسب‌وکار ۱۵۰ رکورد (مشتری و سرنخ در یک موجودیت) و فاکتورهای مرتبط.
// با عدد seed ثابت ساخته می‌شود، پس هر بار یکسان است.
import * as store from '../core/store.js';
import { BUSINESSES } from '../config/businesses.js';
import { hashSeed, rngFrom, pick, int } from '../core/rng.js';
import { DAY, startOfDay, stampCode } from '../core/jalali.js';

export const SEED_COUNT = 150;
const FIRST = ['علی', 'رضا', 'محمد', 'حسین', 'مهدی', 'امیر', 'سعید', 'نیما', 'پویا', 'کامران', 'مریم', 'نرگس', 'فاطمه', 'زهرا', 'سارا', 'نازنین', 'الهام', 'لیلا', 'شیدا', 'یلدا'];
const LAST = ['احمدی', 'محمدی', 'رضایی', 'کریمی', 'حسینی', 'موسوی', 'نوری', 'صادقی', 'جعفری', 'اکبری', 'قاسمی', 'مرادی', 'رحیمی', 'یوسفی', 'عباسی', 'شریفی'];
const CITIES = ['تهران', 'کرج', 'اصفهان', 'مشهد', 'شیراز', 'تبریز', 'قم', 'رشت'];
const ACTS = ['تماس گرفته شد و پیگیری شد', 'پیام قیمت ارسال شد', 'قرار حضوری تنظیم شد', 'درخواست نمونه ثبت شد'];
const NOTES = ['قیمت‌ها را برای هفته‌ی آینده هماهنگ کن', 'مشتری درباره‌ی مدت تحویل سؤال داشت', 'نسخه‌ی کاتالوگ جدید ارسال شود', 'یادآوری: تماس با مسئول خرید'];
// وزن هر مرحله در داده‌ی نمونه (جمع = ۱)
const WEIGHTS = [0.3, 0.2, 0.15, 0.2, 0.15];

export function buildSeed(key, now = Date.now()) {
  const cfg = BUSINESSES[key];
  const rng = rngFrom(hashSeed(key));
  const customers = [];
  const invoices = [];
  const notes = [];
  let seqCustomer = 1;
  let seqInvoice = 1;
  let seqActivity = 1;

  for (let i = 0; i < SEED_COUNT; i++) {
    const roll = rng();
    let stage = WEIGHTS.length - 1;
    let acc = 0;
    for (let s = 0; s < WEIGHTS.length; s++) {
      acc += WEIGHTS[s];
      if (roll < acc) { stage = s; break; }
    }
    const st = cfg.stages[stage];
    const person = cfg.nameStyle === 'person';
    const name = person
      ? `${pick(rng, FIRST)} ${pick(rng, LAST)}`
      : `${pick(rng, cfg.companyParts.prefix)} ${pick(rng, cfg.companyParts.names)} ${pick(rng, cfg.companyParts.suffix)}`;
    const contact = person ? '' : `${pick(rng, FIRST)} ${pick(rng, LAST)}`;
    const createdAt = now - int(rng, 1, 90) * DAY;
    const closed = !!(st.won || st.lost);
    const followUpAt = !closed && rng() < 0.8 ? startOfDay(now) + int(rng, -10, 12) * DAY : null;
    const fields = {};
    for (const f of cfg.fields) {
      if (f.kind === 'select') fields[f.key] = pick(rng, f.options);
      else if (f.key === 'parent') fields[f.key] = `${pick(rng, FIRST)} ${pick(rng, LAST)}`;
      else if (f.key === 'city' || f.key === 'neighborhood') fields[f.key] = pick(rng, CITIES);
      else if (f.kind === 'money') fields[f.key] = String(int(rng, 5, 300) * 1000000);
      else if (f.key === 'birth') fields[f.key] = String(int(rng, 1365, 1395));
      else if (f.key === 'area') fields[f.key] = String(int(rng, 50, 200));
      else fields[f.key] = String(int(rng, 2, 400));
    }
    const amount = st.amount ? int(rng, 2, 120) * 500000 : 0;
    const activities = [];
    const nAct = int(rng, 0, 3);
    for (let a = 0; a < nAct; a++) {
      activities.push({
        id: seqActivity++,
        type: pick(rng, ['call', 'message', 'meeting', 'note']),
        text: pick(rng, ACTS),
        at: createdAt + (a + 1) * DAY / 3,
        follow: null
      });
    }
    const customerId = seqCustomer++;
    customers.push({
      id: customerId,
      name,
      contact,
      phone: `09${int(rng, 100000000, 999999999)}`,
      source: pick(rng, cfg.sources),
      stage,
      amount,
      followUpAt,
      createdAt,
      updatedAt: createdAt,
      archived: false,
      fields,
      description: rng() < 0.3 ? pick(rng, NOTES) : '',
      activities
    });

    // فاکتور: برای مرحله‌های مبلغ‌دار با احتمال ۷۰٪
    if (st.amount && rng() < 0.7) {
      const count = int(rng, 1, 2);
      for (let k = 0; k < count; k++) {
        const invCreated = createdAt + k * DAY;
        const items = [];
        for (let it = 0; it < int(rng, 1, 3); it++) {
          items.push({ title: pick(rng, cfg.items), qty: int(rng, 1, 6), price: int(rng, 2, 40) * 100000 });
        }
        const total = items.reduce((s, it) => s + it.qty * it.price, 0);
        const payRoll = rng();
        const payments = [];
        if (payRoll < 0.45) payments.push({ amount: total, at: invCreated + DAY });
        else if (payRoll < 0.65) payments.push({ amount: Math.round(total / 2 / 1000) * 1000, at: invCreated + DAY });
        invoices.push({
          id: seqInvoice++,
          no: stampCode(invCreated),
          customerId,
          createdAt: invCreated,
          dueAt: invCreated + 14 * DAY,
          status: rng() < 0.1 ? 'draft' : 'issued',
          discount: 0,
          items,
          payments,
          notes: ''
        });
      }
    }
  }

  for (let n = 0; n < NOTES.length; n++) {
    notes.push({ id: n + 1, text: NOTES[n], customerId: null, createdAt: now - n * DAY, updatedAt: now - n * DAY });
  }

  return {
    seeded: true,
    seq: { customer: seqCustomer, invoice: seqInvoice, note: notes.length + 1, activity: seqActivity },
    customers,
    invoices,
    notes
  };
}

/** اگر داده‌ی این کسب‌وکار ساخته نشده، بساز. */
export function ensureSeed(key, now = Date.now()) {
  const b = store.bucketOf(key);
  if (b.seeded) return false;
  Object.assign(b, buildSeed(key, now));
  store.commit();
  return true;
}

/** بازنشانی داده‌ی نمونه (فقط مدیر) */
export function resetSeed(key, now = Date.now()) {
  const b = store.bucketOf(key);
  Object.assign(b, buildSeed(key, now));
  store.commit();
}
