// فاکتورها: صدور، ویرایش، ثبت پرداخت، کپی، حذف با بازگردانی و وضعیت پرداخت.
// شماره‌ی فاکتور (code) از زمان ثبت ساخته می‌شود و هرگز تکراری نیست.
import * as db from '../core/db.js';
import { makeInvoiceCode } from '../core/invoiceCode.js';
import { DAY_MS } from '../core/format.js';
import { byId } from './customers.js';

export const RANGES = [
  { value: 0, label: 'همه‌ی زمان‌ها' },
  { value: 30, label: '۳۰ روز اخیر' },
  { value: 90, label: '۹۰ روز اخیر' }
];

export function list({ rangeDays = 0 } = {}, key = db.activeBizKey(), now = Date.now()) {
  const b = db.bucket(key);
  return b.invoices
    .filter((i) => !rangeDays || i.issued >= now - rangeDays * DAY_MS)
    .sort((a, c) => c.issued - a.issued);
}

export const paidTotal = (inv) => (inv.payments || []).reduce((sum, p) => sum + p.amount, 0);
export const remaining = (inv) => Math.max(0, inv.amount - paidTotal(inv));

export function statusOf(inv, now = Date.now()) {
  if (inv.draft) return 'draft';
  const paid = paidTotal(inv);
  if (paid >= inv.amount) return 'paid';
  if (inv.due < now) return 'overdue';
  if (paid > 0) return 'partial';
  return 'issued';
}

export const STATUS_LABEL = {
  draft: 'پیش‌نویس',
  issued: 'صادر شده',
  partial: 'پرداخت جزئی',
  overdue: 'معوق',
  paid: 'پرداخت شده'
};

function freshCode(ts, key) {
  const taken = new Set(db.bucket(key).invoices.map((i) => i.code));
  return makeInvoiceCode(ts, taken);
}

export function create({ customerId, amount, dueDays = 14, draft = false, notes = '' }, key = db.activeBizKey()) {
  const customer = byId(customerId, key);
  if (!customer) return { error: 'مشتری انتخاب نشده است.' };
  if (!(amount > 0)) return { error: 'مبلغ فاکتور باید بیشتر از صفر باشد.' };
  const b = db.bucket(key);
  const issued = Date.now();
  const inv = {
    id: db.nextId('nextInv', key),
    no: 0,
    code: freshCode(issued, key),
    customerId,
    custName: customer.name,
    amount: Math.round(amount),
    issued,
    due: issued + dueDays * DAY_MS,
    draft: !!draft,
    notes: String(notes || '').trim(),
    payments: []
  };
  inv.no = inv.id;
  b.invoices.push(inv);
  customer.log.push({ at: issued, type: 'invoice', text: `فاکتور ${inv.code} ${draft ? 'به‌صورت پیش‌نویس ثبت شد' : 'صادر شد'}` });
  db.touch();
  return { invoice: inv };
}

export function update(id, { amount, dueDays, draft, notes }, key = db.activeBizKey()) {
  const inv = find(id, key);
  if (!inv) return { error: 'فاکتور پیدا نشد.' };
  if (!(amount > 0)) return { error: 'مبلغ فاکتور باید بیشتر از صفر باشد.' };
  inv.amount = Math.round(amount);
  if (dueDays) inv.due = inv.issued + dueDays * DAY_MS;
  inv.draft = !!draft;
  inv.notes = String(notes || '').trim();
  byId(inv.customerId, key)?.log.push({ at: Date.now(), type: 'edit', text: `فاکتور ${inv.code} ویرایش شد` });
  db.touch();
  return { invoice: inv };
}

export function addPayment(id, amount, key = db.activeBizKey()) {
  const inv = find(id, key);
  if (!inv) return { error: 'فاکتور پیدا نشد.' };
  if (inv.draft) return { error: 'پیش‌نویس قابل پرداخت نیست؛ ابتدا آن را صادر کن.' };
  if (!(amount > 0)) return { error: 'مبلغ پرداخت باید بیشتر از صفر باشد.' };
  if (amount > remaining(inv)) return { error: 'مبلغ پرداخت از مانده‌ی فاکتور بیشتر است.' };
  const at = Date.now();
  inv.payments.push({ at, amount: Math.round(amount) });
  byId(inv.customerId, key)?.log.push({ at, type: 'payment', text: `پرداخت ${inv.code}` });
  db.touch();
  return { invoice: inv };
}

export function copy(id, key = db.activeBizKey()) {
  const src = find(id, key);
  if (!src) return { error: 'فاکتور پیدا نشد.' };
  const b = db.bucket(key);
  const issued = Date.now();
  const inv = {
    id: db.nextId('nextInv', key),
    no: 0,
    code: freshCode(issued, key),
    customerId: src.customerId,
    custName: src.custName,
    amount: src.amount,
    issued,
    due: issued + (src.due - src.issued),
    draft: true,
    notes: src.notes,
    payments: []
  };
  inv.no = inv.id;
  b.invoices.push(inv);
  db.touch();
  return { invoice: inv };
}

export function remove(id, key = db.activeBizKey()) {
  const b = db.bucket(key);
  const idx = b.invoices.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  const [inv] = b.invoices.splice(idx, 1);
  db.touch();
  return { invoice: inv, index: idx };
}

export function restore(snapshot, key = db.activeBizKey()) {
  if (!snapshot) return;
  const b = db.bucket(key);
  b.invoices.splice(Math.min(snapshot.index, b.invoices.length), 0, snapshot.invoice);
  db.touch();
}

export function find(id, key = db.activeBizKey()) {
  return db.bucket(key).invoices.find((i) => i.id === id) || null;
}

export function forCustomer(customerId, key = db.activeBizKey()) {
  return db.bucket(key).invoices.filter((i) => i.customerId === customerId).sort((a, c) => c.issued - a.issued);
}
