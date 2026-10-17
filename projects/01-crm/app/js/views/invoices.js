// فاکتورها: چیدمان دو ستونه (فهرست + جزئیات). دکمه‌های عملیات: ثبت پرداخت، ویرایش، کپی، چاپ، اشتراک‌گذاری، حذف.
import { h } from '../core/dom.js';
import { money, parseMoney, plural } from '../core/format.js';
import { formatDate, formatDateTime } from '../core/jalali.js';
import { BUSINESSES } from '../config/businesses.js';
import { can } from '../config/roles.js';
import * as inv from '../domain/invoices.js';
import * as cust from '../domain/customers.js';
import * as store from '../core/store.js';
import { openDialog, confirmDialog } from '../ui/dialog.js';
import { toast } from '../ui/toast.js';
import { field, applyErrors, bindCtrlEnter } from '../features/forms.js';
import { openInvoiceForm } from '../features/invoiceForm.js';
import { openInvoiceShare, printInvoice } from '../features/invoiceShare.js';
import { emptyState } from './parts.js';
import { ctx } from '../ui/context.js';

export const meta = {
  label: 'فاکتورها',
  icon: '▤',
  title: 'فاکتورها',
  sub: () => `${BUSINESSES[store.get().activeBiz].title} · فهرست و جزئیات فاکتور`,
  chips: false,
  actions: ['invoice']
};

const STATUS_TONE = { draft: 'draft', pending: 'pending', overdue: 'overdue', paid: 'paid' };

export function render(root, { refresh }) {
  const key = store.get().activeBiz;
  const role = store.get().session?.role;
  const writable = can(role, 'invoice.write');
  const now = Date.now();
  const rows = inv.list(ctx.invFilter, key, now);

  const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'فیلتر فاکتور' },
    ...inv.INVOICE_FILTERS.map((f) => h('button', {
      class: 'chip', type: 'button', 'aria-pressed': String(ctx.invFilter === f.id),
      onClick: () => { ctx.invFilter = f.id; refresh(); }
    }, f.label)));

  const list = h('div', { class: 'split-list' });
  if (!rows.length) list.append(emptyState('فاکتوری نیست', 'با دکمه‌ی «فاکتور جدید» اولین فاکتور را بساز.'));
  for (const i of rows) {
    const c = cust.byId(i.customerId, key);
    const status = inv.invoiceStatus(i, now);
    const t = inv.totals(i);
    list.append(h('button', {
      class: `inv-row${ctx.invId === i.id ? ' on' : ''}`, type: 'button', dataset: { id: String(i.id) },
      onClick: () => { select(i.id); refresh(); }
    },
    h('div', { class: 'inv-row-top' },
      h('strong', { class: 'ltr', text: i.no }),
      h('span', { class: `status ${STATUS_TONE[status]}`, text: inv.STATUS_LABEL[status] })),
    h('div', { class: 'muted small', text: `${c?.name || 'بدون مشتری'} · ${formatDate(i.createdAt)}` }),
    h('div', { class: 'inv-row-amount', text: money(t.total) })));
  }

  const selectedId = ctx.invId;
  const selected = rows.find((i) => i.id === selectedId) || rows[0] || null;
  if (selected && selected.id !== selectedId) ctx.invId = selected.id;

  root.append(
    h('div', { class: 'toolbar' }, chips),
    h('div', { class: 'split' },
      h('section', { class: 'split-col list-col' },
        h('p', { class: 'muted small', text: `${plural(rows.length, 'فاکتور', 'فاکتور')}` }),
        list),
      h('section', { class: 'split-col detail-col' },
        selected ? detail(selected) : emptyState('فاکتوری انتخاب نشده', 'یک فاکتور را از فهرست انتخاب کن.')))
  );

  function select(id) {
    ctx.invId = id;
  }

  function detail(i) {
    const c = cust.byId(i.customerId, key);
    const t = inv.totals(i);
    const status = inv.invoiceStatus(i, now);
    const btn = (label, onClick, variant = '', disabled = false) => h('button', { class: `btn ${variant}`.trim(), type: 'button', disabled, onClick }, label);
    const actions = h('div', { class: 'invoice-actions', role: 'toolbar', 'aria-label': 'عملیات فاکتور' },
      writable && t.due > 0 && i.status !== 'draft' ? btn('ثبت پرداخت', () => paymentDialog(i), 'primary') : null,
      writable ? btn('ویرایش', () => openInvoiceForm({ invoice: i, onSaved: refresh })) : null,
      writable ? btn('کپی', () => {
        const r = inv.copyInvoice(i.id, key, Date.now());
        if (r.invoice) {
          select(r.invoice.id);
          toast(`کپی فاکتور با شماره‌ی ${r.invoice.no} ساخته شد`);
        }
      }) : null,
      btn('چاپ', () => printInvoice(i, c)),
      btn('اشتراک‌گذاری', () => openInvoiceShare(i, c)),
      writable ? btn('حذف', () => confirmDialog({
        title: 'حذف فاکتور',
        message: `فاکتور ${i.no} حذف شود؟ تا ۵ ثانیه می‌توانی بازگردانی.`,
        confirmLabel: 'حذف',
        danger: true,
        onConfirm: () => {
          const r = inv.removeInvoice(i.id, key);
          if (!r.snapshot) return;
          select(null);
          toast('فاکتور حذف شد', { actionLabel: 'بازگردانی', onAction: () => { inv.restoreInvoice(r.snapshot, key); refresh(); } });
        }
      }), 'danger') : null);

    const paid = i.payments.map((p) => h('div', { class: 'report-row' },
      h('span', { class: 'grow', text: formatDateTime(p.at) }),
      h('strong', { text: money(p.amount) })));

    return h('article', { class: 'invoice-card' },
      h('header', { class: 'invoice-head' },
        h('div', {},
          h('h2', { class: 'ltr', text: i.no }),
          h('p', { class: 'muted small', text: `${c?.name || 'بدون مشتری'} · صادر: ${formatDateTime(i.createdAt)}` })),
        h('span', { class: `status ${STATUS_TONE[status]}`, text: inv.STATUS_LABEL[status] })),
      actions,
      h('dl', { class: 'kv' },
        kv('سررسید', i.dueAt ? formatDate(i.dueAt) : 'بدون سررسید'),
        kv('مانده', money(t.due)),
        i.notes ? kv('یادداشت', i.notes) : null),
      h('div', { class: 'tbl-wrap' },
        h('table', { class: 'tbl items-view' },
          h('thead', {}, h('tr', {}, h('th', { text: 'شرح' }), h('th', { text: 'تعداد' }), h('th', { text: 'قیمت واحد' }), h('th', { text: 'جمع' }))),
          h('tbody', {}, ...i.items.map((it) => h('tr', {},
            h('td', { text: it.title }), h('td', { text: String(it.qty) }),
            h('td', { text: money(it.price) }), h('td', { text: money(it.qty * it.price) })))))),
      h('div', { class: 'totals' },
        h('div', { class: 'totals-row' }, h('span', { text: 'جمع اقلام' }), h('strong', { text: money(t.subtotal) })),
        h('div', { class: 'totals-row' }, h('span', { text: 'تخفیف' }), h('strong', { text: money(t.discount) })),
        h('div', { class: 'totals-row total' }, h('span', { text: 'مبلغ قابل پرداخت' }), h('strong', { text: money(t.total) }))),
      paid.length ? h('section', { class: 'dsec' }, h('h3', { text: 'پرداخت‌ها' }), ...paid) : null);
  }

  function paymentDialog(i) {
    const due = inv.totals(i).due;
    const amount = h('input', { class: 'input', inputmode: 'numeric', value: String(due) });
    const body = h('div', { class: 'form-grid' },
      field('مبلغ پرداخت (تومان)', amount, { key: 'amount', hint: `مانده: ${money(due)}`, wide: true }));
    const submit = (close) => {
      const r = inv.addPayment(i.id, parseMoney(amount.value), key);
      if (r.error) {
        applyErrors(body, { amount: r.error });
        return;
      }
      close();
      toast('پرداخت ثبت شد');
      refresh();
    };
    const handle = openDialog({
      kind: 'modal', size: 'small', title: 'ثبت پرداخت', sub: `فاکتور ${i.no}`,
      body,
      actions: [
        { label: 'انصراف', variant: 'ghost', onClick: (close) => close() },
        { label: 'ثبت پرداخت', variant: 'primary', onClick: (close) => submit(close) }
      ]
    });
    bindCtrlEnter(handle.panel, () => submit(handle.close));
    amount.focus();
    amount.select();
  }
}

const kv = (label, value) => h('div', { class: 'kv-row' }, h('dt', { text: label }), h('dd', { text: value }));
