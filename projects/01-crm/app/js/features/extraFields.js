// فیلدهای اختصاصی هر کسب‌وکار (از config) را می‌سازد و مقدارهایشان را از فرم می‌خواند.
import { BUSINESSES } from '../config/businesses.js';
import { input, select, field } from '../ui/form.js';
import { parseAmount } from '../core/validate.js';
import { toFa } from '../core/format.js';

export function extraControls(key, extra = {}) {
  return BUSINESSES[key].fields.map((f) => {
    const value = extra[f.k];
    let control;
    if (f.t === 'sel') {
      control = select(f.o.map((o) => ({ value: o, label: o })), value ?? f.o[0], { dataset: { extra: f.k } });
    } else if (f.t === 'num') {
      control = input({ type: 'text', inputmode: 'numeric', value: value ? String(value) : '', dataset: { extra: f.k }, placeholder: '۰' });
    } else {
      control = input({ type: 'text', value: value ?? '', dataset: { extra: f.k } });
    }
    return field({ label: f.l, control });
  });
}

export function readExtra(root, key) {
  const out = {};
  BUSINESSES[key].fields.forEach((f) => {
    const el = root.querySelector(`[data-extra="${f.k}"]`);
    if (!el) return;
    out[f.k] = f.t === 'num' ? parseAmount(el.value) : el.value.trim();
  });
  return out;
}

/** مقدار یک فیلد اختصاصی را برای نمایش آماده می‌کند */
export function displayExtra(f, value) {
  if (value === undefined || value === null || value === '') return '—';
  if (f.t === 'num') return `${toFa(new Intl.NumberFormat('en-US').format(value))} تومان`;
  return String(value);
}
