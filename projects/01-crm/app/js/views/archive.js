// بایگانی: مشتری‌های بایگانی‌شده. بازگردانی برای همه؛ حذف دائمی فقط برای مدیر.
import { h } from '../core/dom.js';
import { plural } from '../core/format.js';
import { BUSINESSES } from '../config/businesses.js';
import { can } from '../config/roles.js';
import * as store from '../core/store.js';
import * as cust from '../domain/customers.js';
import { toast } from '../ui/toast.js';
import { confirmDialog } from '../ui/dialog.js';
import { emptyState, stageChip } from './parts.js';
import { ctx } from '../ui/context.js';

export const meta = {
  label: 'بایگانی',
  icon: '▣',
  title: 'بایگانی',
  sub: () => `${BUSINESSES[store.get().activeBiz].title} · مشتری‌های بایگانی‌شده`,
  chips: false,
  actions: []
};

export function render(root, { refresh }) {
  const key = store.get().activeBiz;
  const role = store.get().session?.role;
  const rows = cust.list({ archived: true }, key).filter((c) => cust.matchesQuery(c, ctx.query));
  root.append(h('p', { class: 'muted small', text: plural(rows.length, 'مورد', 'مورد') + ' بایگانی‌شده' }));
  if (!rows.length) {
    root.append(emptyState('بایگانی خالی است', 'مشتری‌هایی که بایگانی کنی اینجا می‌آیند و می‌توانی برگردانی.'));
    return;
  }
  const table = h('table', { class: 'tbl' },
    h('thead', {}, h('tr', {}, h('th', { text: 'نام' }), h('th', { text: 'موبایل' }), h('th', { text: 'مرحله' }), h('th', { text: 'عملیات' }))),
    h('tbody', {}, ...rows.map((c) => h('tr', {},
      h('td', { text: c.name }),
      h('td', { class: 'ltr', text: c.phone }),
      h('td', {}, stageChip(c, key)),
      h('td', {}, h('div', { class: 'row-ops' },
        can(role, 'customer.write') ? h('button', { class: 'btn sm', type: 'button', onClick: () => { cust.setArchived(c.id, false, key); toast(`«${c.name}» از بایگانی برگشت`); refresh(); } }, 'بازگردانی') : null,
        can(role, 'customer.purge') ? h('button', { class: 'btn sm danger', type: 'button', onClick: () => confirmDialog({
          title: 'حذف دائمی', message: `«${c.name}» و فاکتورهایش برای همیشه حذف شوند. این کار قابل برگشت نیست.`,
          confirmLabel: 'حذف دائمی', danger: true,
          onConfirm: () => { cust.removeCustomer(c.id, key); toast('حذف دائمی انجام شد'); refresh(); }
        }) }, 'حذف دائمی') : null))))));
  root.append(h('div', { class: 'table-wrap' }, table));
}
