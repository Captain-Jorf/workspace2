// امروز: پیگیری‌های امروز و عقب‌افتاده، با «۳ روز بعد» و ثبت فعالیت سریع
import { h, clear } from '../core/dom.js';
import { followUpLabel, toFa } from '../core/format.js';
import { BUSINESSES } from '../config/businesses.js';
import * as db from '../core/db.js';
import { list, dueToday, matchesQuery, snooze, stageFlags } from '../domain/customers.js';
import { openCustomerDetail } from '../features/customerDetail.js';
import { openActivity } from '../features/activity.js';
import { toast } from '../ui/dialog.js';
import { allowed, emptyState, pageHead, kpi } from './common.js';

export const meta = {
  id: 'today', title: 'امروز', label: 'امروز', icon: '◉', filters: false, search: true,
  searchPlaceholder: 'جستجو در پیگیری‌های امروز (کلید /)'
};

export function mount(root, ctx) {
  const wrap = h('div', { class: 'view today' });
  root.append(wrap);

  function refresh() {
    const key = db.activeBizKey();
    const all = list({});
    const open = all.filter((c) => stageFlags(c.stage, key).open);
    const due = dueToday();
    const overdue = due.filter((c) => followUpLabel(c.next).tone === 'over');
    const items = due.filter((c) => matchesQuery(c, ctx.query));
    clear(wrap);
    wrap.append(
      pageHead('پیگیری‌های امروز', `${toFa(due.length)} پیگیری نیاز به اقدام دارد؛ عقب‌افتاده‌ها بالاتر دیده می‌شوند.`),
      h('div', { class: 'kpis small' },
        kpi('عقب‌افتاده', toFa(overdue.length), overdue.length ? 'over' : ''),
        kpi('امروز', toFa(due.length - overdue.length)),
        kpi('باز', toFa(open.length)),
        kpi('مشتری فعال', toFa(all.length))),
      items.length
        ? h('ul', { class: 'stack' }, items.map((c) => row(c)))
        : emptyState(due.length ? 'نتیجه‌ای برای این جستجو پیدا نشد.' : 'امروز پیگیری‌ای برای انجام نداری. از اطلاعیه‌ها یک پیگیری برای فردا یا هفته‌ی بعد تنظیم کن.'));
  }

  function row(c) {
    const key = db.activeBizKey();
    const f = followUpLabel(c.next);
    return h('li', { class: `card row-card tone-${f.tone}`, dataset: { id: c.id } },
      h('button', { class: 'link-btn', type: 'button', onClick: () => openCustomerDetail(c.id) }, h('strong', { text: c.name })),
      h('span', { class: 'muted', text: `${c.phone} · ${BUSINESSES[key].stages[c.stage]}` }),
      h('span', { class: `follow ${f.tone}`, text: f.text }),
      h('div', { class: 'card-actions' },
        allowed('customer.activity') ? h('button', { class: 'btn sm', type: 'button', onClick: () => openActivity(c.id) }, 'ثبت فعالیت') : null,
        allowed('customer.activity') ? h('button', { class: 'btn ghost sm', type: 'button', onClick: () => { snooze(c.id, 3); toast('پیگیری ۳ روز بعد تنظیم شد.'); } }, '۳ روز بعد') : null));
  }

  refresh();
  return { refresh };
}
