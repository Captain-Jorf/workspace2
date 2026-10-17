// مشتری/سرنخ (یک موجودیت): قواعد مرحله، پیگیری، فعالیت، بایگانی و حذف با امکان بازگردانی.
import * as store from '../core/store.js';
import { BUSINESSES } from '../config/businesses.js';
import { addDays, dayDiff, startOfDay, DAY } from '../core/jalali.js';
import { phoneOk, normPhone, toEn } from '../core/format.js';

export const FILTERS = [
  { id: 'all', label: 'همه' },
  { id: 'today', label: 'امروز' },
  { id: 'overdue', label: 'عقب‌افتاده' },
  { id: 'open', label: 'باز' },
  { id: 'done', label: 'انجام‌شده‌ها' }
];

export const ACTIVITY_TYPES = [
  { id: 'call', label: 'تماس' },
  { id: 'message', label: 'پیام' },
  { id: 'meeting', label: 'جلسه' },
  { id: 'note', label: 'یادداشت' }
];

export const activityLabel = (id) => ACTIVITY_TYPES.find((t) => t.id === id)?.label || 'فعالیت';

export const bizKey = () => store.get().activeBiz;
export const bizConfig = (key = bizKey()) => BUSINESSES[key];
export const stages = (key = bizKey()) => BUSINESSES[key].stages;
export const stageOf = (c, key = bizKey()) => stages(key)[c.stage] || null;
export const isClosed = (c, key = bizKey()) => {
  const s = stageOf(c, key);
  return !!(s && (s.won || s.lost));
};

export function bucket(key = bizKey()) {
  return store.bucketOf(key);
}

export function list({ archived = false } = {}, key = bizKey()) {
  return bucket(key).customers.filter((c) => !!c.archived === archived);
}

export function byId(id, key = bizKey()) {
  return bucket(key).customers.find((c) => c.id === id) || null;
}

/** امروز = پیگیری امروز یا گذشته و هنوز باز */
export function isDueToday(c, now = Date.now(), key = bizKey()) {
  return c.followUpAt !== null && dayDiff(c.followUpAt, now) <= 0 && !isClosed(c, key);
}

export function matchesFilter(c, filter, now = Date.now(), key = bizKey()) {
  switch (filter) {
    case 'today': return isDueToday(c, now, key);
    case 'overdue': return c.followUpAt !== null && dayDiff(c.followUpAt, now) < 0 && !isClosed(c, key);
    case 'open': return !isClosed(c, key);
    case 'done': return isClosed(c, key);
    default: return true;
  }
}

export function matchesQuery(c, query) {
  const q = toEn(query || '').trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\s/g, '');
  return c.name.toLowerCase().includes(q)
    || (c.contact || '').toLowerCase().includes(q)
    || normPhone(c.phone).includes(digits);
}

export function countsByStage(key = bizKey()) {
  const counts = stages(key).map(() => ({ count: 0, amount: 0 }));
  for (const c of list({}, key)) {
    counts[c.stage].count += 1;
    counts[c.stage].amount += c.amount || 0;
  }
  return counts;
}

/** اعتبارسنجی مشترک فرم مشتری و تغییر مرحله */
export function validateCustomer(data, key = bizKey()) {
  const errors = {};
  if (!data.name || !String(data.name).trim()) errors.name = 'نام الزامی است';
  if (!phoneOk(data.phone)) errors.phone = 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود';
  if (!data.source) errors.source = 'منبع آشنایی را انتخاب کن';
  const st = stages(key)[Number(data.stage)];
  if (!st) errors.stage = 'مرحله‌ی نامعتبر است';
  else if (st.amount && !(Number(data.amount) > 0)) errors.amount = 'برای این مرحله، مبلغ الزامی است';
  return errors;
}

export function createCustomer(data, key = bizKey(), now = Date.now()) {
  const errors = validateCustomer(data, key);
  if (Object.keys(errors).length) return { errors };
  const cfg = BUSINESSES[key];
  const fields = {};
  for (const f of cfg.fields) fields[f.key] = String(data.fields?.[f.key] ?? '').trim();
  const c = {
    id: store.nextSeq('customer', key),
    name: String(data.name).trim(),
    contact: String(data.contact || '').trim(),
    phone: normPhone(data.phone),
    source: data.source,
    stage: Number(data.stage),
    amount: stages(key)[Number(data.stage)].amount ? Math.round(Number(data.amount)) : 0,
    followUpAt: data.followUpAt ?? null,
    createdAt: now,
    updatedAt: now,
    archived: false,
    fields,
    description: '',
    activities: []
  };
  bucket(key).customers.push(c);
  store.commit();
  return { customer: c };
}

export function updateCustomer(id, data, key = bizKey(), now = Date.now()) {
  const c = byId(id, key);
  if (!c) return { error: 'مشتری پیدا نشد' };
  const errors = validateCustomer(data, key);
  if (Object.keys(errors).length) return { errors };
  const cfg = BUSINESSES[key];
  c.name = String(data.name).trim();
  c.contact = String(data.contact || '').trim();
  c.phone = normPhone(data.phone);
  c.source = data.source;
  c.stage = Number(data.stage);
  c.amount = stages(key)[c.stage].amount ? Math.round(Number(data.amount)) : 0;
  if (data.followUpAt !== undefined) c.followUpAt = data.followUpAt;
  for (const f of cfg.fields) c.fields[f.key] = String(data.fields?.[f.key] ?? '').trim();
  c.updatedAt = now;
  store.commit();
  return { customer: c };
}

/** تغییر مرحله؛ اگر مرحله مبلغ بخواهد و مبلغی نباشد، خطا برمی‌گرداند */
export function moveStage(id, stage, key = bizKey(), now = Date.now()) {
  const c = byId(id, key);
  if (!c) return { error: 'مشتری پیدا نشد' };
  const st = stages(key)[Number(stage)];
  if (!st) return { error: 'مرحله‌ی نامعتبر است' };
  if (st.amount && !(c.amount > 0)) return { error: 'برای این مرحله ابتدا مبلغ را ثبت کن' };
  c.stage = Number(stage);
  c.updatedAt = now;
  store.commit();
  return { customer: c };
}

export function logActivity(id, { type = 'call', text = '', follow }, key = bizKey(), now = Date.now()) {
  const c = byId(id, key);
  if (!c) return { error: 'مشتری پیدا نشد' };
  c.activities.unshift({
    id: store.nextSeq('activity', key),
    type,
    text: String(text || '').trim() || activityLabel(type),
    at: now,
    follow: follow ?? null
  });
  if (follow !== undefined) c.followUpAt = follow;
  c.updatedAt = now;
  store.commit();
  return { customer: c };
}

/** «۳ روز بعد» و سایر به‌تعویق‌اندازی‌ها: از امروز شروع می‌شود */
export function snooze(id, days = 3, key = bizKey(), now = Date.now()) {
  const c = byId(id, key);
  if (!c) return { error: 'مشتری پیدا نشد' };
  c.followUpAt = addDays(now, days);
  c.updatedAt = now;
  store.commit();
  return { customer: c };
}

export function setDescription(id, text, key = bizKey(), now = Date.now()) {
  const c = byId(id, key);
  if (!c) return { error: 'مشتری پیدا نشد' };
  c.description = String(text || '').trim();
  c.updatedAt = now;
  store.commit();
  return { customer: c };
}

export function setArchived(id, archived, key = bizKey(), now = Date.now()) {
  const c = byId(id, key);
  if (!c) return { error: 'مشتری پیدا نشد' };
  c.archived = !!archived;
  c.updatedAt = now;
  store.commit();
  return { customer: c };
}

/** حذف با امکان بازگردانی: برمی‌گرداند snapshot برای بازگردانی */
export function removeCustomer(id, key = bizKey()) {
  const list_ = bucket(key).customers;
  const index = list_.findIndex((c) => c.id === id);
  if (index < 0) return { error: 'مشتری پیدا نشد' };
  const [customer] = list_.splice(index, 1);
  const invoices = bucket(key).invoices.filter((inv) => inv.customerId === id);
  bucket(key).invoices = bucket(key).invoices.filter((inv) => inv.customerId !== id);
  store.commit();
  return { snapshot: { customer, index, invoices } };
}

export function restoreCustomer(snapshot, key = bizKey()) {
  const b = bucket(key);
  if (!b.customers.some((c) => c.id === snapshot.customer.id)) {
    b.customers.splice(Math.min(snapshot.index, b.customers.length), 0, snapshot.customer);
    b.invoices.push(...snapshot.invoices);
    store.commit();
  }
  return { customer: snapshot.customer };
}

export function dueSoonLabel(c, now = Date.now()) {
  if (c.followUpAt === null) return { tone: 'none', text: 'بدون پیگیری' };
  const d = dayDiff(c.followUpAt, now);
  if (d < 0) return { tone: 'danger', text: `عقب‌افتاده ${Math.abs(d)} روز` };
  if (d === 0) return { tone: 'today', text: 'امروز' };
  return { tone: 'ok', text: `${d} روز دیگر` };
}

export const dayStart = startOfDay;
export const DAY_MS = DAY;
