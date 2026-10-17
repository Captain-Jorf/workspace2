// پنجره‌ی جزئیات مشتری: اطلاعات کامل، گزارش‌های مرتبط (فعالیت و فاکتور)، توضیحات، و اقدام‌های سریع.
import * as store from '../core/store.js';
import { h } from '../core/dom.js';
import { money } from '../core/format.js';
import { formatDate, formatDateTime } from '../core/jalali.js';
import { BUSINESSES } from '../config/businesses.js';
import { can } from '../config/roles.js';
import * as cust from '../domain/customers.js';
import * as inv from '../domain/invoices.js';
import { openDialog, confirmDialog } from '../ui/dialog.js';
import { toast } from '../ui/toast.js';
import { field, select, applyErrors, bindCtrlEnter } from './forms.js';
import { openCustomerForm, FOLLOW_OPTIONS, followUpFrom } from './customerForm.js';
import { openInvoiceForm } from './invoiceForm.js';

const role = () => store.get().session?.role;

export function openActivityForm({ customerId, type = 'call', onSaved = () => {} }) {
  const key = store.get().activeBiz;
  const typeSel = select(cust.ACTIVITY_TYPES.map((t) => ({ value: t.id, label: t.label })), type);
  const text = h('textarea', { class: 'input', rows: '3', placeholder: 'چه گفته شد؟ (اختیاری)' });
  const follow = select(FOLLOW_OPTIONS, '2');
  const body = h('div', { class: 'form-grid' },
    field('نوع فعالیت', typeSel, { key: 'type' }),
    field('پیگیری بعدی', follow, { key: 'follow' }),
    field('یادداشت فعالیت', text, { key: 'text', wide: true }));
  const submit = (close) => {
    const r = cust.logActivity(customerId, { type: typeSel.value, text: text.value, follow: followUpFrom(follow.value) }, key);
    if (r.error) {
      applyErrors(body, { text: r.error });
      return;
    }
    close();
    toast('فعالیت ثبت شد');
    onSaved(r.customer);
  };
  const handle = openDialog({
    kind: 'modal', size: 'small', title: 'ثبت فعالیت', sub: 'Ctrl+Enter برای ذخیره',
    body,
    actions: [
      { label: 'انصراف', variant: 'ghost', onClick: (close) => close() },
      { label: 'ثبت فعالیت', variant: 'primary', onClick: (close) => submit(close) }
    ]
  });
  bindCtrlEnter(handle.panel, () => submit(handle.close));
  return handle;
}

/** openCustomerDetail(id, { onChange }) */
export function openCustomerDetail(id, { onChange = () => {} } = {}) {
  const key = store.get().activeBiz;
  const cfg = BUSINESSES[key];
  let handle = null;

  const reopen = () => {
    if (handle) handle.close();
    openCustomerDetail(id, { onChange });
  };

  const c = cust.byId(id, key);
  if (!c) return null;
  const canWrite = can(role(), 'customer.write');
  const invoices = inv.forCustomer(id, key);
  const due = invoices.reduce((s, i) => s + inv.totals(i).due, 0);
  const follow = cust.dueSoonLabel(c);

  const stageSel = select(cfg.stages.map((s, i) => ({ value: String(i), label: s.label })), String(c.stage));
  stageSel.disabled = !canWrite;
  stageSel.addEventListener('change', () => {
    const r = cust.moveStage(id, stageSel.value, key);
    if (r.error) {
      toast(r.error, { tone: 'warn' });
      stageSel.value = String(c.stage);
      return;
    }
    toast('مرحله تغییر کرد');
    onChange();
    reopen();
  });

  const summary = h('div', { class: 'summary' },
    summaryItem('مرحله', h('div', { class: 'stage-row' }, stageSel)),
    summaryItem('مبلغ', c.amount ? money(c.amount) : '—'),
    summaryItem('پیگیری بعدی', h('span', { class: `follow ${follow.tone}`, text: `${follow.text}${c.followUpAt !== null ? ` · ${formatDate(c.followUpAt)}` : ''}` })),
    summaryItem('مانده‌ی فاکتور', due ? money(due) : 'تسویه'));

  const actions = h('div', { class: 'row-actions' },
    canWrite ? h('button', { class: 'btn primary', type: 'button', onClick: () => openActivityForm({ customerId: id, onSaved: reopen }) }, 'ثبت فعالیت') : null,
    canWrite ? h('button', { class: 'btn', type: 'button', onClick: () => openActivityForm({ customerId: id, type: 'call', onSaved: reopen }) }, 'تماس') : null,
    canWrite ? h('button', { class: 'btn', type: 'button', onClick: () => {
      cust.snooze(id, 3, key);
      toast('پیگیری به ۳ روز بعد منتقل شد');
      reopen();
    } }, '۳ روز بعد') : null,
    canWrite ? h('button', { class: 'btn', type: 'button', onClick: () => openInvoiceForm({ customerId: id, onSaved: reopen }) }, 'فاکتور جدید') : null,
    canWrite ? h('button', { class: 'btn ghost', type: 'button', onClick: () => openCustomerForm({ customer: c, onSaved: () => { onChange(); reopen(); } }) }, 'ویرایش') : null,
    canWrite ? h('button', { class: 'btn ghost', type: 'button', onClick: () => {
      cust.setArchived(id, true, key);
      toast('به بایگانی منتقل شد');
      handle.close();
      onChange();
    } }, 'بایگانی') : null,
    canWrite ? h('button', { class: 'btn danger', type: 'button', onClick: () => {
      confirmDialog({
        title: 'حذف مشتری',
        message: `«${c.name}» حذف شود؟ می‌توانی تا ۵ ثانیه بازش گردانی.`,
        confirmLabel: 'حذف مشتری',
        danger: true,
        onConfirm: () => {
          const r = cust.removeCustomer(id, key);
          if (r.snapshot) {
            toast('مشتری حذف شد', { actionLabel: 'بازگردانی', onAction: () => { cust.restoreCustomer(r.snapshot, key); onChange(); } });
          }
          handle.close();
          onChange();
        }
      });
    } }, 'حذف') : null);

  const info = h('dl', { class: 'kv' },
    kv('موبایل', c.phone, 'ltr'),
    c.contact ? kv(cfg.nameStyle === 'company' ? 'مسئول' : 'تماس‌گیرنده', c.contact) : null,
    kv('منبع آشنایی', c.source),
    kv('ثبت', formatDateTime(c.createdAt)),
    kv('آخرین تغییر', formatDateTime(c.updatedAt)),
    ...cfg.fields.map((f) => kv(f.label, displayField(f, c.fields[f.key]))));

  const reports = h('div', { class: 'report-list' },
    c.activities.length
      ? c.activities.slice(0, 8).map((a) => h('div', { class: 'report-row' },
        h('span', { class: 'pill-soft', text: cust.activityLabel(a.type) }),
        h('span', { class: 'grow', text: a.text }),
        h('span', { class: 'muted small', text: formatDate(a.at) })))
      : h('p', { class: 'muted', text: 'هنوز فعالیتی ثبت نشده است.' }),
    invoices.length
      ? invoices.map((i) => h('div', { class: 'report-row' },
        h('span', { class: 'pill-soft', text: 'فاکتور' }),
        h('span', { class: 'grow ltr', text: i.no }),
        h('span', { class: 'muted small', text: money(inv.totals(i).total) }),
        h('span', { class: `status ${inv.invoiceStatus(i)}`, text: inv.STATUS_LABEL[inv.invoiceStatus(i)] })))
      : null);

  const descArea = h('textarea', { class: 'input', rows: '4', placeholder: 'توضیحات درباره‌ی این مشتری…', disabled: !canWrite }, c.description || '');
  const saveDesc = canWrite ? h('button', { class: 'btn', type: 'button', onClick: () => {
    cust.setDescription(id, descArea.value, key);
    toast('توضیحات ذخیره شد');
    onChange();
  } }, 'ذخیره‌ی توضیحات') : null;

  const body = h('div', { class: 'detail' },
    summary,
    actions,
    h('section', { class: 'dsec' }, h('h3', { text: 'اطلاعات' }), info),
    h('section', { class: 'dsec' }, h('h3', { text: 'گزارش‌های مرتبط' }), reports),
    h('section', { class: 'dsec' }, h('h3', { text: 'توضیحات' }), descArea, saveDesc));

  handle = openDialog({
    kind: 'drawer',
    title: c.name,
    sub: `${c.phone} · ${c.source}`,
    body,
    actions: [{ label: 'بستن', variant: 'ghost', onClick: (close) => close() }]
  });
  return handle;
}

function summaryItem(label, value) {
  return h('div', { class: 'summary-item' }, h('span', { class: 'muted small', text: label }), typeof value === 'string' ? h('strong', { text: value }) : value);
}

function kv(label, value, dir = '') {
  return h('div', { class: 'kv-row' }, h('dt', { text: label }), h('dd', { class: dir, text: value }));
}

function displayField(f, value) {
  if (!value) return '—';
  if (f.kind === 'money') return money(value);
  return value;
}
