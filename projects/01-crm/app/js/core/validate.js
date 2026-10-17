// قوانین اعتبارسنجی ساده‌ی فرم‌ها. هر تابع پیام خطا یا '' برمی‌گرداند.
import { isPhone, toEn } from './format.js';

export const required = (value, message = 'این فیلد الزامی است.') =>
  String(value ?? '').trim() ? '' : message;

export const minLength = (value, min, message) =>
  String(value ?? '').trim().length >= min ? '' : message || `حداقل ${min} حرف وارد کن.`;

export const phone = (value) =>
  isPhone(value) ? '' : 'شماره موبایل باید ۱۱ رقم و با 09 شروع شود.';

export const positiveNumber = (value, message = 'عدد معتبر وارد کن.') => {
  const n = Number(toEn(value).replace(/[٬,\s]/g, ''));
  return Number.isFinite(n) && n > 0 ? '' : message;
};

/** مبلغ را از ورودی کاربر (با کاما یا فاصله) به عدد تبدیل می‌کند */
export function parseAmount(value) {
  const n = Number(toEn(value).replace(/[٬,\s]/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
}
