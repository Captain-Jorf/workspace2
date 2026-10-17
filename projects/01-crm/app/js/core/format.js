// قالب‌بندی متن، پول، تلفن و تاریخ فارسی
import { toJalali, JALALI_MONTHS } from './jalali.js';

export const DAY_MS = 24 * 60 * 60 * 1000;
const FA = '۰۱۲۳۴۵۶۷۸۹';
const AR = '٠١٢٣٤٥٦٧٨٩';

export const pad2 = (n) => String(n).padStart(2, '0');

/** ارقام انگلیسی را به فارسی تبدیل می‌کند */
export function toFa(value) {
  return String(value ?? '').replace(/[0-9]/g, (d) => FA[d]);
}

/** ارقام فارسی و عربی را به انگلیسی تبدیل می‌کند (برای ورودی کاربر) */
export function toEn(value) {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (d) => FA.indexOf(d))
    .replace(/[٠-٩]/g, (d) => AR.indexOf(d));
}

/** گروه‌بندی سه‌رقمی با جداکننده‌ی فارسی ٬ */
export function groupDigits(n) {
  return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '٬');
}

/** مبلغ به تومان؛ صفر یعنی «بدون مبلغ» */
export function money(n) {
  const value = Number(n) || 0;
  return value ? `${toFa(groupDigits(value))} تومان` : 'بدون مبلغ';
}

/** فقط عدد با گروه‌بندی فارسی (بدون واحد) */
export function moneyPlain(n) {
  return toFa(groupDigits(Number(n) || 0));
}

/** شماره‌ی تلفن: فقط رقم انگلیسی، بدون فاصله و خط تیره */
export function cleanPhone(value) {
  return toEn(value).replace(/[\s\-()٫,]/g, '');
}

export function isPhone(value) {
  return /^09\d{9}$/.test(cleanPhone(value));
}

export function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** اختلاف روزهای تقویمی: منفی یعنی گذشته، صفر یعنی امروز */
export function dayDiff(ts, now = Date.now()) {
  return Math.round((startOfDay(ts) - startOfDay(now)) / DAY_MS);
}

/** ۲۳ مهر ۱۴۰۵ */
export function jDate(ts) {
  const [y, m, d] = toJalali(new Date(ts));
  return `${toFa(d)} ${JALALI_MONTHS[m - 1]} ${toFa(y)}`;
}

/** ۲۳ مهر ۱۴۰۵ · ۱۰:۳۰ */
export function jDateTime(ts) {
  const d = new Date(ts);
  return `${jDate(ts)} · ${toFa(`${pad2(d.getHours())}:${pad2(d.getMinutes())}`)}`;
}

/** ۱۴۰۵/۰۷/۲۳ */
export function jNumeric(ts) {
  const [y, m, d] = toJalali(new Date(ts));
  return toFa(`${y}/${pad2(m)}/${pad2(d)}`);
}

/** متن وضعیت پیگیری: عقب‌افتاده، امروز یا تاریخ */
export function followUpLabel(ts, now = Date.now()) {
  const diff = dayDiff(ts, now);
  if (diff < 0) return { text: `عقب‌افتاده · ${jDate(ts)}`, tone: 'over' };
  if (diff === 0) return { text: `امروز · ${jDate(ts)}`, tone: 'today' };
  return { text: `پیگیری · ${jDate(ts)}`, tone: 'soon' };
}
