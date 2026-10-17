// گزارش‌ها: همه‌ی عددها از داده‌ی واقعی همین دستگاه محاسبه می‌شوند.
import { h, clear } from '../core/dom.js';
import { money, toFa, jNumeric } from '../core/format.js';
import * as db from '../core/db.js';
import { compute, REPORT_RANGES } from '../domain/reports.js';
import { downloadCsv } from '../core/download.js';
import { toast } from '../ui/dialog.js';
import { select } from '../ui/form.js';
import { allowed, pageHead, kpi, emptyState } from './common.js';

export const meta = {
  id: 'reports', title: 'گزارش‌ها', label: 'گزارش‌ها', icon: '▥', filters: false, search: false
};

export function mount(root) {
  let days = 30;
  const wrap = h('div', { class: 'view reports' });
  root.append(wrap);

  function refresh() {
    const key = db.activeBizKey();
    const r = compute(days, key);
    const range = select(REPORT_RANGES, days, { 'aria-label': 'بازه‌ی گزارش' });
    range.addEventListener('change', () => { days = Number(range.value); refresh(); });
    clear(wrap);
    wrap.append(
      pageHead('گزارش‌ها', 'عددها از داده‌ی همین دستگاه محاسبه می‌شوند', [
        range,
        h('button', { class: 'btn ghost', type: 'button', onClick: () => exportCsv(r, key) }, 'خروجی CSV گزارش')
      ]),
      h('div', { class: 'kpis' },
        kpi('مشتری در بازه', toFa(r.total)),
        kpi('انجام‌شده', toFa(r.won)),
        kpi('از دست رفته', toFa(r.lost)),
        kpi('نرخ تبدیل', `${toFa(r.conversion)}٪`)),
      h('div', { class: 'kpis' },
        kpi('فاکتور صادرشده', toFa(r.invoiceCount)),
        kpi('جمع فاکتورها', money(r.invoicedTotal)),
        kpi('وصول‌شده', money(r.collected)),
        kpi('مانده‌ی معوق', money(r.outstanding), r.overdueCount ? 'over' : '')),
      h('div', { class: 'grid-2' },
        bars('مشتری‌ها به تفکیک مرحله', r.byStage, r.total),
        bars('منبع آشنایی', r.bySource, r.total)),
      h('section', { class: 'card' },
        h('h3', { text: 'پرمبلغ‌ترین مشتری‌ها' }),
        r.top.length ? h('ol', { class: 'rank' }, r.top.map((t) => h('li', {}, h('span', { text: t.name }), h('strong', { text: money(t.amount) })))) : emptyState('هنوز مبلغی ثبت نشده است.')));
  }

  refresh();
  return { refresh };
}

function bars(title, items, total) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return h('section', { class: 'card' },
    h('h3', { text: title }),
    h('ul', { class: 'bars' }, items.map((i) => h('li', {},
      h('span', { class: 'bar-label', text: i.name }),
      h('span', { class: 'bar' }, h('i', { style: `width:${Math.round((i.count / max) * 100)}%` })),
      h('strong', { class: 'num', text: toFa(i.count) })))),
    total ? null : h('p', { class: 'muted', text: 'داده‌ای در این بازه نیست.' }));
}

function exportCsv(r, key) {
  const rows = [['شاخص', 'مقدار'],
    ['مشتری در بازه', r.total], ['انجام‌شده', r.won], ['از دست رفته', r.lost], ['نرخ تبدیل ٪', r.conversion],
    ['فاکتور صادرشده', r.invoiceCount], ['جمع فاکتورها (تومان)', r.invoicedTotal], ['وصول‌شده (تومان)', r.collected], ['مانده (تومان)', r.outstanding]];
  downloadCsv(rows, `crm-${key}-report.csv`);
  toast('گزارش CSV ساخته شد.');
}
