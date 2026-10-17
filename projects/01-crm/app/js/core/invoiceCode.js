// شماره‌ی فاکتور از روی تاریخ و زمان ثبت ساخته می‌شود: YYYYMMDD-HHMMSS (تاریخ شمسی، ساعت محلی)
// اگر همین کد قبلاً وجود داشته باشد، پسوند -2 و -3 ... اضافه می‌شود.
import { toJalali } from './jalali.js';

const pad = (n) => String(n).padStart(2, '0');

export function makeInvoiceCode(ts, taken = new Set()) {
  const d = new Date(ts);
  const [jy, jm, jd] = toJalali(d);
  const base = `${jy}${pad(jm)}${pad(jd)}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  let code = base;
  let n = 2;
  while (taken.has(code)) code = `${base}-${n++}`;
  taken.add(code);
  return code;
}
