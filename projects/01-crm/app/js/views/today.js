// امروز: پیگیری‌های امروز و عقب‌افتاده، با «تماس»، «۳ روز بعد» و «ثبت فعالیت». بدون فیلتر و نمودار.
import { h, clear } from '../core/dom.js';
import { BUSINESSES } from '../config/businesses.js';
import { plural } from '../core/format.js';
import { formatDate, dayDiff } from '../core/jalali.js';
import * as cust from '../domain/customers.js';
import { can } from '../config/roles.js';
import * as store from '../core/store.js';
import { toast } from '../ui/toast.js';
import { openActivityForm } from '../features/customerDetail.js';
import { emptyState, kpi, stageChip, followBadge, openOnBodyClick } from './parts.js';

export const meta = {
  label: 'امروز',
  icon: '◎',
  title: 'امروز',
  sub: () => `${BUSINESSES[store.get().activeBiz].title} · کارهای امروز و عقب‌افتاده`,
  chips: false,
  actions: ['notice', 'customer']
};

export function render(root, { refresh }) {
  const key = store.get().activeBiz;
  const now = Date.now();
  const role = store.get().session?.role;
  const writable = can(role, 'customer.write');
  const all = cust.list({}, key);
  const due = all.filter((c) => cust.isDueToday(c, now, key)).sort((a, b) => a.followUpAt - b.followUpAt);
  const overdue = due.filter((c) => dayDiff(c.followUpAt, now) < 0);
  const today = due.length - overdue.length;
  const open = all.filter((c) => !cust.isClosed(c, key)).length;

  root.append(h('div', { class: 'kpi-row' },
    kpi('امروز', plural(today, 'پیگیری', 'پیگیری'), today ? 'tone-today' : ''),
    kpi('عقب‌افتاده', plural(overdue.length, 'مورد', 'مورد'), overdue.length ? 'tone-danger' : ''),
    kpi('باز', plural(open, 'مشتری', 'مشتری')),
    kpi('کل', plural(all.length, 'رکورد', 'رکورد'))));

  if (!due.length) {
    root.append(emptyState('امروز کاری نداری', 'هیچ پیگیری امروز یا عقب‌افتاده‌ای ثبت نشده است. از اطلاعیه‌ها یک پیگیری بساز.'));
    return;
  }

  root.append(h('h3', { class: 'section-title', text: 'پیگیری‌ها' }));
  const list = h('div', { class: 'card-list' });
  for (const c of due) {
    const card = h('article', { class: 'kcard row-card', tabindex: '0', dataset: { id: String(c.id) } },
      h('div', { class: 'row-main' },
        h('div', { class: 'row-title' }, h('strong', { text: c.name }), stageChip(c, key)),
        h('div', { class: 'muted small', text: `${c.phone}${c.contact ? ` · ${c.contact}` : ''} · ${c.source}` }),
        h('div', { class: 'row-meta' }, followBadge(c), h('span', { class: 'muted small', text: formatDate(c.followUpAt) }))),
      writable ? h('div', { class: 'card-actions' },
        h('button', { class: 'btn sm', type: 'button', onClick: () => openActivityForm({ customerId: c.id, type: 'call', onSaved: refresh }) }, 'تماس'),
        h('button', { class: 'btn sm', type: 'button', onClick: () => openActivityForm({ customerId: c.id, onSaved: refresh }) }, 'ثبت فعالیت'),
        h('button', { class: 'btn sm ghost', type: 'button', onClick: () => {
          cust.snooze(c.id, 3, key);
          toast(`«${c.name}» به ۳ روز بعد منتقل شد`);
        } }, '۳ روز بعد')) : null);
    openOnBodyClick(card, c.id, refresh);
    list.append(card);
  }
  root.append(list);
}
