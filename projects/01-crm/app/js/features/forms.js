// کمک‌کننده‌های مشترک فرم‌ها: فیلد با پیام خطا، لیست کشویی، و Ctrl+Enter برای ذخیره.
import { h } from '../core/dom.js';

/** فیلد با برچسب و محل خطا. wrap.dataset.key برای نگاشت خطا به فیلد */
export function field(label, control, { key = '', hint = '', wide = false } = {}) {
  return h('label', { class: `field${wide ? ' wide' : ''}`, dataset: { key } },
    h('span', { class: 'field-label', text: label }),
    control,
    hint ? h('span', { class: 'hint', text: hint }) : null,
    h('span', { class: 'field-error', role: 'alert' }));
}

export function setFieldError(root, key, message) {
  const wrap = root.querySelector(`.field[data-key="${key}"]`);
  if (!wrap) return;
  wrap.classList.toggle('invalid', !!message);
  wrap.querySelector('.field-error').textContent = message || '';
}

export function clearErrors(root) {
  root.querySelectorAll('.field.invalid').forEach((el) => el.classList.remove('invalid'));
  root.querySelectorAll('.field-error').forEach((el) => { el.textContent = ''; });
}

export function applyErrors(root, errors) {
  clearErrors(root);
  for (const [key, msg] of Object.entries(errors)) setFieldError(root, key, msg);
  const first = root.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea');
  first?.focus();
}

export function select(options, value = '', placeholder = '') {
  const el = h('select', { class: 'input' });
  if (placeholder) el.append(h('option', { value: '', text: placeholder }));
  for (const o of options) el.append(h('option', { value: o.value, text: o.label }));
  el.value = value;
  return el;
}

/** Ctrl+Enter (یا ⌘+Enter) فرم را ذخیره می‌کند */
export function bindCtrlEnter(root, submit) {
  root.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  });
}
