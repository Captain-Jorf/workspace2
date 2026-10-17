// مشتری‌ها: جدول مرتب‌شدنی، فیلتر، ویرایش، بایگانی، ورود از CSV، ادغام تکراری‌ها و خروجی CSV.
import { h, clear } from '../core/dom.js';
import { jNumeric, followUpLabel, money, toFa } from '../core/format.js';
import { BUSINESSES } from '../config/businesses.js';
import * as db from '../core/db.js';
import { list, matchesFilter, matchesQuery, setArchived, duplicateGroups } from '../domain/customers.js';
import { openCustomerDetail } from '../features/customerDetail.js';
import { openCustomerForm } from '../features/customerForm.js';
import { openImport, openMerge } from '../features/importMerge.js';
import { downloadCsv } from '../core/download.js';
import { toast } from '../ui/dialog.js';
import { allowed, emptyState, pageHead, stageControl } from './common.js';

export const meta = {
  id: 'customers', title: 'مشتری‌ها', label: 'مشتری‌ها', icon: '☷', filters: true, search: true,
  searchPlaceholder: 'جستجوی نام یا موبایل (کلید /)'
};

const COLS = [
  { key: 'name', label: 'نام' },
  { key: 'phone', label: 'موبایل' },
  { key: 'source', label: 'منبع' },
  { key: 'stage', label: 'مرحله' },
  { key: 'amount', label: 'مبلغ' },
  { key: 'next', label: 'پیگیری بعدی' }
];

export function mount(root, ctx) {
  let sort = { key: 'next', dir: 1 };
  const wrap = h('div', { class: 'view customers' });
  root.append(wrap);

  function refresh() {
    const key = db.activeBizKey();
    const biz = BUSINESSES[key];
    const all = list({}).filter((c) => matchesFilter(c, ctx.filter) && matchesQuery(c, ctx.query));
    const rows = [...all].sort((a, b) => compare(a, b, sort));
    const dupes = duplicateGroups().length;
    clear(wrap);
    wrap.append(
      pageHead('مشتری‌ها', `${toFa(rows.length)} مورد نمایش داده می‌شود`, [
        allowed('customer.create') ? h('button', { class: 'btn', type: 'button', onClick: () => openImport(() => {}) }, 'ورود از CSV') : null,
        h('button', { class: 'btn ghost', type: 'button', onClick: exportCsv }, 'خروجی CSV'),
        allowed('customer.delete') && dupes ? h('button', { class: 'btn', type: 'button', onClick: () => openMerge() }, `ادغام تکراری‌ها (${toFa(dupes)})`) : null
      ]),
      rows.length ? table(rows, biz) : emptyState('مشتری‌ای با این فیلتر پیدا نشد.'));
  }

  function table(rows, biz) {
    const head = h('tr', {}, COLS.map((col) => h('th', {
      'aria-sort': sort.key === col.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'
    }, h('button', {
      class: 'th-btn', type: 'button',
      onClick: () => { sort = { key: col.key, dir: sort.key === col.key ? -sort.dir : 1 }; refresh(); }
    }, col.label, sort.key === col.key ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''))), h('th', { text: 'عملیات' }));
    return h('div', { class: 'table-wrap' },
      h('table', { class: 'tbl' },
        h('thead', {}, head),
        h('tbody', {}, rows.map((c) => {
          const f = followUpLabel(c.next);
          const tr = h('tr', { class: `tone-${f.tone}`, dataset: { id: c.id }, tabindex: '0' },
            h('td', {}, h('button', { class: 'link-btn', type: 'button', onClick: () => openCustomerDetail(c.id) }, c.name)),
            h('td', { class: 'num' }, c.phone),
            h('td', {}, c.source),
            h('td', {}, stageControl(c)),
            h('td', { class: 'num' }, c.amount ? money(c.amount) : '—'),
            h('td', {}, h('span', { class: `follow ${f.tone}`, text: f.text })),
            h('td', { class: 'actions' },
              allowed('customer.edit') ? h('button', { class: 'btn ghost sm', type: 'button', onClick: () => openCustomerForm({ customer: c }) }, 'ویرایش') : null,
              allowed('customer.archive') ? h('button', { class: 'btn ghost sm', type: 'button', onClick: () => archive(c) }, 'بایگانی') : null));
          tr.addEventListener('click', (e) => { if (!e.target.closest('button, select, input')) openCustomerDetail(c.id); });
          tr.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target === tr) openCustomerDetail(c.id); });
          return tr;
        }))));
  }

  function archive(c) {
    setArchived(c.id, true);
    toast(`«${c.name}» بایگانی شد.`, { ms: 5000, action: { label: 'برگردان', run: () => setArchived(c.id, false) } });
  }

  function exportCsv() {
    const key = db.activeBizKey();
    const biz = BUSINESSES[key];
    const rows = [['نام', 'موبایل', 'منبع', 'مرحله', 'مبلغ (تومان)', 'تاریخ پیگیری بعدی', 'تاریخ ثبت']];
    list({}).forEach((c) => rows.push([c.name, c.phone, c.source, biz.stages[c.stage], c.amount, jNumeric(c.next), jNumeric(c.createdAt)]));
    downloadCsv(rows, `crm-${key}-customers.csv`);
    toast('فایل CSV ساخته شد.');
  }

  refresh();
  return { refresh };
}

function compare(a, b, { key, dir }) {
  const get = (c) => {
    if (key === 'stage') return c.stage;
    return c[key] ?? '';
  };
  const x = get(a), y = get(b);
  if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
  return String(x).localeCompare(String(y), 'fa') * dir;
}
