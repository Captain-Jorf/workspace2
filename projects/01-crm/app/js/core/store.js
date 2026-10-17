// لایه‌ی ذخیره‌سازی محلی (آفلاین‌اول). یک وضعیت سراسری + یک «سطل داده» جدا برای هر کسب‌وکار.
// اگر localStorage در دسترس نباشد، برنامه در حافظه کار می‌کند و وضعیت به کاربر نشان داده می‌شود.
import { BUSINESSES } from '../config/businesses.js';

export const SCHEMA = 'crm-simple-v6';
const KEY = 'crm-simple-v6';
const listeners = new Set();
let state = null;
let timer = null;
let storageOk = true;

function freshState() {
  return {
    colorway: 'sky-blue',
    lang: 'fa',
    fontSize: 'medium',
    accounts: [],
    session: null,
    activeBiz: null,
    biz: {}
  };
}

function freshBucket() {
  return { seeded: false, seq: { customer: 1, invoice: 1, note: 1, activity: 1 }, customers: [], invoices: [], notes: [] };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    state = Object.assign(freshState(), raw ? JSON.parse(raw) : {});
  } catch {
    state = freshState();
  }
  try {
    localStorage.setItem('__probe__', '1');
    localStorage.removeItem('__probe__');
  } catch {
    storageOk = false;
  }
  // مهاجرت: حالت شب قدیمی به تم شب متناظر تبدیل می‌شود
  if (state.theme === 'dark' && !String(state.colorway).startsWith('night-')) state.colorway = `night-${state.colorway}`;
  delete state.theme;
  for (const key of Object.keys(BUSINESSES)) {
    const saved = state.biz[key] || {};
    state.biz[key] = Object.assign(freshBucket(), saved, { seq: Object.assign(freshBucket().seq, saved.seq || {}) });
  }
  return state;
}

export const get = () => state;
export const storageAvailable = () => storageOk;

export function bucketOf(key = state.activeBiz) {
  return state.biz[key];
}

/** شماره‌ی بعدی برای هر نوع رکورد در کسب‌وکار فعال */
export function nextSeq(field, key = state.activeBiz) {
  const b = bucketOf(key);
  const value = b.seq[field];
  b.seq[field] = value + 1;
  return value;
}

/** ثبت تغییر: ذخیره‌ی تأخیری و اعلان به مشترکین */
export function commit() {
  if (storageOk) {
    clearTimeout(timer);
    timer = setTimeout(flush, 120);
  }
  for (const fn of listeners) fn(state);
}

export function flush() {
  if (!storageOk || !state) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    storageOk = false;
  }
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush);
}
