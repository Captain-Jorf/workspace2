// تصویر فاکتور برای اشتراک‌گذاری (canvas) و چاپ. فونت برنامه روی تصویر هم استفاده می‌شود.
import { h, clear } from '../core/dom.js';
import { money, toFa } from '../core/format.js';
import { formatDate } from '../core/jalali.js';
import * as inv from '../domain/invoices.js';
import { openDialog } from '../ui/dialog.js';
import { toast } from '../ui/toast.js';

const W = 900;

function rowsOf(invoice) {
  return invoice.items.map((it) => ({ title: it.title, qty: it.qty, price: it.price, sum: it.qty * it.price }));
}

/** تصویر PNG فاکتور را می‌سازد و Blob برمی‌گرداند */
export async function renderInvoiceImage(invoice, customer) {
  const t = inv.totals(invoice);
  const rows = rowsOf(invoice);
  const H = 380 + rows.length * 56 + 200;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext('2d');
  try { await document.fonts.load('600 32px Shoor'); } catch { /* فونت پیش‌فرض */ }
  const font = (weight, size) => `${weight} ${size}px Shoor, Tahoma, sans-serif`;

  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#d9ebf7');
  bg.addColorStop(0.35, '#eef6fb');
  bg.addColorStop(1, '#ffffff');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#ffffff';
  g.fillRect(40, 40, W - 80, H - 80);
  g.direction = 'rtl';
  g.textAlign = 'right';
  g.fillStyle = '#12293a';

  g.font = font('700', 40);
  g.fillText('فاکتور', W - 80, 110);
  g.font = font('400', 22);
  g.fillStyle = '#5b7083';
  g.fillText(`شماره: ${toFa(invoice.no)}`, W - 80, 150);
  g.fillText(`تاریخ صدور: ${formatDate(invoice.createdAt)}`, W - 80, 180);
  g.textAlign = 'left';
  g.fillText(invoice.dueAt ? `سررسید: ${formatDate(invoice.dueAt)}` : 'بدون سررسید', 80, 180);

  g.textAlign = 'right';
  g.fillStyle = '#12293a';
  g.font = font('600', 24);
  g.fillText('مشتری', W - 80, 232);
  g.font = font('400', 26);
  g.fillText(customer?.name || '—', W - 80, 268);

  const top = 320;
  g.fillStyle = '#eef6fb';
  g.fillRect(80, top, W - 160, 48);
  g.fillStyle = '#12293a';
  g.font = font('600', 20);
  g.fillText('شرح', W - 100, top + 32);
  g.textAlign = 'center';
  g.fillText('تعداد', 520, top + 32);
  g.fillText('قیمت واحد', 680, top + 32);
  g.textAlign = 'left';
  g.fillText('جمع', 100, top + 32);

  g.font = font('400', 22);
  rows.forEach((r, i) => {
    const y = top + 48 + 56 * (i + 1) - 14;
    g.textAlign = 'right';
    g.fillText(r.title, W - 100, y);
    g.textAlign = 'center';
    g.fillText(toFa(r.qty), 520, y);
    g.fillText(toFa(r.price.toLocaleString('en-US')), 680, y);
    g.textAlign = 'left';
    g.fillText(toFa(r.sum.toLocaleString('en-US')), 100, y);
    g.fillStyle = '#e4edf4';
    g.fillRect(80, y + 14, W - 160, 1);
    g.fillStyle = '#12293a';
  });

  const sumTop = top + 48 + 56 * (rows.length + 1);
  g.textAlign = 'right';
  g.font = font('400', 24);
  const lines = [['جمع اقلام', money(t.subtotal)], ['تخفیف', money(t.discount)], ['مبلغ قابل پرداخت', money(t.total)]];
  lines.forEach(([label, value], i) => {
    g.fillStyle = i === 2 ? '#12293a' : '#5b7083';
    g.font = font(i === 2 ? '700' : '400', i === 2 ? 28 : 24);
    g.textAlign = 'right';
    g.fillText(label, W - 100, sumTop + i * 42);
    g.textAlign = 'left';
    g.fillText(value, 100, sumTop + i * 42);
  });
  g.fillStyle = '#5b7083';
  g.textAlign = 'right';
  g.font = font('400', 20);
  g.fillText(`پرداخت‌شده: ${money(t.paid)}   ·   مانده: ${money(t.due)}`, W - 100, H - 90);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
}

/** پنجره‌ی اشتراک‌گذاری: بلافاصله باز می‌شود؛ تصویر پس از ساخت جایگزین حالت «در حال ساخت» می‌شود. */
export async function openInvoiceShare(invoice, customer) {
  const state = { url: null, closed: false, file: null, canShareFile: false };
  const preview = h('img', { class: 'share-preview', alt: `تصویر فاکتور ${invoice.no}` });
  const status = h('p', { class: 'muted small', text: 'در حال ساختن تصویر…' });
  const shareBtn = { label: 'اشتراک‌گذاری با برنامه…', variant: 'primary', disabled: true, onClick: async (close) => {
    try {
      await navigator.share({ files: [state.file], title: `فاکتور ${invoice.no}` });
      close();
    } catch (err) {
      if (err?.name !== 'AbortError') toast('اشتراک‌گذاری انجام نشد', { tone: 'warn' });
    }
  } };
  const downloadBtn = { label: 'دانلود تصویر', variant: 'secondary', disabled: true, onClick: () => {
    const a = h('a', { href: state.url, download: `invoice-${invoice.no}.png` });
    document.body.append(a);
    a.click();
    a.remove();
    toast('تصویر فاکتور دانلود شد');
  } };
  const handle = openDialog({
    kind: 'modal',
    size: 'wide',
    onClose: () => {
      state.closed = true;
      if (state.url) URL.revokeObjectURL(state.url);
    },
    title: 'اشتراک‌گذاری فاکتور',
    sub: `تصویر فاکتور ${invoice.no}`,
    body: h('div', { class: 'share-body' }, status, preview),
    actions: [{ label: 'بستن', variant: 'ghost', onClick: (close) => close() }, downloadBtn, shareBtn]
  });

  const blob = await renderInvoiceImage(invoice, customer);
  if (state.closed) return handle;
  state.url = URL.createObjectURL(blob);
  const fileName = `invoice-${invoice.no}.png`;
  state.file = typeof File === 'function' ? new File([blob], fileName, { type: 'image/png' }) : null;
  state.canShareFile = !!(state.file && navigator.canShare && navigator.canShare({ files: [state.file] }));
  preview.src = state.url;
  status.textContent = state.canShareFile
    ? 'می‌توانی با یکی از برنامه‌های گوشی یا رایانه بفرستی یا دانلود کنی.'
    : 'این مرورگر ارسال فایل را پشتیبانی نمی‌کند؛ تصویر را دانلود کن.';
  const foot = [...handle.panel.querySelectorAll('.panel-foot button')];
  if (foot[1]) foot[1].disabled = false;
  if (foot[2] && state.canShareFile) foot[2].disabled = false;
  return handle;
}

/** چاپ فاکتور: محتوای چاپی در #printArea ساخته می‌شود و فقط آن در چاپ دیده می‌شود */
export function printInvoice(invoice, customer) {
  const t = inv.totals(invoice);
  const area = document.getElementById('printArea');
  clear(area);
  area.append(
    h('div', { class: 'print-sheet' },
      h('header', {}, h('h1', { text: 'فاکتور' }), h('p', { text: `شماره ${invoice.no} · ${formatDate(invoice.createdAt)}` })),
      h('p', { text: `مشتری: ${customer?.name || '—'}` }),
      h('table', {},
        h('thead', {}, h('tr', {}, h('th', { text: 'شرح' }), h('th', { text: 'تعداد' }), h('th', { text: 'قیمت واحد' }), h('th', { text: 'جمع' }))),
        h('tbody', {}, ...invoice.items.map((it) => h('tr', {},
          h('td', { text: it.title }), h('td', { text: toFa(it.qty) }),
          h('td', { text: money(it.price) }), h('td', { text: money(it.qty * it.price) }))))),
      h('p', { class: 'print-total', text: `مبلغ قابل پرداخت: ${money(t.total)} · مانده: ${money(t.due)}` })));
  window.print();
}
