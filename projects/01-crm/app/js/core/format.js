// قالب‌بندی عدد، پول و شماره‌ی موبایل. ورودی‌های فارسی و عربی به انگلیسی تبدیل می‌شوند.

const FA = '۰۱۲۳۴۵۶۷۸۹';
const AR = '٠١٢٣٤٥٦٧٨٩';

export function toFa(value) {
  return String(value).replace(/\d/g, (d) => FA[Number(d)]);
}

export function toEn(value) {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (d) => String(FA.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
}

/** مبلغ به تومان با ارقام فارسی و جداکننده‌ی هزارگان */
export function money(amount) {
  const n = Math.round(Number(amount) || 0);
  return `${toFa(n.toLocaleString('en-US'))} تومان`;
}

export function normPhone(value) {
  return toEn(value).replace(/[\s\-٫,]/g, '');
}

export function phoneOk(value) {
  return /^09\d{9}$/.test(normPhone(value));
}

/** ورودی مبلغ را به عدد صحیح تبدیل می‌کند (کاما و فاصله حذف می‌شوند) */
export function parseMoney(value) {
  const n = Number(toEn(String(value ?? '')).replace(/[,\s٬]/g, ''));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

export function plural(n, one, many) {
  return `${toFa(n)} ${n === 1 ? one : many}`;
}
