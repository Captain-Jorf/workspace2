// اجزای مشترک نماها: برچسب مرحله، نشانگر پیگیری، کارت مشتری و وضعیت خالی.
import { h } from '../core/dom.js';
import { money } from '../core/format.js';
import { BUSINESSES } from '../config/businesses.js';
import * as cust from '../domain/customers.js';
import { bizKey } from '../domain/customers.js';
import { openCustomerDetail } from '../features/customerDetail.js';

export function stageChip(c, key = bizKey()) {
  const st = BUSINESSES[key].stages[c.stage];
  const tone = st.won ? 'won' : st.lost ? 'lost' : 'open';
  return h('span', { class: `chip-stage ${tone}`, text: st.label });
}

export function followBadge(c) {
  const f = cust.dueSoonLabel(c);
  return h('span', { class: `follow ${f.tone}`, text: f.text });
}

/** کارت مشتری؛ کلیک روی بدنه، پنجره‌ی جزئیات را باز می‌کند. دکمه‌های داخل کارت جداگانه کار می‌کنند. */
export function openOnBodyClick(el, id, onChange) {
  el.addEventListener('click', (e) => {
    if (e.target.closest('button, select, input, textarea, a')) return;
    openCustomerDetail(id, { onChange });
  });
  el.addEventListener('keydown', (e) => {
    if (e.target !== el) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      openCustomerDetail(id, { onChange });
    }
  });
}

export function emptyState(title, text, action = null) {
  return h('div', { class: 'empty' },
    h('h3', { text: title }),
    h('p', { class: 'muted', text }),
    action);
}

export function kpi(label, value, tone = '') {
  return h('div', { class: `kpi ${tone}`.trim() },
    h('span', { class: 'muted small', text: label }),
    h('strong', { text: value }));
}

export const amountText = (c) => (c.amount ? money(c.amount) : '—');
