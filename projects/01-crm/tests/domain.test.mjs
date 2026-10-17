// تست‌های منطق بدون مرورگر: node tests/domain.test.mjs
import assert from 'node:assert/strict';
import * as store from '../app/js/core/store.js';
import { gregorianToJalali, stampCode, formatDate, addDays, dayDiff } from '../app/js/core/jalali.js';
import { BUSINESS_KEYS } from '../app/js/config/businesses.js';
import { COLORWAYS } from '../app/js/config/colorways.js';
import { ensureSeed, SEED_COUNT } from '../app/js/data/seed.js';
import * as cust from '../app/js/domain/customers.js';
import * as inv from '../app/js/domain/invoices.js';
import { toEn, parseMoney, phoneOk, money } from '../app/js/core/format.js';
import { can } from '../app/js/config/roles.js';

let passed = 0;
const tests = [];
const test = (name, fn) => tests.push({ name, fn });

store.load();

test('تاریخ شمسی: ۲۰۲۶/۱۰/۱۷ = ۱۴۰۵/۰۷/۲۵', () => {
  assert.deepEqual(gregorianToJalali(2026, 10, 17), { jy: 1405, jm: 7, jd: 25 });
  assert.deepEqual(gregorianToJalali(2026, 3, 21), { jy: 1405, jm: 1, jd: 1 });
});

test('کد فاکتور از تاریخ و زمان ثبت ساخته می‌شود', () => {
  const ms = new Date(2026, 9, 17, 14, 59, 2).getTime();
  assert.equal(stampCode(ms), '14050725-145902');
});

test('ارقام فارسی و مبلغ و موبایل', () => {
  assert.equal(toEn('۰۹۱۲۳۴۵۶۷۸۹'), '09123456789');
  assert.equal(phoneOk('۰۹۱۲۳۴۵۶۷۸۹'), true);
  assert.equal(phoneOk('0912345678'), false);
  assert.equal(parseMoney('۱,۵۰۰,۰۰۰'), 1500000);
  assert.equal(money(1500000), '۱,۵۰۰,۰۰۰ تومان');
});

test('روز اختلاف و افزودن روز', () => {
  const now = new Date(2026, 9, 17, 9).getTime();
  assert.equal(dayDiff(addDays(now, 3), now), 3);
  assert.equal(dayDiff(addDays(now, -2), now), -2);
  assert.equal(formatDate(now), '۱۴۰۵/۰۷/۲۵');
});

test('پنج کسب‌وکار و بیست رنگ‌بندی با شناسه‌ی یکتا', () => {
  assert.equal(BUSINESS_KEYS.length, 5);
  assert.equal(COLORWAYS.length, 20);
  assert.equal(new Set(COLORWAYS.map((c) => c.id)).size, 20);
});

test('هر کسب‌وکار ۱۵۰ رکورد نمونه دارد و داده‌ی نمونه ثابت است', () => {
  for (const key of BUSINESS_KEYS) {
    store.get().activeBiz = key;
    ensureSeed(key);
    const b = store.bucketOf(key);
    assert.equal(b.customers.length, SEED_COUNT, key);
    assert.ok(b.invoices.length > 0, `${key} فاکتور دارد`);
    for (const c of b.customers) assert.ok(c.stage >= 0 && c.stage < 5);
    const ids = new Set(b.customers.map((c) => c.id));
    assert.equal(ids.size, SEED_COUNT, `${key} شناسه‌ی یکتا`);
  }
});

test('قاعده‌ی مبلغ: مرحله‌ی پیش‌فاکتور بدون مبلغ جابه‌جا نمی‌شود', () => {
  store.get().activeBiz = 'parts';
  const r = cust.createCustomer({ name: 'تست', phone: '09120000001', source: 'وب‌سایت', stage: 0 });
  assert.ok(r.customer);
  const moved = cust.moveStage(r.customer.id, 2);
  assert.match(moved.error, /مبلغ/);
  cust.updateCustomer(r.customer.id, { name: 'تست', phone: '09120000001', source: 'وب‌سایت', stage: 2, amount: 5000000 });
  assert.equal(cust.byId(r.customer.id).stage, 2);
});

test('اعتبارسنجی فرم مشتری', () => {
  const errs = cust.validateCustomer({ name: '', phone: '123', source: '', stage: 0 });
  assert.ok(errs.name && errs.phone && errs.source);
});

test('حذف با بازگردانی همه‌ی فاکتورهای مشتری را برمی‌گرداند', () => {
  store.get().activeBiz = 'parts';
  const b = store.bucketOf('parts');
  const target = b.invoices[0].customerId;
  const before = { c: b.customers.length, i: b.invoices.length };
  const { snapshot } = cust.removeCustomer(target);
  assert.equal(b.customers.length, before.c - 1);
  cust.restoreCustomer(snapshot);
  assert.equal(b.customers.length, before.c);
  assert.equal(b.invoices.length, before.i);
});

test('فاکتور: جمع، تخفیف، پرداخت و وضعیت', () => {
  store.get().activeBiz = 'uniform';
  const customer = store.bucketOf('uniform').customers[0];
  const r = inv.createInvoice({ customerId: customer.id, items: [{ title: 'کاپشن', qty: 2, price: 1000000 }, { title: 'لوگو', qty: 1, price: 500000 }], discount: 100000, status: 'issued', dueAt: null });
  assert.ok(r.invoice, JSON.stringify(r.errors));
  const t = inv.totals(r.invoice);
  assert.equal(t.subtotal, 2500000);
  assert.equal(t.total, 2400000);
  assert.equal(inv.invoiceStatus(r.invoice), 'pending');
  assert.ok(inv.addPayment(r.invoice.id, 3000000).error, 'بیش از مانده رد شود');
  inv.addPayment(r.invoice.id, 2400000);
  assert.equal(inv.invoiceStatus(r.invoice), 'paid');
  const copy = inv.copyInvoice(r.invoice.id);
  assert.equal(copy.invoice.status, 'draft');
  assert.notEqual(copy.invoice.no, r.invoice.no);
  assert.equal(copy.invoice.payments.length, 0);
});

test('سطح دسترسی: فقط مدیر حذف دائمی دارد', () => {
  assert.equal(can('manager', 'customer.purge'), true);
  assert.equal(can('sales', 'customer.purge'), false);
  assert.equal(can('support', 'invoice.write'), false);
  assert.equal(can('support', 'customer.write'), true);
});

for (const t of tests) {
  try {
    t.fn();
    passed += 1;
    console.log('PASS', t.name);
  } catch (err) {
    console.log('FAIL', t.name, '\n   ', err.message.split('\n')[0]);
  }
}
console.log(`\n${passed}/${tests.length} passed`);
process.exitCode = passed === tests.length ? 0 : 1;
