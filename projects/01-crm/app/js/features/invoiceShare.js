// چاپ فاکتور و «اشتراک‌گذاری» (ساخت عکس PNG، سپس انتخاب برنامه یا دانلود).
import * as db from '../core/db.js';
import { h } from '../core/dom.js';
import { money, jDate, jDateTime, toFa } from '../core/format.js';
import { BUSINESSES } from '../config/businesses.js';
import * as invoices from '../domain/invoices.js';
import { openDialog, closeDialog, toast } from '../ui/dialog.js';
import { downloadBlob } from '../core/download.js';

/** اطلاعات یکسان برای عکس و چاپ */
export function invoiceFacts(inv, key = db.activeBizKey()) {
  return {
    title: BUSINESSES[key].title,
    code: toFa(inv.code),
    issued: jDateTime(inv.issued),
    customer: inv.custName,
    phone: byPhone(inv),
    rows: [
      ['مبلغ فاکتور', money(inv.amount)],
      ['پرداخت‌شده', money(invoices.paidTotal(inv))],
      ['مانده', money(invoices.remaining(inv))],
      ['مهلت پرداخت', jDate(inv.due)],
      ['وضعیت', invoices.STATUS_LABEL[invoices.statusOf(inv)]]
    ]
  };
}

function byPhone(inv) {
  const c = db.bucket().customers.find((x) => x.id === inv.customerId);
  return c ? c.phone : '';
}

async function drawInvoice(inv) {
  const f = invoiceFacts(inv);
  const W = 1080, H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  try {
    await Promise.all([document.fonts.load('700 44px Shoor'), document.fonts.load('400 30px Shoor')]);
  } catch (e) { /* فونت نبود؛ با قلم پیش‌فرض ادامه می‌دهیم */ }
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#dff1fb');
  bg.addColorStop(1, '#7fb8e4');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  roundRect(ctx, 60, 60, W - 120, H - 120, 40);
  ctx.fill();

  ctx.direction = 'rtl';
  ctx.fillStyle = '#12293a';
  ctx.textAlign = 'right';
  ctx.font = '700 46px Shoor, sans-serif';
  ctx.fillText(f.title, W - 110, 170);
  ctx.font = '400 30px Shoor, sans-serif';
  ctx.fillStyle = '#4b6378';
  ctx.fillText('فاکتور فروش', W - 110, 225);

  ctx.fillStyle = '#12293a';
  ctx.font = '400 28px Shoor, sans-serif';
  ctx.fillText('شماره فاکتور', W - 110, 320);
  ctx.font = '700 48px Shoor, sans-serif';
  ctx.fillText(f.code, W - 110, 378);
  ctx.font = '400 30px Shoor, sans-serif';
  ctx.fillText(`تاریخ صدور: ${f.issued}`, W - 110, 440);
  ctx.fillText(`مشتری: ${f.customer}`, W - 110, 492);
  if (f.phone) { ctx.direction = 'ltr'; ctx.textAlign = 'right'; ctx.fillText(f.phone, W - 110, 544); ctx.direction = 'rtl'; }

  ctx.strokeStyle = '#b9d7ec';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(110, 600);
  ctx.lineTo(W - 110, 600);
  ctx.stroke();

  let y = 690;
  f.rows.forEach(([label, value]) => {
    ctx.textAlign = 'right';
    ctx.font = '400 32px Shoor, sans-serif';
    ctx.fillStyle = '#4b6378';
    ctx.fillText(label, W - 110, y);
    ctx.textAlign = 'left';
    ctx.font = '700 34px Shoor, sans-serif';
    ctx.fillStyle = '#12293a';
    ctx.fillText(value, 110, y);
    y += 96;
  });

  ctx.textAlign = 'right';
  ctx.font = '400 26px Shoor, sans-serif';
  ctx.fillStyle = '#6b8196';
  ctx.fillText('نمونه‌ی کار با داده‌های ساختگی', W - 110, H - 130);
  return canvas;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function invoiceImageBlob(inv) {
  const canvas = await drawInvoice(inv);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('ساخت تصویر ناموفق بود'))), 'image/png');
  });
}

/** اشتراک‌گذاری: عکس ساخته می‌شود؛ کاربر برنامه را انتخاب می‌کند یا دانلود می‌کند */
export function openShare(invoiceId) {
  const inv = invoices.find(invoiceId);
  if (!inv) return;
  const fileName = `invoice-${inv.code}.png`;
  const img = h('img', { class: 'share-img', alt: `پیش‌نمایش فاکتور ${toFa(inv.code)}` });
  const hint = h('p', { class: 'muted', role: 'status' }, 'در حال ساخت تصویر…');
  let blob = null;
  let url = null;

  const dlg = openDialog({
    kind: 'modal',
    title: 'اشتراک‌گذاری فاکتور',
    sub: toFa(inv.code),
    body: h('div', { class: 'share' }, img, hint),
    onClose: () => url && URL.revokeObjectURL(url),
    actions: [
      { label: 'بستن', variant: 'ghost', onClick: () => closeDialog() },
      { label: 'دانلود عکس', variant: '', onClick: () => blob && downloadBlob(blob, fileName), disabled: true },
      { label: 'انتخاب برنامه', variant: 'primary', primary: true, onClick: () => share(), disabled: true }
    ]
  });
  const [, dlBtn, shareBtn] = dlg.panel.querySelectorAll('.dlg-actions .btn');

  invoiceImageBlob(inv).then((b) => {
    blob = b;
    url = URL.createObjectURL(b);
    img.src = url;
    dlBtn.disabled = false;
    const canFiles = !!(navigator.canShare && navigator.share && navigator.canShare({ files: [new File([b], fileName, { type: 'image/png' })] }));
    shareBtn.disabled = !canFiles;
    hint.textContent = canFiles
      ? 'یک برنامه را انتخاب کن (واتس‌اپ، ایمیل، ...) یا عکس را دانلود کن.'
      : 'این مرورگر ارسال مستقیم فایل ندارد؛ عکس را دانلود کن و از برنامه‌ی دلخواه بفرست.';
  }).catch(() => {
    hint.textContent = 'ساخت تصویر انجام نشد. دوباره تلاش کن.';
  });

  async function share() {
    if (!blob) return;
    try {
      await navigator.share({ files: [new File([blob], fileName, { type: 'image/png' })], title: 'فاکتور', text: `فاکتور ${toFa(inv.code)}` });
    } catch (e) {
      if (e.name !== 'AbortError') toast('ارسال انجام نشد؛ عکس را دانلود کن.');
    }
  }
}

/** چاپ: سند ساده‌ی فاکتور در #printArea و سپس دیالوگ چاپ مرورگر */
export function printInvoice(invoiceId) {
  const inv = invoices.find(invoiceId);
  if (!inv) return;
  const f = invoiceFacts(inv);
  const area = document.getElementById('printArea');
  area.replaceChildren(h('div', { class: 'print-doc', dir: 'rtl' },
    h('h1', { text: f.title }),
    h('p', { class: 'print-sub', text: 'فاکتور فروش' }),
    h('table', { class: 'print-meta' }, h('tbody', {},
      h('tr', {}, h('th', { text: 'شماره فاکتور' }), h('td', { text: f.code })),
      h('tr', {}, h('th', { text: 'تاریخ صدور' }), h('td', { text: f.issued })),
      h('tr', {}, h('th', { text: 'مشتری' }), h('td', { text: f.customer })),
      h('tr', {}, h('th', { text: 'موبایل' }), h('td', { text: f.phone || '—' })))),
    h('table', { class: 'print-rows' }, h('tbody', {}, f.rows.map(([k, v]) => h('tr', {}, h('th', { text: k }), h('td', { text: v }))))),
    inv.notes ? h('p', { class: 'print-note', text: inv.notes }) : null,
    h('p', { class: 'print-foot', text: 'نمونه‌ی کار با داده‌های ساختگی' })));
  window.print();
}
