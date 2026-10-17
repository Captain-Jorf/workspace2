// بایگانی: مشتری‌های بایگانی‌شده؛ بازگردانی برای همه، حذف دائمی فقط برای مدیر.
import { h, clear } from '../core/dom.js';
import { followUpLabel, toFa } from '../core/format.js';
import * as db from '../core/db.js';
import { BUSINESSES } from '../config/businesses.js';
import { list, matchesQuery, setArchived, removeCustomer, restoreCustomer } from '../domain/customers.js';
import { openCustomerDetail } from '../features/customerDetail.js';
import { confirmDialog, toast } from '../ui/dialog.js';
import { allowed, emptyState, pageHead } from './common.js';

export const meta = {
  id: 'archive', title: 'بایگانی', label: 'بایگانی', icon: '▣', filters: false, search: true,
  searchPlaceholder: 'جستجو در بایگانی (کلید /)'
};

export function mount(root, ctx) {
  const wrap = h('div', { class: 'view archive' });
  root.append(wrap);

  function refresh() {
    const key = db.activeBizKey();
    const items = list({ archived: true }).filter((c) => matchesQuery(c, ctx.query));
    clear(wrap);
    wrap.append(
      pageHead('بایگانی', `${toFa(items.length)} مورد بایگانی‌شده؛ با بازگردانی دوباره در فهرست‌ها دیده می‌شوند.`),
      items.length
        ? h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
          h('thead', {}, h('tr', {}, ['نام', 'موبایل', 'مرحله', 'پیگیری قبلی', 'عملیات'].map((t) => h('th', { text: t })))),
          h('tbody', {}, items.map((c) => h('tr', { dataset: { id: c.id } },
            h('td', {}, h('button', { class: 'link-btn', type: 'button', onClick: () => openCustomerDetail(c.id) }, c.name)),
            h('td', { class: 'num' }, c.phone),
            h('td', {}, BUSINESSES[key].stages[c.stage]),
            h('td', {}, h('span', { class: `follow ${followUpLabel(c.next).tone}`, text: followUpLabel(c.next).text })),
            h('td', { class: 'actions' },
              allowed('customer.archive') ? h('button', { class: 'btn ghost sm', type: 'button', onClick: () => { setArchived(c.id, false); toast(`«${c.name}» از بایگانی برگشت.`); } }, 'بازگردانی') : null,
              allowed('customer.delete') ? h('button', { class: 'btn danger-text sm', type: 'button', onClick: () => purge(c) }, 'حذف دائمی') : null)))))) 
        : emptyState(ctx.query ? 'موردی با این عبارت در بایگانی نیست.' : 'بایگانی خالی است.'));
  }

  async function purge(c) {
    const ok = await confirmDialog({ title: 'حذف دائمی', message: `«${c.name}» و فاکتورهایش حذف شود؟`, confirmLabel: 'حذف دائمی', danger: true });
    if (!ok) return;
    const snap = removeCustomer(c.id);
    if (snap) toast('مشتری حذف شد.', { ms: 5000, action: { label: 'بازگردانی', run: () => restoreCustomer(snap) } });
  }

  refresh();
  return { refresh };
}
