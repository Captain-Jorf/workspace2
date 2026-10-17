// گزارش‌ها: همه‌ی عددها از داده‌ی واقعی محلی محاسبه می‌شوند (بدون عدد ثابت).
import * as db from '../core/db.js';
import { BUSINESSES, SOURCES } from '../config/businesses.js';
import { DAY_MS } from '../core/format.js';
import { list as listInvoices, paidTotal, remaining, statusOf } from './invoices.js';
import { stageFlags } from './customers.js';

export const REPORT_RANGES = [
  { value: 7, label: '۷ روز اخیر' },
  { value: 30, label: '۳۰ روز اخیر' },
  { value: 90, label: '۹۰ روز اخیر' },
  { value: 0, label: 'همه‌ی زمان‌ها' }
];

export function compute(rangeDays = 30, key = db.activeBizKey(), now = Date.now()) {
  const biz = BUSINESSES[key];
  const since = rangeDays ? now - rangeDays * DAY_MS : 0;
  const all = db.bucket(key).customers.filter((c) => !c.archived);
  const inRange = all.filter((c) => c.createdAt >= since);
  const won = inRange.filter((c) => stageFlags(c.stage, key).won);
  const lost = inRange.filter((c) => stageFlags(c.stage, key).lost);
  const invoices = listInvoices({ rangeDays }, key, now);
  const invoicedTotal = invoices.filter((i) => !i.draft).reduce((s, i) => s + i.amount, 0);
  const collected = invoices.reduce((s, i) => s + paidTotal(i), 0);
  const outstanding = invoices.filter((i) => !i.draft).reduce((s, i) => s + remaining(i), 0);
  const overdueCount = invoices.filter((i) => statusOf(i, now) === 'overdue').length;
  const byStage = biz.stages.map((name, idx) => ({ name, count: inRange.filter((c) => c.stage === idx).length }));
  const bySource = SOURCES.map((name) => ({ name, count: inRange.filter((c) => c.source === name).length }));
  const top = [...all].sort((a, c) => c.amount - a.amount).slice(0, 5).map((c) => ({ name: c.name, amount: c.amount }));
  const conversion = inRange.length ? Math.round((won.length / inRange.length) * 100) : 0;
  return {
    total: inRange.length, won: won.length, lost: lost.length, conversion,
    invoiceCount: invoices.filter((i) => !i.draft).length, invoicedTotal, collected, outstanding, overdueCount,
    byStage, bySource, top
  };
}
