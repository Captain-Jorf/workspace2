// حساب کاربری محلی (ثبت‌نام و ورود با رمز) و ورود نقش‌های دمو.
// رمز با PBKDF2-SHA256 و نمک تصادفی ذخیره می‌شود؛ متن ساده ذخیره نمی‌شود.
import * as db from '../core/db.js';
import { isPhone, cleanPhone } from '../core/format.js';

const ITERATIONS = 120000;

const toHex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) => Uint8Array.from(hex.match(/.{2}/g).map((b) => parseInt(b, 16)));

async function derive(password, saltHex) {
  if (!crypto.subtle) throw new Error('این مرورگر امکان رمزنگاری ندارد؛ ثبت‌نام انجام نمی‌شود.');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromHex(saltHex), iterations: ITERATIONS, hash: 'SHA-256' }, key, 256);
  return toHex(bits);
}

export function session() {
  return db.current().session;
}

export async function register({ name, phone, password }) {
  const state = db.current();
  if (!name || name.trim().length < 2) return { error: 'نام را حداقل ۲ حرف وارد کن.' };
  if (!isPhone(phone)) return { error: 'شماره موبایل باید ۱۱ رقم و با 09 شروع شود.' };
  if (!password || password.length < 6) return { error: 'رمز را حداقل ۶ نویسه وارد کن.' };
  const p = cleanPhone(phone);
  if (state.accounts.some((a) => a.phone === p)) return { error: 'با این شماره قبلاً حساب ساخته شده است.' };
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = toHex(saltBytes);
  const hash = await derive(password, salt);
  const account = { id: Date.now(), name: name.trim(), phone: p, salt, hash, createdAt: Date.now() };
  state.accounts.push(account);
  state.session = { kind: 'account', accountId: account.id, name: account.name, role: 'manager' };
  db.touch();
  return { session: state.session };
}

export async function login({ phone, password }) {
  const state = db.current();
  const p = cleanPhone(phone);
  const account = state.accounts.find((a) => a.phone === p);
  if (!account) return { error: 'حسابی با این شماره پیدا نشد.' };
  const hash = await derive(password || '', account.salt);
  if (hash !== account.hash) return { error: 'رمز اشتباه است.' };
  state.session = { kind: 'account', accountId: account.id, name: account.name, role: 'manager' };
  db.touch();
  return { session: state.session };
}

export function loginDemo(role) {
  const names = { manager: 'مدیر نمونه', sales: 'فروشنده نمونه', support: 'پشتیبان نمونه' };
  db.current().session = { kind: 'demo', name: names[role], role };
  db.touch();
  return db.current().session;
}

export function logout() {
  db.current().session = null;
  db.touch();
}
