// فرم فاکتور: مشتری، اقلام (عنوان، تعداد، قیمت)، تخفیف، سررسید، وضعیت و جمع لحظه‌ای.
import * as store from '../core/store.js';
import { h, clear } from '../core/dom.js';
import { money, parseMoney } from '../core/format.js';
import { DAY, startOfDay } from '../core/jalali.js';
import { BUSINESSES } from '../config/businesses.js';
import * as cust from '../domain/customers.js';
import * as inv from '../domain/invoices.js';
import { openDialog } from '../ui/dialog.js';
import { toast } from '../ui/toast.js';
import { field, select, applyErrors, bindCtrlEnter } from './forms.js';

const DUE = [
  { value: '0', label: 'بدون سررسید' },
  { value: '7', label: '۷ روز بعد' },
  { value: '14', label: '۱۴ روز بعد' },
  { value: '30', label: '۳۰ روز بعد' }
];

/** openInvoiceForm({ invoice, customerId, onSaved }) */
export function openInvoiceForm({ invoice = null, customerId = null, onSaved = () => {} } = {}) {
  const key = store.get().activeBiz;
  const cfg = BUSINESSES[key];
  const isEdit = !!invoice;
  const customers = cust.list({}, key).slice().sort((a, b) => a.name.localeCompare(b.name, 'fa'));

  const custSel = select(customers.map((c) => ({ value: String(c.id), label: c.name })), String(invoice?.customerId ?? customerId ?? ''), 'مشتری را انتخاب کن');
  const statusSel = select([{ value: 'issued', label: 'صادر شده' }, { value: 'draft', label: 'پیش‌نویس' }], invoice?.status || 'issued');
  const dueSel = select(DUE, invoice?.dueAt ? String(Math.max(0, Math.round((invoice.dueAt - invoice.createdAt) / DAY))) : '14');
  const discount = h('input', { class: 'input', inputmode: 'numeric', value: invoice?.discount ? String(invoice.discount) : '0' });
  const notes = h('textarea', { class: 'input', rows: '2', placeholder: 'یادداشت روی فاکتور (اختیاری)' }, invoice?.notes || '');

  let items = invoice ? invoice.items.map((it) => ({ ...it, qty: String(it.qty), price: String(it.price) })) : [{ title: '', qty: '1', price: '' }];
  const tbody = h('tbody');
  const totalsBox = h('div', { class: 'totals' });
  const listId = `items-${Math.random().toString(36).slice(2, 7)}`;
  const datalist = h('datalist', { id: listId }, ...cfg.items.map((i) => h('option', { value: i })));

  function computeTotals() {
    const subtotal = items.reduce((s, it) => s + (parseMoney(it.qty) || 0) * (parseMoney(it.price) || 0), 0);
    const disc = Math.min(parseMoney(discount.value), subtotal);
    clear(totalsBox);
    totalsBox.append(
      h('div', { class: 'totals-row' }, h('span', { text: 'جمع اقلام' }), h('strong', { text: money(subtotal) })),
      h('div', { class: 'totals-row' }, h('span', { text: 'تخفیف' }), h('strong', { text: money(disc) })),
      h('div', { class: 'totals-row total' }, h('span', { text: 'مبلغ قابل پرداخت' }), h('strong', { text: money(subtotal - disc) })));
  }

  function renderItems() {
    clear(tbody);
    items.forEach((it, i) => {
      const title = h('input', { class: 'input', list: listId, value: it.title, placeholder: 'عنوان قلم', 'aria-label': 'عنوان قلم' });
      const qty = h('input', { class: 'input num', inputmode: 'numeric', value: it.qty, 'aria-label': 'تعداد' });
      const price = h('input', { class: 'input num', inputmode: 'numeric', value: it.price, placeholder: 'قیمت واحد', 'aria-label': 'قیمت واحد' });
      title.addEventListener('input', () => { items[i].title = title.value; });
      qty.addEventListener('input', () => { items[i].qty = qty.value; computeTotals(); });
      price.addEventListener('input', () => { items[i].price = price.value; computeTotals(); });
      tbody.append(h('tr', { dataset: { row: String(i) } },
        h('td', {}, title),
        h('td', {}, qty),
        h('td', {}, price),
        h('td', { class: 'num' }, money((parseMoney(it.qty) || 0) * (parseMoney(it.price) || 0))),
        h('td', {}, h('button', {
          class: 'icon-btn sm', type: 'button', 'aria-label': 'حذف قلم',
          onClick: () => {
            items.splice(i, 1);
            if (!items.length) items.push({ title: '', qty: '1', price: '' });
            renderItems();
          }
        }, '✕'))));
    });
    computeTotals();
  }

  const itemsTable = h('div', { class: 'items-wrap', dataset: { key: 'items' } },
    h('table', { class: 'tbl items' },
      h('thead', {}, h('tr', {}, h('th', { text: 'عنوان' }), h('th', { text: 'تعداد' }), h('th', { text: 'قیمت واحد' }), h('th', { text: 'جمع' }), h('th', {}))),
      tbody),
    h('div', { class: 'items-foot' },
      h('button', {
        class: 'btn ghost', type: 'button',
        onClick: () => { items.push({ title: '', qty: '1', price: '' }); renderItems(); }
      }, '+ افزودن قلم'),
      datalist));

  discount.addEventListener('input', computeTotals);
  renderItems();

  const body = h('div', { class: 'form-grid' },
    field('مشتری', custSel, { key: 'customerId', wide: true }),
    field('وضعیت', statusSel, { key: 'status' }),
    field('سررسید پرداخت', dueSel, { key: 'dueAt' }),
    h('div', { class: 'field wide', dataset: { key: 'items' } }, h('span', { class: 'field-label', text: 'اقلام فاکتور' }), itemsTable, h('span', { class: 'field-error', role: 'alert' })),
    field('تخفیف (تومان)', discount, { key: 'discount' }),
    totalsBox,
    field('یادداشت فاکتور', notes, { key: 'notes', wide: true }));

  const submit = (close) => {
    const data = {
      customerId: Number(custSel.value) || null,
      status: statusSel.value,
      dueAt: dueSel.value === '0' ? null : startOfDay(Date.now()) + Number(dueSel.value) * DAY,
      discount: parseMoney(discount.value),
      notes: notes.value,
      items: items.map((it) => ({ title: it.title, qty: parseMoney(it.qty), price: parseMoney(it.price) }))
    };
    const result = isEdit ? inv.updateInvoice(invoice.id, data, key) : inv.createInvoice(data, key);
    if (result.errors) {
      const errs = { ...result.errors };
      if (errs.items) errs.items = 'حداقل یک قلم معتبر لازم است';
      const mapped = {};
      for (const [k, v] of Object.entries(errs)) {
        const m = k.match(/^item-(\d+)-(\w+)$/);
        if (m) mapped.items = v;
        else mapped[k] = v;
      }
      applyErrors(body, mapped);
      return;
    }
    close();
    toast(isEdit ? 'فاکتور ویرایش شد' : `فاکتور ${result.invoice.no} ثبت شد`);
    onSaved(result.invoice);
  };

  const handle = openDialog({
    kind: 'drawer',
    title: isEdit ? `ویرایش فاکتور ${invoice.no}` : 'فاکتور جدید',
    sub: 'اقلام را وارد کن؛ جمع به‌صورت خودکار محاسبه می‌شود',
    body,
    actions: [
      { label: 'انصراف', variant: 'ghost', onClick: (close) => close() },
      { label: 'ذخیره‌ی فاکتور', variant: 'primary', onClick: (close) => submit(close) }
    ]
  });
  bindCtrlEnter(handle.panel, () => submit(handle.close));
  return handle;
}
