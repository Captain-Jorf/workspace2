// گزارش‌ها: شاخص‌های کلیدی و جدول مراحل. بدون نمودار.
import { h } from '../core/dom.js';
import { money } from '../core/format.js';
import { BUSINESSES } from '../config/businesses.js';
import * as store from '../core/store.js';
import * as cust from '../domain/customers.js';
import * as inv from '../domain/invoices.js';
import { kpi } from './parts.js';

export const meta = {
  label: 'گزارش‌ها',
  icon: '∑',
  title: 'گزارش‌ها',
  sub: () => `${BUSINESSES[store.get().activeBiz].title} · خلاصه‌ی فروش و پیگیری`,
  chips: false,
  actions: ['csv']
};

export function render(root) {
  const key = store.get().activeBiz;
  const cfg = BUSINESSES[key];
  const now = Date.now();
  const all = cust.list({}, key);
  const counts = cust.countsByStage(key);
  const won = cfg.stages.map((s, i) => (s.won ? i : -1)).filter((i) => i >= 0);
  const wonAmount = all.filter((c) => won.includes(c.stage)).reduce((s, c) => s + c.amount, 0);
  const pipeline = all.filter((c) => !cust.isClosed(c, key)).reduce((s, c) => s + c.amount, 0);
  const invoices = inv.list('all', key, now);
  const due = invoices.reduce((s, i) => s + inv.totals(i).due, 0);
  const overdue = invoices.filter((i) => inv.invoiceStatus(i, now) === 'overdue').length;
  const max = Math.max(1, ...counts.map((c) => c.count));

  root.append(h('div', { class: 'kpi-row' },
    kpi('کل مشتری‌ها', String(all.length)),
    kpi('فروش موفق', money(wonAmount), 'tone-ok'),
    kpi('در جریان', money(pipeline)),
    kpi('مانده‌ی فاکتورها', money(due), overdue ? 'tone-danger' : '')));

  root.append(h('h3', { class: 'section-title', text: 'مراحل فروش' }));
  root.append(h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
    h('thead', {}, h('tr', {}, h('th', { text: 'مرحله' }), h('th', { text: 'تعداد' }), h('th', { text: 'مبلغ' }), h('th', { text: 'سهم' }))),
    h('tbody', {}, ...cfg.stages.map((s, i) => h('tr', {},
      h('td', { text: s.label }),
      h('td', { class: 'num', text: String(counts[i].count) }),
      h('td', { class: 'num', text: counts[i].amount ? money(counts[i].amount) : '—' }),
      h('td', {}, h('span', { class: 'bar', style: { width: `${Math.round((counts[i].count / max) * 100)}%` } }))))))));
}
