// جزئیات مشتری: اطلاعات کامل، توضیحات، گزارش‌های مرتبط، سابقه و اقدام‌ها.
import * as db from '../core/db.js';
import { h } from '../core/dom.js';
import { money, jDateTime, followUpLabel, dayDiff, toFa } from '../core/format.js';
import { BUSINESSES } from '../config/businesses.js';
import { can } from '../core/permissions.js';
import * as auth from '../domain/auth.js';
import { byId, stageFlags, setArchived, removeCustomer, restoreCustomer, activityLabel, snooze } from '../domain/customers.js';
import { forCustomer, paidTotal, remaining, statusOf, STATUS_LABEL } from '../domain/invoices.js';
import { openDialog, closeDialog, confirmDialog, toast } from '../ui/dialog.js';
import { openCustomerForm } from './customerForm.js';
import { openActivity } from './activity.js';
import { openInvoiceForm } from './invoiceForm.js';
import { displayExtra } from './extraFields.js';

const section = (title, ...children) => h('section', { class: 'dsec' }, h('h3', { text: title }), ...children);
const row = (label, value) => h('div', { class: 'kv' }, h('span', { class: 'k', text: label }), h('span', { class: 'v' }, value));

export function openCustomerDetail(id, { onChange = () => {} } = {}) {
  const key = db.activeBizKey();
  const biz = BUSINESSES[key];
  const c = byId(id, key);
  if (!c) { toast('این مشتری پیدا نشد.'); return; }
  const role = auth.session()?.role;
  const flags = stageFlags(c.stage, key);
  const invs = forCustomer(c.id, key);
  const active = invs.filter((i) => !i.draft);
  const outstanding = active.reduce((s, i) => s + remaining(i), 0);
  const collected = invs.reduce((s, i) => s + paidTotal(i), 0);
  const follow = followUpLabel(c.next);
  const reopen = () => { onChange(); openCustomerDetail(id, { onChange }); };

  const kpis = h('div', { class: 'kpis small' },
    kpi('مبلغ', money(c.amount)),
    kpi('مرحله', biz.stages[c.stage]),
    kpi('پیگیری بعدی', follow.text, follow.tone),
    kpi('مانده‌ی فاکتور', money(outstanding)));

  const basic = section('اطلاعات',
    row('موبایل', c.phone),
    row('منبع آشنایی', c.source),
    row('ثبت', jDateTime(c.createdAt)),
    row('آخرین تغییر مرحله', jDateTime(c.stageSince)),
    ...biz.fields.map((f) => row(f.l, displayExtra(f, c.extra?.[f.k]))));

  const notesBlock = section('توضیحات',
    c.notes ? h('p', { class: 'longtext' }, c.notes) : h('p', { class: 'muted' }, 'توضیحاتی ثبت نشده است.'));

  const invoiceRows = invs.length
    ? h('table', { class: 'tbl compact' },
      h('thead', {}, h('tr', {}, h('th', { text: 'شماره' }), h('th', { text: 'تاریخ' }), h('th', { text: 'مبلغ' }), h('th', { text: 'وضعیت' }))),
      h('tbody', {}, invs.map((i) => h('tr', {},
        h('td', { class: 'num' }, toFa(i.code)),
        h('td', {}, jDateTime(i.issued)),
        h('td', { class: 'num' }, money(i.amount)),
        h('td', {}, STATUS_LABEL[statusOf(i)])))))
    : h('p', { class: 'muted' }, 'هنوز فاکتوری برای این مشتری صادر نشده است.');

  const reports = section('گزارش‌های مرتبط',
    row('روز از ثبت', toFa(Math.max(0, -dayDiff(c.createdAt)))),
    row('روز در مرحله‌ی فعلی', toFa(Math.max(0, -dayDiff(c.stageSince)))),
    row('تعداد فعالیت‌ها', toFa(c.log.filter((l) => ['call', 'message', 'meeting', 'email'].includes(l.type)).length)),
    row('فاکتورهای صادرشده', toFa(active.length)),
    row('مجموع پرداخت‌شده', money(collected)),
    invoiceRows);

  const history = section('سابقه',
    h('ul', { class: 'timeline' }, [...c.log].sort((a, b) => b.at - a.at).slice(0, 25).map((l) =>
      h('li', {}, h('time', { text: jDateTime(l.at) }), h('span', { text: l.type === 'call' || l.type === 'message' || l.type === 'meeting' || l.type === 'email' ? `${activityLabel(l.type)}: ${l.text}` : l.text })))));

  const danger = can(role, 'customer.delete')
    ? h('div', { class: 'danger-zone' },
      h('span', { class: 'muted' }, 'حذف دائمی را فقط مدیر می‌تواند انجام دهد.'),
      h('button', { class: 'btn danger', type: 'button', onClick: () => deleteCustomer() }, 'حذف مشتری'))
    : null;

  const body = h('div', { class: 'detail' },
    h('header', { class: 'detail-head' },
      h('div', {}, h('h3', { text: c.name }), h('p', { class: 'sub', text: `${biz.stages[c.stage]} · ${c.phone}` })),
      flags.open && can(role, 'customer.activity')
        ? h('button', { class: 'btn ghost sm', type: 'button', onClick: () => { const r = snooze(c.id, 3); if (!r.error) { toast('پیگیری ۳ روز بعد تنظیم شد.'); reopen(); } } }, 'پیگیری ۳ روز بعد')
        : null),
    kpis, basic, notesBlock, reports, history, danger);

  const actions = [];
  if (can(role, 'customer.activity')) actions.push({ label: 'ثبت فعالیت', variant: 'primary', primary: true, onClick: () => openActivity(c.id, reopen) });
  if (can(role, 'invoice.create')) actions.push({ label: 'فاکتور جدید', variant: '', onClick: () => openInvoiceForm({ customerId: c.id, onDone: reopen }) });
  if (can(role, 'customer.edit')) actions.push({ label: 'ویرایش', variant: '', onClick: () => openCustomerForm({ customer: c, onSaved: () => onChange() }) });
  if (can(role, 'customer.archive')) actions.push({ label: 'بایگانی', variant: 'ghost', onClick: () => { setArchived(c.id, true); toast('به بایگانی رفت.'); onChange(); closeDialog(); } });

  openDialog({ kind: 'drawer', title: 'جزئیات مشتری', sub: biz.title, body, actions: actions.reverse() });

  async function deleteCustomer() {
    const ok = await confirmDialog({ title: 'حذف مشتری', message: `«${c.name}» و فاکتورهایش حذف شود؟`, confirmLabel: 'حذف مشتری', danger: true });
    if (!ok) return;
    const snap = removeCustomer(c.id, key);
    closeDialog();
    onChange();
    if (snap) toast('مشتری حذف شد.', { ms: 5000, action: { label: 'بازگردانی', run: () => { restoreCustomer(snap, key); onChange(); } } });
  }
}

const kpi = (label, value, tone = '') => h('div', { class: `kpi-mini ${tone}`.trim() },
  h('span', { class: 'k', text: label }), h('strong', { class: 'v', text: value }));
