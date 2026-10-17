// نمودارها: داشبورد تصویری (شبیه Power BI) با شاخص‌ها و نمودارهای مرتبط با مشتری، فاکتور و پیگیری.
import { h } from '../core/dom.js';
import { toFa, money } from '../core/format.js';
import { BUSINESSES } from '../config/businesses.js';
import * as store from '../core/store.js';
import * as cust from '../domain/customers.js';
import * as inv from '../domain/invoices.js';
import { dayDiff } from '../core/jalali.js';
import { areaChart, funnel, hbars, donut, gauge, kpiTile, chartCard, compact, dailyCounts, PALETTE } from '../features/charts.js';

export const meta = {
  label: 'نمودارها',
  icon: '◔',
  title: 'نمودارها',
  sub: () => `${BUSINESSES[store.get().activeBiz].title} · تحلیل تصویری فروش، فاکتور و پیگیری`,
  chips: false,
  actions: []
};

const monthFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'short' });

/** جمع مبلغ فاکتورها به تفکیک ماه، شش ماه اخیر */
function monthlyRevenue(invoices, now) {
  const base = new Date(now);
  const out = [];
  for (let i = 5; i >= 0; i -= 1) {
    const from = new Date(base.getFullYear(), base.getMonth() - i, 1).getTime();
    const to = new Date(base.getFullYear(), base.getMonth() - i + 1, 1).getTime();
    const sum = invoices.filter((x) => x.createdAt >= from && x.createdAt < to)
      .reduce((s, x) => s + inv.totals(x).total, 0);
    out.push({ label: monthFmt.format(from), value: sum });
  }
  return out;
}

export function render(root) {
  const key = store.get().activeBiz;
  const cfg = BUSINESSES[key];
  const now = Date.now();
  const all = cust.list({}, key);
  const open = all.filter((c) => !cust.isClosed(c, key));
  const invoices = inv.list('all', key, now);
  const activities = all.flatMap((c) => c.activities.map((a) => ({ ...a, customer: c })));
  const totalInvoiced = invoices.reduce((s, i) => s + inv.totals(i).total, 0);
  const paid = invoices.reduce((s, i) => s + inv.totals(i).paid, 0);
  const due = invoices.reduce((s, i) => s + inv.totals(i).due, 0);

  // پیگیری‌ها
  const follow = { overdue: 0, today: 0, upcoming: 0, none: 0 };
  for (const c of open) {
    if (c.followUpAt === null) follow.none += 1;
    else {
      const d = dayDiff(c.followUpAt, now);
      if (d < 0) follow.overdue += 1; else if (d === 0) follow.today += 1; else follow.upcoming += 1;
    }
  }

  // قیف
  const counts = cust.countsByStage(key);
  const funnelItems = cfg.stages.map((s, i) => ({ label: s.label, count: counts[i].count, amount: counts[i].amount }));

  // منبع آشنایی
  const sourceMap = new Map();
  for (const c of all) sourceMap.set(c.source || 'نامشخص', (sourceMap.get(c.source || 'نامشخص') || 0) + 1);
  const sources = [...sourceMap.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  // نوع فعالیت
  const typeItems = cust.ACTIVITY_TYPES.map((t) => ({ label: t.label, value: activities.filter((a) => a.type === t.id).length }));

  // وضعیت فاکتورها
  const statusCount = { draft: 0, pending: 0, overdue: 0, paid: 0 };
  for (const i of invoices) statusCount[inv.invoiceStatus(i, now)] += 1;
  const statusItems = Object.keys(statusCount).map((k, idx) => ({ label: inv.STATUS_LABEL[k], value: statusCount[k], color: PALETTE[[0, 2, 3, 1][idx]] }));

  // برترین مشتری‌ها
  const top = [...all].sort((a, b) => (b.amount || 0) - (a.amount || 0)).slice(0, 5).map((c) => ({ label: c.name, value: c.amount || 0 }));

  // روندها برای اسپارک‌لاین
  const newCustTimes = all.map((c) => c.createdAt);
  const activityDaily = dailyCounts(activities.map((a) => a.at), 30, now);
  const newCustSpark = dailyCounts(newCustTimes, 14, now).map((d) => d.value);
  const invSpark = dailyCounts(invoices.map((i) => i.createdAt), 14, now).map((d) => d.value);
  const overdueSpark = dailyCounts(all.filter((c) => c.followUpAt !== null).map((c) => c.followUpAt), 14, now).map((d) => d.value);

  const kpis = h('div', { class: 'dash-kpis' },
    kpiTile('مشتری‌ها', toFa(all.length), newCustSpark, PALETTE[1]),
    kpiTile('مبلغ کل فاکتورها', compact(totalInvoiced), invSpark, PALETTE[0]),
    kpiTile('مانده‌ی وصول', compact(due), null),
    kpiTile('پیگیری عقب‌افتاده', toFa(follow.overdue), overdueSpark, PALETTE[3]));

  const totalForPct = paid + due;
  const paidPct = totalForPct ? Math.round((paid / totalForPct) * 100) : 0;

  const grid = h('div', { class: 'dash-grid' },
    chartCard('قیف فروش', funnel(funnelItems), { wide: true, sub: 'تعداد و مبلغ هر مرحله' }),
    chartCard('درآمد شش ماه اخیر', areaChart(monthlyRevenue(invoices, now), { height: 180, color: PALETTE[0], fmt: compact }), { wide: true, sub: 'مجموع فاکتورها' }),
    chartCard('وضعیت فاکتورها', invoices.length ? donut(statusItems, { center: toFa(invoices.length), sub: 'فاکتور' }) : h('p', { class: 'muted small', text: 'فاکتوری ثبت نشده است.' })),
    chartCard('وصول فاکتورها', h('div', { class: 'gauge-wrap' },
      gauge(paidPct, 'وصول شده'),
      h('p', { class: 'muted small', text: `وصول‌شده ${compact(paid)} از ${compact(totalForPct)} تومان` }))),
    chartCard('منبع آشنایی مشتری‌ها', hbars(sources)),
    chartCard('پیگیری مشتری‌ها', donut([
      { label: 'عقب‌افتاده', value: follow.overdue, color: PALETTE[3] },
      { label: 'امروز', value: follow.today, color: PALETTE[2] },
      { label: 'آینده', value: follow.upcoming, color: PALETTE[1] },
      { label: 'بدون پیگیری', value: follow.none, color: PALETTE[4] }
    ], { center: toFa(open.length), sub: 'باز' })),
    chartCard('فعالیت‌ها در ۳۰ روز گذشته', areaChart(activityDaily, { height: 170, color: PALETTE[5], fmt: toFa, labelEvery: 5 }), { wide: true, sub: `${toFa(activities.length)} فعالیت در کل` }),
    chartCard('نوع فعالیت', hbars(typeItems)),
    chartCard('برترین مشتری‌ها از نظر مبلغ', hbars(top, { fmt: (v) => (v ? money(v) : '—') }), { wide: true })
  );

  root.append(kpis, grid);
}
