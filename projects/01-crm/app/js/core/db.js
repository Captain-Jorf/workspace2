// لایه‌ی ذخیره‌سازی محلی (آفلاین‌اول).
// ساختار: یک وضعیت سراسری (نشست، حساب‌ها، تم) + یک «سطل داده» جدا برای هر کسب‌وکار.
import { readRaw, writeRaw, storageAvailable } from './storage.js';
import { bus } from './bus.js';
import { BUSINESSES } from '../config/businesses.js';
import { buildDemo } from '../domain/seed.js';

export const SCHEMA_VERSION = 3;
let state = null;
let saveTimer = null;

function emptyBucket() {
  return { seeded: false, nextId: 1, nextInv: 1, nextNote: 1, customers: [], invoices: [], notes: [] };
}

function freshState() {
  return { schema: SCHEMA_VERSION, session: null, accounts: [], activeBiz: null, theme: 'light', collapsed: true, buckets: {} };
}

/** داده‌ی خراب یا ناقص را به ساختار فعلی تبدیل می‌کند (برای سازگاری با نسخه‌های بعدی) */
function normalize(raw) {
  const s = Object.assign(freshState(), raw && typeof raw === 'object' ? raw : {});
  s.buckets = s.buckets && typeof s.buckets === 'object' ? s.buckets : {};
  s.accounts = Array.isArray(s.accounts) ? s.accounts : [];
  for (const key of Object.keys(BUSINESSES)) {
    const b = Object.assign(emptyBucket(), s.buckets[key] || {});
    b.customers = Array.isArray(b.customers) ? b.customers : [];
    b.invoices = Array.isArray(b.invoices) ? b.invoices : [];
    b.notes = Array.isArray(b.notes) ? b.notes : [];
    s.buckets[key] = b;
  }
  s.schema = SCHEMA_VERSION;
  return s;
}

export function load() {
  let raw = null;
  try {
    raw = JSON.parse(readRaw() || 'null');
  } catch (e) {
    raw = null;
  }
  state = normalize(raw);
  return state;
}

export const current = () => state;
export const activeBizKey = () => state.activeBiz;
export const bucket = (key = state.activeBiz) => state.buckets[key];

/** بعد از هر تغییر داده صدا زده می‌شود: ذخیره‌ی تأخیری و اطلاع به صفحات */
export function touch() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 120);
  bus.emit('data');
}

export function flush() {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (!state) return;
  writeRaw(JSON.stringify(state));
  bus.emit('status');
}

export function storageStatus() {
  return storageAvailable();
}

/** کسب‌وکار را انتخاب و داده‌ی نمونه‌اش را در صورت نیاز می‌سازد */
export function setActiveBiz(key) {
  state.activeBiz = key;
  touch();
}

/** اگر کسب‌وکاری هنوز داده‌ی نمونه ندارد، همان لحظه می‌سازد */
export function ensureSeeded(key) {
  const b = bucket(key);
  if (b.seeded) return;
  const d = buildDemo(key);
  Object.assign(b, { seeded: true, customers: d.customers, invoices: d.invoices, notes: d.notes, nextId: d.nextId, nextInv: d.nextInv, nextNote: d.nextNote });
  touch();
}

/** داده‌ی یک کسب‌وکار را پاک و دوباره نمونه‌سازی می‌کند */
export function resetBiz(key) {
  state.buckets[key] = emptyBucket();
  ensureSeeded(key);
}

export function nextId(field, key = state.activeBiz) {
  const b = bucket(key);
  const id = b[field];
  b[field] = id + 1;
  return id;
}

export function setTheme(theme) {
  state.theme = theme === 'dark' ? 'dark' : 'light';
  touch();
}

window.addEventListener('pagehide', () => { if (state) flush(); });
