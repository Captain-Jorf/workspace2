// آمار یک مشتری برای گزارش کار نموداری (فاکتورها، فعالیت‌ها). هم پنجره‌ی مشتری و هم صفحه‌ی نمودارها از این استفاده می‌کنند.
import * as cust from '../domain/customers.js';
import * as inv from '../domain/invoices.js';
import { PALETTE, dailyCounts } from './charts.js';

export function customerStats(c, key, now = Date.now()) {
  const invoices = inv.forCustomer(c.id, key);
  const sum = (f) => invoices.reduce((s, x) => s + f(x), 0);
  const statusKeys = ['draft', 'pending', 'overdue', 'paid'];
  return {
    invoices: invoices.length,
    total: sum((x) => inv.totals(x).total),
    paid: sum((x) => inv.totals(x).paid),
    due: sum((x) => inv.totals(x).due),
    statusItems: statusKeys.map((k, idx) => ({
      label: inv.STATUS_LABEL[k],
      value: invoices.filter((x) => inv.invoiceStatus(x, now) === k).length,
      color: PALETTE[[0, 2, 3, 1][idx]]
    })),
    activitiesByType: cust.ACTIVITY_TYPES.map((t) => ({ label: t.label, value: c.activities.filter((a) => a.type === t.id).length })),
    daily: dailyCounts(c.activities.map((a) => a.at), 30, now)
  };
}
