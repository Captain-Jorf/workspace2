// فاکتور: شماره از تاریخ و زمان ثبت، محاسبه‌ی جمع و تخفیف، پرداخت‌ها، وضعیت و کپی.
import * as store from '../core/store.js';
import { stampCode, DAY, startOfDay } from '../core/jalali.js';
import { bucket, byId, bizKey } from './customers.js';

export const INVOICE_FILTERS = [
  { id: 'all', label: 'همه' },
  { id: 'draft', label: 'پیش‌نویس' },
  { id: 'pending', label: 'در انتظار' },
  { id: 'overdue', label: 'معوقه' },
  { id: 'paid', label: 'پرداخت‌شده' }
];

export const STATUS_LABEL = { draft: 'پیش‌نویس', pending: 'در انتظار', overdue: 'معوقه', paid: 'پرداخت‌شده' };

export function totals(inv) {
  const subtotal = inv.items.reduce((sum, it) => sum + it.qty * it.price, 0);
  const discount = Math.min(inv.discount || 0, subtotal);
  const total = subtotal - discount;
  const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
  return { subtotal, discount, total, paid, due: Math.max(0, total - paid) };
}

export function invoiceStatus(inv, now = Date.now()) {
  if (inv.status === 'draft') return 'draft';
  const t = totals(inv);
  if (t.due === 0) return 'paid';
  if (inv.dueAt && inv.dueAt < now) return 'overdue';
  return 'pending';
}

export function list(filter = 'all', key = bizKey(), now = Date.now()) {
  return bucket(key).invoices
    .filter((inv) => filter === 'all' || invoiceStatus(inv, now) === filter)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function byInvoiceId(id, key = bizKey()) {
  return bucket(key).invoices.find((inv) => inv.id === id) || null;
}

export function forCustomer(customerId, key = bizKey()) {
  return bucket(key).invoices.filter((inv) => inv.customerId === customerId).sort((a, b) => b.createdAt - a.createdAt);
}

/** شماره‌ی یکتا: کد زمان ثبت، و در صورت برخورد، پسوند عددی */
function uniqueNo(createdAt, key) {
  const base = stampCode(createdAt);
  const taken = new Set(bucket(key).invoices.map((inv) => inv.no));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

export function validateInvoice(data) {
  const errors = {};
  if (!data.customerId) errors.customerId = 'مشتری را انتخاب کن';
  const items = Array.isArray(data.items) ? data.items : [];
  if (!items.length) errors.items = 'حداقل یک قلم اضافه کن';
  items.forEach((it, i) => {
    if (!String(it.title || '').trim()) errors[`item-${i}-title`] = 'عنوان قلم الزامی است';
    if (!(Number(it.qty) > 0)) errors[`item-${i}-qty`] = 'تعداد باید بیشتر از صفر باشد';
    if (!(Number(it.price) >= 0)) errors[`item-${i}-price`] = 'قیمت نامعتبر است';
  });
  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  if ((Number(data.discount) || 0) > subtotal) errors.discount = 'تخفیف بیشتر از جمع فاکتور است';
  return errors;
}

function cleanItems(items) {
  return items.map((it) => ({ title: String(it.title).trim(), qty: Math.round(Number(it.qty)), price: Math.round(Number(it.price)) }));
}

export function createInvoice(data, key = bizKey(), now = Date.now()) {
  const errors = validateInvoice(data);
  if (Object.keys(errors).length) return { errors };
  if (!byId(data.customerId, key)) return { errors: { customerId: 'مشتری پیدا نشد' } };
  const inv = {
    id: store.nextSeq('invoice', key),
    no: uniqueNo(now, key),
    customerId: data.customerId,
    createdAt: now,
    dueAt: data.dueAt ?? null,
    status: data.status === 'draft' ? 'draft' : 'issued',
    discount: Math.round(Number(data.discount) || 0),
    items: cleanItems(data.items),
    payments: [],
    notes: String(data.notes || '').trim()
  };
  bucket(key).invoices.push(inv);
  store.commit();
  return { invoice: inv };
}

export function updateInvoice(id, data, key = bizKey()) {
  const inv = byInvoiceId(id, key);
  if (!inv) return { error: 'فاکتور پیدا نشد' };
  const errors = validateInvoice(data);
  if (Object.keys(errors).length) return { errors };
  Object.assign(inv, {
    customerId: data.customerId,
    dueAt: data.dueAt ?? null,
    status: data.status === 'draft' ? 'draft' : 'issued',
    discount: Math.round(Number(data.discount) || 0),
    items: cleanItems(data.items),
    notes: String(data.notes || '').trim()
  });
  store.commit();
  return { invoice: inv };
}

export function addPayment(id, amount, key = bizKey(), now = Date.now()) {
  const inv = byInvoiceId(id, key);
  if (!inv) return { error: 'فاکتور پیدا نشد' };
  const value = Math.round(Number(amount));
  const due = totals(inv).due;
  if (!(value > 0)) return { error: 'مبلغ پرداخت باید بیشتر از صفر باشد' };
  if (value > due) return { error: 'مبلغ پرداخت از مانده‌ی فاکتور بیشتر است' };
  if (inv.status === 'draft') inv.status = 'issued';
  inv.payments.push({ amount: value, at: now });
  store.commit();
  return { invoice: inv };
}

/** کپی: فاکتور پیش‌نویس تازه با شماره‌ی جدید و بدون پرداخت */
export function copyInvoice(id, key = bizKey(), now = Date.now()) {
  const src = byInvoiceId(id, key);
  if (!src) return { error: 'فاکتور پیدا نشد' };
  const copy = {
    ...structuredClone(src),
    id: store.nextSeq('invoice', key),
    no: uniqueNo(now, key),
    createdAt: now,
    dueAt: null,
    status: 'draft',
    payments: []
  };
  bucket(key).invoices.push(copy);
  store.commit();
  return { invoice: copy };
}

export function removeInvoice(id, key = bizKey()) {
  const b = bucket(key);
  const index = b.invoices.findIndex((inv) => inv.id === id);
  if (index < 0) return { error: 'فاکتور پیدا نشد' };
  const [invoice] = b.invoices.splice(index, 1);
  store.commit();
  return { snapshot: { invoice, index } };
}

export function restoreInvoice(snapshot, key = bizKey()) {
  const b = bucket(key);
  if (!b.invoices.some((inv) => inv.id === snapshot.invoice.id)) {
    b.invoices.splice(Math.min(snapshot.index, b.invoices.length), 0, snapshot.invoice);
    store.commit();
  }
  return { invoice: snapshot.invoice };
}

export const DAY_MS = DAY;
export const dayStart = startOfDay;
