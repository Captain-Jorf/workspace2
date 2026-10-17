// فرم فاکتور (صدور/ویرایش) و ثبت پرداخت
import * as db from '../core/db.js';
import { h } from '../core/dom.js';
import { money, toFa } from '../core/format.js';
import { parseAmount } from '../core/validate.js';
import { DUE_OPTIONS } from '../config/businesses.js';
import * as invoices from '../domain/invoices.js';
import { list as listCustomers, byId } from '../domain/customers.js';
import { field, input, select, textarea, setError, clearErrors } from '../ui/form.js';
import { openDialog, closeDialog, toast } from '../ui/dialog.js';

/** openInvoiceForm({ invoice?, customerId?, onDone }) */
export function openInvoiceForm({ invoice = null, customerId = null, onDone } = {}) {
  const key = db.activeBizKey();
  const isEdit = !!invoice;
  const customers = listCustomers({}, key).sort((a, b) => a.name.localeCompare(b.name, 'fa'));
  const pickedId = invoice?.customerId ?? customerId ?? customers[0]?.id;
  const picked = byId(pickedId, key);

  const customer = isEdit
    ? h('div', { class: 'readonly' }, invoice.custName)
    : select(customers.map((c) => ({ value: c.id, label: c.name })), pickedId);
  const amount = input({ type: 'text', inputmode: 'numeric', value: String(invoice?.amount ?? picked?.amount ?? ''), placeholder: 'مبلغ فاکتور به تومان' });
  const due = select(DUE_OPTIONS, invoice ? Math.round((invoice.due - invoice.issued) / 86400000) : 14);
  const status = select([{ value: 'issued', label: 'صادر شود' }, { value: 'draft', label: 'پیش‌نویس بماند' }], invoice?.draft ? 'draft' : 'issued');
  const notes = textarea({ rows: 3, placeholder: 'شرایط پرداخت یا توضیح فاکتور' });
  notes.value = invoice?.notes || '';
  const formError = h('div', { class: 'form-alert', role: 'alert' });

  const form = h('form', { class: 'form-grid', novalidate: true },
    field({ label: 'مشتری', control: customer, span: true }),
    field({ label: 'مبلغ (تومان)', control: amount, hint: 'اگر خالی بماند، مبلغ مشتری پیشنهاد می‌شود' }),
    field({ label: 'مهلت پرداخت', control: due }),
    field({ label: 'وضعیت', control: status, span: true }),
    field({ label: 'توضیحات فاکتور', control: notes, span: true }),
    formError);

  const save = () => {
    clearErrors(form);
    formError.textContent = '';
    const value = parseAmount(amount.value);
    if (!(value > 0)) { setError(form, amount.id, 'مبلغ فاکتور باید بیشتر از صفر باشد.'); return; }
    const data = { amount: value, dueDays: Number(due.value), draft: status.value === 'draft', notes: notes.value };
    const res = isEdit
      ? invoices.update(invoice.id, data, key)
      : invoices.create({ ...data, customerId: Number(customer.value) }, key);
    if (res.error) { formError.textContent = res.error; return; }
    closeDialog();
    toast(isEdit ? 'فاکتور ویرایش شد.' : `فاکتور ${toFa(res.invoice.code)} ثبت شد.`);
    onDone && onDone(res.invoice);
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); save(); });

  openDialog({
    kind: 'drawer',
    title: isEdit ? 'ویرایش فاکتور' : 'فاکتور جدید',
    sub: isEdit ? toFa(invoice.code) : 'شماره‌ی فاکتور از زمان ثبت ساخته می‌شود',
    body: form,
    actions: [
      { label: 'انصراف', variant: 'ghost', onClick: () => closeDialog() },
      { label: 'ذخیره', variant: 'primary', primary: true, onClick: save }
    ]
  });
}

/** openPayment(invoiceId, onDone): ثبت پرداخت تا سقف مانده */
export function openPayment(invoiceId, onDone) {
  const key = db.activeBizKey();
  const inv = invoices.find(invoiceId, key);
  if (!inv) return;
  const left = invoices.remaining(inv);
  const amount = input({ type: 'text', inputmode: 'numeric', value: String(left), placeholder: 'مبلغ پرداخت' });
  const formError = h('div', { class: 'form-alert', role: 'alert' });
  const form = h('form', { class: 'form-grid', novalidate: true },
    h('div', { class: 'kpis small span' },
      h('div', { class: 'kpi-mini' }, h('span', { class: 'k', text: 'مبلغ فاکتور' }), h('strong', { class: 'v', text: money(inv.amount) })),
      h('div', { class: 'kpi-mini' }, h('span', { class: 'k', text: 'مانده' }), h('strong', { class: 'v', text: money(left) }))),
    field({ label: 'مبلغ پرداخت (تومان)', control: amount, span: true, hint: 'نمی‌تواند از مانده بیشتر باشد' }),
    formError);
  const save = () => {
    clearErrors(form);
    const value = parseAmount(amount.value);
    const res = invoices.addPayment(invoiceId, value, key);
    if (res.error) { setError(form, amount.id, res.error); return; }
    closeDialog();
    toast(invoices.remaining(res.invoice) ? 'پرداخت ثبت شد؛ مانده باقی است.' : 'فاکتور کامل تسویه شد.');
    onDone && onDone(res.invoice);
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); save(); });
  openDialog({
    kind: 'modal', size: 'small', title: 'ثبت پرداخت', sub: toFa(inv.code), body: form,
    actions: [
      { label: 'انصراف', variant: 'ghost', onClick: () => closeDialog() },
      { label: 'ثبت پرداخت', variant: 'primary', primary: true, onClick: save }
    ]
  });
}
