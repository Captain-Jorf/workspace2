// مشتری‌ها: فهرست جدولی. کلیک روی هر ردیف جزئیات را باز می‌کند؛ ویرایش و حذف (با بازگردانی) در همان ردیف.
import { h } from '../core/dom.js';
import { money, plural } from '../core/format.js';
import { formatDate } from '../core/jalali.js';
import { BUSINESSES } from '../config/businesses.js';
import { can } from '../config/roles.js';
import * as cust from '../domain/customers.js';
import * as store from '../core/store.js';
import { toast } from '../ui/toast.js';
import { confirmDialog } from '../ui/dialog.js';
import { openCustomerForm } from '../features/customerForm.js';
import { downloadText, toCsv } from '../core/download.js';
import { emptyState, stageChip, openOnBodyClick } from './parts.js';
import { ctx } from '../ui/context.js';

export const meta = {
  label: 'مشتری‌ها',
  icon: '☷',
  title: 'مشتری‌ها',
  sub: () => `${BUSINESSES[store.get().activeBiz].title} · جستجو با نام، مسئول یا موبایل (کلید /)`,
  chips: true,
  actions: ['customer', 'csv']
};

export function render(root, { refresh }) {
  const key = store.get().activeBiz;
  const cfg = BUSINESSES[key];
  const role = store.get().session?.role;
  const writable = can(role, 'customer.write');
  const now = Date.now();
  const rows = cust.list({}, key)
    .filter((c) => cust.matchesFilter(c, ctx.filter, now, key) && cust.matchesQuery(c, ctx.query))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  root.append(h('p', { class: 'muted small', text: `${plural(rows.length, 'مشتری', 'مشتری')} نمایش داده می‌شود` }));
  if (!rows.length) {
    root.append(emptyState('مشتری‌ای پیدا نشد', 'فیلتر یا جستجو را تغییر بده، یا مشتری جدید ثبت کن.'));
    return;
  }

  const table = h('table', { class: 'tbl customers' },
    h('thead', {}, h('tr', {},
      h('th', { text: 'نام' }),
      h('th', { text: cfg.nameStyle === 'company' ? 'مسئول' : 'موبایل' }),
      h('th', { text: 'موبایل' }),
      h('th', { text: 'مرحله' }),
      h('th', { text: 'مبلغ' }),
      h('th', { text: 'پیگیری بعدی' }),
      h('th', { text: 'عملیات' }))));
  const tbody = h('tbody');
  for (const c of rows) {
    const tr = h('tr', { class: 'row-click', tabindex: '0', dataset: { id: String(c.id) } },
      h('td', { text: c.name }),
      h('td', { text: cfg.nameStyle === 'company' ? (c.contact || '—') : c.source }),
      h('td', { class: 'ltr', text: c.phone }),
      h('td', {}, stageChip(c, key)),
      h('td', { class: 'num', text: c.amount ? money(c.amount) : '—' }),
      h('td', { class: 'muted small', text: c.followUpAt === null ? 'بدون پیگیری' : formatDate(c.followUpAt) }),
      h('td', {}, writable ? h('div', { class: 'row-ops' },
        h('button', { class: 'btn sm', type: 'button', onClick: () => openCustomerForm({ customer: c, onSaved: refresh }) }, 'ویرایش'),
        h('button', { class: 'btn sm danger', type: 'button', onClick: () => askDelete(c) }, 'حذف')) : null));
    openOnBodyClick(tr, c.id, refresh);
    tbody.append(tr);
  }
  table.append(tbody);
  root.append(h('div', { class: 'table-wrap' }, table));

  function askDelete(c) {
    confirmDialog({
      title: 'حذف مشتری',
      message: `«${c.name}» حذف شود؟ تا ۵ ثانیه می‌توانی بازگردانی.`,
      confirmLabel: 'حذف',
      danger: true,
      onConfirm: () => {
        const r = cust.removeCustomer(c.id, key);
        if (!r.snapshot) return;
        toast('مشتری حذف شد', { actionLabel: 'بازگردانی', onAction: () => cust.restoreCustomer(r.snapshot, key) });
      }
    });
  }
}

export function exportCustomersCsv() {
  const key = store.get().activeBiz;
  const cfg = BUSINESSES[key];
  const headers = ['نام', 'مسئول', 'موبایل', 'منبع', 'مرحله', 'مبلغ (تومان)', ...cfg.fields.map((f) => f.label)];
  const rows = cust.list({}, key).map((c) => [
    c.name, c.contact, c.phone, c.source, cfg.stages[c.stage].label, c.amount,
    ...cfg.fields.map((f) => c.fields[f.key] || '')
  ]);
  downloadText(toCsv(headers, rows), `customers-${key}.csv`);
  toast(`${plural(rows.length, 'ردیف', 'ردیف')} در فایل CSV ذخیره شد`);
}
