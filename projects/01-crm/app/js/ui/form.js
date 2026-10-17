// سازنده‌ی فیلد فرم با محل نمایش خطا (برای همه‌ی فرم‌ها یکسان)
import { h, options } from '../core/dom.js';

let uid = 0;
const nextUid = () => `f${++uid}`;

export function field({ label, control, hint = '', span = false }) {
  const id = control.id || nextUid();
  control.id = id;
  return h('div', { class: `field${span ? ' span' : ''}`, dataset: { field: id } },
    h('label', { for: id }, label),
    control,
    hint ? h('small', { class: 'hint' }, hint) : null,
    h('div', { class: 'err', role: 'alert' })
  );
}

export function input(props = {}) {
  return h('input', { class: 'input', autocomplete: 'off', ...props });
}

export function select(list, value, props = {}) {
  const el = h('select', { class: 'input', ...props }, options(list, value));
  el.value = String(value ?? '');
  return el;
}

export function textarea(props = {}) {
  return h('textarea', { class: 'input area', ...props });
}

/** خطای یک فیلد را نشان می‌دهد یا پاک می‌کند */
export function setError(root, id, message) {
  const wrap = root.querySelector(`[data-field="${id}"]`);
  if (!wrap) return;
  wrap.classList.toggle('bad', !!message);
  wrap.querySelector('.err').textContent = message || '';
}

export function clearErrors(root) {
  root.querySelectorAll('.field').forEach((f) => {
    f.classList.remove('bad');
    const err = f.querySelector('.err');
    if (err) err.textContent = '';
  });
}
