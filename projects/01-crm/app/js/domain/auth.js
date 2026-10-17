// حساب کاربری محلی: ثبت‌نام، ورود و نقش‌های نمونه. رمز عبور فقط به‌صورت هش ذخیره می‌شود.
import * as store from '../core/store.js';
import { normPhone, phoneOk } from '../core/format.js';

export const DEMO_USERS = [
  { role: 'manager', name: 'مدیر نمونه' },
  { role: 'sales', name: 'فروشنده‌ی نمونه' },
  { role: 'support', name: 'پشتیبان نمونه' }
];

export const session = () => store.get().session;

async function hashPassword(text) {
  const bytes = new TextEncoder().encode(`crm-simple-v6:${text}`);
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // مسیر پشتیبان برای محیط‌های بدون SubtleCrypto (فقط برای نمونه)
  let h = 5381;
  for (const ch of text) h = ((h << 5) + h + ch.charCodeAt(0)) | 0;
  return `fb${(h >>> 0).toString(16)}`;
}

export function demoLogin(role) {
  const user = DEMO_USERS.find((u) => u.role === role);
  if (!user) return { error: 'نقش نامعتبر است' };
  store.get().session = { kind: 'demo', role, name: user.name };
  store.commit();
  return { ok: true };
}

export async function register({ name, phone, password }) {
  const errors = {};
  if (!String(name || '').trim()) errors.name = 'نام را وارد کن';
  if (!phoneOk(phone)) errors.phone = 'شماره موبایل معتبر نیست';
  if (String(password || '').length < 4) errors.password = 'رمز عبور حداقل ۴ کاراکتر باشد';
  if (Object.keys(errors).length) return { errors };
  const accounts = store.get().accounts;
  const normalized = normPhone(phone);
  if (accounts.some((a) => a.phone === normalized)) return { errors: { phone: 'این شماره قبلاً ثبت شده است' } };
  const account = { id: accounts.length + 1, name: String(name).trim(), phone: normalized, role: 'sales', pass: await hashPassword(password) };
  accounts.push(account);
  store.get().session = { kind: 'account', id: account.id, role: account.role, name: account.name };
  store.commit();
  return { ok: true };
}

export async function login({ phone, password }) {
  const normalized = normPhone(phone);
  const account = store.get().accounts.find((a) => a.phone === normalized);
  if (!account || account.pass !== await hashPassword(password)) return { error: 'شماره یا رمز عبور اشتباه است' };
  store.get().session = { kind: 'account', id: account.id, role: account.role, name: account.name };
  store.commit();
  return { ok: true };
}

export function logout() {
  store.get().session = null;
  store.commit();
}
