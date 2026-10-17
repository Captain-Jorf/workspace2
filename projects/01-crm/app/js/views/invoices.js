// فاکتورها: صدور، ثبت پرداخت، ویرایش، کپی، چاپ، اشتراک‌گذاری و حذف (فقط مدیر).
import { h, clear } from '../core/dom.js';
import { money, jDate, toFa, jNumeric } from '../core/format.js';
import * as db from '../core/db.js';
import * as invoices from '../domain/invoices.js';
import { RANGES } from '../domain/invoices.js';
import { openInvoiceForm, openPayment } from '../features/invoiceForm.js';
import { printInvoice, openShare } from '../features/invoiceShare.js';
import { openCustomerDetail } from '../features/customerDetail.js';
import { downloadCsv } from '../core/download.js';
import { confirmDialog, toast } from '../ui/dialog.js';
import { select } from '../ui/form.js';
import { allowed, emptyState, pageHead, kpi } from './common.js';

export const meta = {
  id: 'invoices', title: 'فاکتورها', label: 'فاکتورها', icon: '▤', filters: false, search: false
};

const BADGE = { draft: 'draft', issued: 'issued', partial: 'partial', overdue: 'over', paid: 'paid' };

export function mount(root) {
  let rangeDays = 0;
  const wrap = h('div', { class: 'view invoices' });
  root.append(wrap);

  function refresh() {
    const all = invoices.list({ rangeDays: 0 });
    const rows = invoices.list({ rangeDays });
    const active = rows.filter((i) => !i.draft);
    const collected = rows.reduce((s, i) => s + invoices.paidTotal(i), 0);
    const outstanding = active.reduce((s, i) => s + invoices.remaining(i), 0);
    const overdue = active.filter((i) => invoices.statusOf(i) === 'overdue').length;
    const range = select(RANGES, rangeDays, { 'aria-label': 'بازه‌ی زمانی' });
    range.addEventListener('change', () => { rangeDays = Number(range.value); refresh(); });
    clear(wrap);
    wrap.append(
      pageHead('فاکتورها', `${toFa(all.length)} فاکتور در کل · شماره‌ی هر فاکتور از زمان ثبت ساخته می‌شود`, [
        range,
        allowed('invoice.create') ? h('button', { class: 'btn primary', type: 'button', onClick: () => openInvoiceForm({ onDone: refresh }) }, 'فاکتور جدید') : null,
        h('button', { class: 'btn ghost', type: 'button', onClick: () => exportCsv(rows) }, 'خروجی CSV')
      ]),
      h('div', { class: 'kpis small' },
        kpi('فاکتور صادرشده', toFa(active.length)),
        kpi('وصول‌شده', money(collected)),
        kpi('مانده', money(outstanding)),
        kpi('معوق', toFa(overdue), overdue ? 'over' : '')),
      rows.length ? table(rows) : emptyState('در این بازه فاکتوری نیست.', allowed('invoice.create')
        ? h('button', { class: 'btn primary', type: 'button', onClick: () => openInvoiceForm({}) }, 'فاکتور جدید') : null));
  }

  function table(rows) {
    return h('div', { class: 'table-wrap' },
      h('table', { class: 'tbl' },
        h('thead', {}, h('tr', {}, ['شماره فاکتور', 'تاریخ صدور', 'مشتری', 'مبلغ', 'پرداخت‌شده', 'مانده', 'وضعیت', 'عملیات'].map((t) => h('th', { text: t })))),
        h('tbody', {}, rows.map((inv) => {
          const status = invoices.statusOf(inv);
          const left = invoices.remaining(inv);
          return h('tr', { dataset: { id: inv.id } },
            h('td', { class: 'num' }, toFa(inv.code)),
            h('td', {}, jDate(inv.issued)),
            h('td', {}, h('button', { class: 'link-btn', type: 'button', onClick: () => openCustomerDetail(inv.customerId) }, inv.custName)),
            h('td', { class: 'num' }, money(inv.amount)),
            h('td', { class: 'num' }, money(invoices.paidTotal(inv))),
            h('td', { class: 'num' }, money(left)),
            h('td', {}, h('span', { class: `badge-st ${BADGE[status]}`, text: invoices.STATUS_LABEL[status] })),
            h('td', { class: 'actions' }, actions(inv, left, status)));
        }))));
  }

  function actions(inv, left, status) {
    const list = [];
    if (allowed('invoice.pay') && status !== 'draft' && left > 0) list.push(btn('ثبت پرداخت', 'primary', () => openPayment(inv.id, refresh)));
    if (allowed('invoice.edit')) list.push(btn('ویرایش', 'ghost', () => openInvoiceForm({ invoice: inv, onDone: refresh })));
    if (allowed('invoice.create')) list.push(btn('کپی', 'ghost', () => {
      const res = invoices.copy(inv.id);
      if (res?.error) toast(res.error);
      else toast(`نسخه‌ی پیش‌نویس ${toFa(res.invoice.code)} ساخته شد.`);
    }));
    list.push(btn('چاپ', 'ghost', () => printInvoice(inv.id)));
    list.push(btn('اشتراک‌گذاری', 'ghost', () => openShare(inv.id)));
    if (allowed('invoice.delete')) list.push(btn('حذف', 'danger-text', () => remove(inv)));
    return list;
  }

  async function remove(inv) {
    const ok = await confirmDialog({ title: 'حذف فاکتور', message: `فاکتور ${toFa(inv.code)} حذف شود؟`, confirmLabel: 'حذف فاکتور', danger: true });
    if (!ok) return;
    const snap = invoices.remove(inv.id);
    if (snap) toast('فاکتور حذف شد.', { ms: 5000, action: { label: 'بازگردانی', run: () => invoices.restore(snap) } });
  }

  function exportCsv(rows) {
    const out = [['شماره فاکتور', 'تاریخ صدور', 'مهلت', 'مشتری', 'مبلغ (تومان)', 'پرداخت‌شده', 'مانده', 'وضعیت']];
    rows.forEach((i) => out.push([i.code, jNumeric(i.issued), jNumeric(i.due), i.custName, i.amount, invoices.paidTotal(i), invoices.remaining(i), invoices.STATUS_LABEL[invoices.statusOf(i)]]));
    downloadCsv(out, `crm-${db.activeBizKey()}-invoices.csv`);
    toast('فایل CSV فاکتورها ساخته شد.');
  }

  refresh();
  return { refresh };
}

function btn(label, variant, onClick) {
  return h('button', { class: `btn ${variant} sm`.trim(), type: 'button', onClick }, label);
}
