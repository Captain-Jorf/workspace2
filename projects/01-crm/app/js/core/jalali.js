// تاریخ شمسی (جلالی) و کار با روز. همه‌ی زمان‌ها به‌صورت میلی‌ثانیه‌ی یونیکس نگه داشته می‌شوند.
import { toFa } from './format.js';

export const DAY = 86400000;

/** تبدیل میلادی به جلالی (الگوریتم استاندارد) */
export function gregorianToJalali(gy, gm, gd) {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100)
    + Math.floor((gy2 + 399) / 400) - 80 + gd + gdm[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

const pad2 = (n) => String(n).padStart(2, '0');

export function jalaliParts(ms) {
  const d = new Date(ms);
  return gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** مثل ۱۴۰۵/۰۷/۲۵ */
export function formatDate(ms) {
  if (!ms) return '—';
  const { jy, jm, jd } = jalaliParts(ms);
  return toFa(`${jy}/${pad2(jm)}/${pad2(jd)}`);
}

export function formatTime(ms) {
  const d = new Date(ms);
  return toFa(`${pad2(d.getHours())}:${pad2(d.getMinutes())}`);
}

export function formatDateTime(ms) {
  return `${formatDate(ms)} ${formatTime(ms)}`;
}

/** کد فاکتور از تاریخ و زمان ثبت: 14050725-145902 */
export function stampCode(ms) {
  const { jy, jm, jd } = jalaliParts(ms);
  const d = new Date(ms);
  return `${jy}${pad2(jm)}${pad2(jd)}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
}

export function startOfDay(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** شروع روز بعد از n روز (از ابتدای روز جاری) */
export function addDays(ms, n) {
  return startOfDay(ms) + Math.round(n) * DAY;
}

/** اختلاف روز تقویمی: منفی = گذشته، صفر = امروز */
export function dayDiff(ms, now = Date.now()) {
  return Math.round((startOfDay(ms) - startOfDay(now)) / DAY);
}
