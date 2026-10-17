// منطق مشتری/اطلاعیه: ساخت، ویرایش، تغییر مرحله، فعالیت، بایگانی، حذف با امکان بازگردانی، ادغام و ایمپورت.
import * as db from '../core/db.js';
import { BUSINESSES, MONEY_FROM_STAGE, SOURCES } from '../config/businesses.js';
import { DAY_MS, dayDiff, cleanPhone, isPhone } from '../core/format.js';

export const FILTERS = [
  { id: 'all', label: 'همه' },
  { id: 'today', label: 'امروز' },
  { id: 'overdue', label: 'عقب‌افتاده' },
  { id: 'open', label: 'باز' },
  { id: 'won', label: 'انجام‌شده‌ها' }
];

export const bizKey = () => db.activeBizKey();
export const stages = (key = bizKey()) => BUSINESSES[key].stages;

export function stageFlags(idx, key = bizKey()) {
  const biz = BUSINESSES[key];
  const won = biz.won.includes(idx);
  const lost = biz.lost.includes(idx);
  return { won, lost, open: !won && !lost };
}

export const needsAmount = (idx, key = bizKey()) => stageFlags(idx, key).won || idx >= MONEY_FROM_STAGE;

export function list({ archived = false } = {}, key = bizKey()) {
  return db.bucket(key).customers.filter((c) => !!c.archived === archived);
}

export const byId = (id, key = bizKey()) => db.bucket(key).customers.find((c) => c.id === id) || null;

export function matchesFilter(c, filter, key = bizKey(), now = Date.now()) {
  const flags = stageFlags(c.stage, key);
  switch (filter) {
    case 'today': return flags.open && dayDiff(c.next, now) <= 0;
    case 'overdue': return flags.open && dayDiff(c.next, now) < 0;
    case 'open': return flags.open;
    case 'won': return flags.won;
    default: return true;
  }
}

export function matchesQuery(c, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  return c.name.toLowerCase().includes(q) || c.phone.includes(cleanPhone(q));
}

/** مشتری‌های فعال که امروز یا عقب‌افتاده‌اند (برای صفحه‌ی امروز) */
export function dueToday(now = Date.now(), key = bizKey()) {
  return list({}, key).filter((c) => stageFlags(c.stage, key).open && dayDiff(c.next, now) <= 0)
    .sort((a, b) => a.next - b.next);
}

function validateCore(data, key) {
  if (!data.name || String(data.name).trim().length < 2) return 'نام را حداقل ۲ حرف وارد کن.';
  if (!isPhone(data.phone)) return 'شماره موبایل باید ۱۱ رقم و با 09 شروع شود.';
  if (!stages(key)[data.stage]) return 'مرحله‌ی معتبر انتخاب کن.';
  if (needsAmount(data.stage, key) && !(data.amount > 0)) return 'برای این مرحله مبلغ الزامی است.';
  return '';
}

export function createCustomer(data, key = bizKey()) {
  const error = validateCore(data, key);
  if (error) return { error };
  const now = Date.now();
  const b = db.bucket(key);
  const customer = {
    id: db.nextId('nextId', key),
    name: String(data.name).trim(),
    phone: cleanPhone(data.phone),
    source: data.source || SOURCES[0],
    stage: data.stage,
    stageSince: now,
    amount: Number(data.amount) || 0,
    next: now + (data.follow || 2) * DAY_MS,
    createdAt: now,
    archived: false,
    notes: String(data.notes || '').trim(),
    extra: { ...(data.extra || {}) },
    log: [{ at: now, type: 'created', text: 'ثبت شد' }]
  };
  b.customers.push(customer);
  db.touch();
  return { customer };
}

export function updateCustomer(id, data, key = bizKey()) {
  const c = byId(id, key);
  if (!c) return { error: 'مشتری پیدا نشد.' };
  const merged = { ...c, ...data, phone: data.phone ?? c.phone };
  const error = validateCore({ ...merged, phone: merged.phone }, key);
  if (error) return { error };
  const changes = [];
  if (merged.name !== c.name) changes.push('نام');
  if (merged.phone !== c.phone) changes.push('موبایل');
  if (merged.amount !== c.amount) changes.push('مبلغ');
  if (merged.source !== c.source) changes.push('منبع');
  c.name = String(merged.name).trim();
  c.phone = cleanPhone(merged.phone);
  c.source = merged.source;
  c.amount = Number(merged.amount) || 0;
  c.notes = String(merged.notes || '').trim();
  c.extra = { ...(merged.extra || {}) };
  if (merged.stage !== c.stage) {
    const from = stages(key)[c.stage];
    c.stage = merged.stage;
    c.stageSince = Date.now();
    c.log.push({ at: c.stageSince, type: 'stage', text: `مرحله: ${from} ← ${stages(key)[c.stage]}` });
  }
  if (data.follow) c.next = Date.now() + data.follow * DAY_MS;
  if (changes.length) c.log.push({ at: Date.now(), type: 'edit', text: `ویرایش: ${changes.join('، ')}` });
  db.touch();
  return { customer: c };
}

export function moveStage(id, stage, { silent = false } = {}, key = bizKey()) {
  const c = byId(id, key);
  if (!c) return { error: 'مشتری پیدا نشد.' };
  if (c.stage === stage) return { customer: c };
  if (needsAmount(stage, key) && !(c.amount > 0)) {
    return { error: `«${c.name}» مبلغ ندارد؛ برای این مرحله ابتدا مبلغ را ثبت کن.` };
  }
  const from = stages(key)[c.stage];
  c.stage = stage;
  c.stageSince = Date.now();
  c.log.push({ at: c.stageSince, type: 'stage', text: `مرحله: ${from} ← ${stages(key)[stage]}` });
  if (!silent) db.touch();
  return { customer: c };
}

export function logActivity(id, { type, text, follow }, key = bizKey()) {
  const c = byId(id, key);
  if (!c) return { error: 'مشتری پیدا نشد.' };
  const now = Date.now();
  c.log.push({ at: now, type, text: String(text || '').trim() || activityLabel(type) });
  if (follow) c.next = now + follow * DAY_MS;
  db.touch();
  return { customer: c };
}

/** پیگیری بعدی را به‌اندازه‌ی چند روز به تعویق می‌اندازد */
export function snooze(id, days = 3, key = bizKey()) {
  const c = byId(id, key);
  if (!c) return { error: 'مشتری پیدا نشد.' };
  c.next = Date.now() + days * DAY_MS;
  c.log.push({ at: Date.now(), type: 'edit', text: `پیگیری ${days} روز به تعویق افتاد` });
  db.touch();
  return { customer: c };
}

export const ACTIVITY_TYPES = [
  { value: 'call', label: 'تماس' },
  { value: 'message', label: 'پیام' },
  { value: 'meeting', label: 'جلسه' },
  { value: 'email', label: 'ایمیل' }
];

export function activityLabel(type) {
  return ACTIVITY_TYPES.find((t) => t.value === type)?.label || 'فعالیت';
}

export function setArchived(id, archived, key = bizKey()) {
  const c = byId(id, key);
  if (!c) return { error: 'مشتری پیدا نشد.' };
  c.archived = !!archived;
  c.log.push({ at: Date.now(), type: 'edit', text: archived ? 'بایگانی شد' : 'از بایگانی برگشت' });
  db.touch();
  return { customer: c };
}

/** حذف با نسخه‌ی پشتیبان تا بتوان با «بازگردانی» برگرداند */
export function removeCustomer(id, key = bizKey()) {
  const b = db.bucket(key);
  const idx = b.customers.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  const [customer] = b.customers.splice(idx, 1);
  const invoices = b.invoices.filter((i) => i.customerId === id);
  b.invoices = b.invoices.filter((i) => i.customerId !== id);
  const noteIds = b.notes.filter((n) => n.customerId === id).map((n) => n.id);
  b.notes.forEach((n) => { if (n.customerId === id) n.customerId = null; });
  db.touch();
  return { customer, index: idx, invoices, noteIds };
}

export function restoreCustomer(snapshot, key = bizKey()) {
  if (!snapshot) return;
  const b = db.bucket(key);
  b.customers.splice(Math.min(snapshot.index, b.customers.length), 0, snapshot.customer);
  b.invoices.push(...snapshot.invoices);
  b.notes.forEach((n) => { if (snapshot.noteIds.includes(n.id)) n.customerId = snapshot.customer.id; });
  db.touch();
}

/** گروه‌های مشتری با شماره‌ی تکراری */
export function duplicateGroups(key = bizKey()) {
  const map = new Map();
  list({}, key).concat(list({ archived: true }, key)).forEach((c) => {
    if (!map.has(c.phone)) map.set(c.phone, []);
    map.get(c.phone).push(c);
  });
  return [...map.values()].filter((g) => g.length > 1);
}

/** ادغام: قدیمی‌ترین رکورد می‌ماند؛ فاکتورها، یادداشت‌ها و سابقه منتقل می‌شوند */
export function mergeDuplicates(key = bizKey()) {
  const b = db.bucket(key);
  const groups = duplicateGroups(key);
  groups.forEach((group) => {
    const sorted = [...group].sort((a, c) => a.createdAt - c.createdAt);
    const keep = sorted[0];
    const others = sorted.slice(1);
    others.forEach((o) => {
      b.invoices.forEach((i) => { if (i.customerId === o.id) { i.customerId = keep.id; i.custName = keep.name; } });
      b.notes.forEach((n) => { if (n.customerId === o.id) n.customerId = keep.id; });
      keep.log.push(...o.log, { at: Date.now(), type: 'edit', text: `ادغام با رکورد ${o.id}` });
      keep.amount = Math.max(keep.amount, o.amount);
    });
    keep.log.sort((x, y) => x.at - y.at);
    b.customers = b.customers.filter((c) => !others.includes(c));
  });
  if (groups.length) db.touch();
  return groups.length;
}

/** ایمپورت ردیف‌های CSV؛ شماره‌ی تکراری رد می‌شود */
export function importRows(rows, key = bizKey()) {
  const b = db.bucket(key);
  const seen = new Set(b.customers.map((c) => c.phone));
  let added = 0, skipped = 0, invalid = 0;
  rows.forEach((row) => {
    const phone = cleanPhone(row.phone);
    if (!isPhone(phone) || !row.name || String(row.name).trim().length < 2) { invalid++; return; }
    if (seen.has(phone)) { skipped++; return; }
    let stage = Number.isInteger(row.stage) ? row.stage : 0;
    if (!stages(key)[stage]) stage = 0;
    const amount = needsAmount(stage, key) ? Number(row.amount) || 0 : 0;
    if (needsAmount(stage, key) && !amount) stage = 0;
    const result = createCustomer({ name: row.name, phone, source: row.source || SOURCES[0], stage, amount, follow: 2 }, key);
    if (result.customer) { seen.add(phone); added++; } else invalid++;
  });
  return { added, skipped, invalid };
}
