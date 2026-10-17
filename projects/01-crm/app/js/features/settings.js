// تنظیمات: حساب و ورود، ظاهر، وضعیت ذخیره‌سازی، خروجی پشتیبان و بازنشانی داده‌ی نمونه.
import * as db from '../core/db.js';
import { h } from '../core/dom.js';
import { toFa } from '../core/format.js';
import { BUSINESSES } from '../config/businesses.js';
import { ROLES, can } from '../core/permissions.js';
import * as auth from '../domain/auth.js';
import { downloadBlob } from '../core/download.js';
import { openDialog, closeDialog, confirmDialog, toast } from '../ui/dialog.js';
import { showAccountDialog } from '../ui/start.js';
import { applyTheme } from '../ui/theme.js';
import { COLORWAYS } from '../config/colorways.js';

/** openSettings({ onChange, onSwitch }) */
export function openSettings({ onChange = () => {}, onSwitch = () => {} } = {}) {
  const key = db.activeBizKey();
  const biz = BUSINESSES[key];
  const s = auth.session();
  const role = s?.role;
  const bucket = db.bucket(key);
  const section = (title, ...children) => h('section', { class: 'dsec' }, h('h3', { text: title }), ...children);

  const accountText = s
    ? `${s.name} · ${ROLES[role]?.label || ''}${s.kind === 'demo' ? ' (نقش نمونه)' : ''}`
    : 'وارد نشده‌ای';

  const themeBtns = [['light', 'روشن'], ['dark', 'شب']].map(([value, label]) => h('button', {
    class: 'chip', type: 'button', 'aria-pressed': String(db.current().theme === value),
    onClick: () => {
      db.setTheme(value);
      applyTheme();
      closeDialog();
      onChange();
      openSettings({ onChange, onSwitch });
    }
  }, label));

  const accountBlock = section('حساب کاربری',
    h('p', { text: accountText }),
    s?.kind === 'demo'
      ? h('div', { class: 'row-actions' },
        h('button', { class: 'btn', type: 'button', onClick: () => showAccountDialog(key, () => { closeDialog(); onChange(); }) }, 'ورود یا ثبت‌نام با حساب خودم'))
      : null,
    s ? h('div', { class: 'row-actions' },
      h('button', { class: 'btn ghost', type: 'button', onClick: () => { auth.logout(); closeDialog(); onSwitch(); } }, 'خروج از حساب')) : null);

  const storageText = db.storageStatus()
    ? 'داده روی همین دستگاه ذخیره می‌شود و بدون اینترنت کار می‌کند.'
    : 'حافظه‌ی مرورگر در دسترس نیست؛ داده‌ها تا بستن صفحه نگه داشته می‌شوند. تنظیمات مرورگر را بررسی کن.';

  const dataBlock = section('داده‌ها',
    h('p', { class: storageText.includes('نیست') ? 'warn-text' : 'muted', text: storageText }),
    h('p', { class: 'muted', text: `${toFa(bucket.customers.length)} رکورد مشتری · ${toFa(bucket.invoices.length)} فاکتور · ${toFa(bucket.notes.length)} یادداشت` }),
    h('div', { class: 'row-actions' },
      h('button', { class: 'btn', type: 'button', onClick: exportBackup }, 'خروجی پشتیبان (JSON)'),
      can(role, 'customer.delete')
        ? h('button', { class: 'btn danger', type: 'button', onClick: resetData }, 'بازنشانی داده‌ی نمونه')
        : null));

  const bizBlock = section('کسب‌وکار',
    h('p', { text: `${biz.title} · ${biz.stages.length} مرحله · ${biz.fields.length} فیلد اختصاصی` }),
    h('div', { class: 'row-actions' },
      h('button', { class: 'btn ghost', type: 'button', onClick: () => { closeDialog(); onSwitch(); } }, 'تغییر کسب‌وکار')));

  const colorwayBtns = COLORWAYS.map((cw) => {
    const swatch = h('span', { class: 'cw-swatch', 'aria-hidden': 'true' });
    swatch.style.background = `linear-gradient(135deg, ${cw.accent} 0 55%, ${cw.tint} 55% 100%)`;
    return h('button', {
      class: 'cw-item', type: 'button', role: 'radio', title: cw.name,
      'aria-checked': String(db.current().colorway === cw.id),
      onClick: () => {
        db.setColorway(cw.id);
        applyTheme();
        closeDialog();
        onChange();
        openSettings({ onChange, onSwitch });
      }
    }, swatch, h('span', { class: 'cw-name', text: cw.name }));
  });

  const themeBlock = section('ظاهر',
    h('p', { class: 'muted', text: 'حالت نمایش' }),
    h('div', { class: 'row-actions', role: 'group', 'aria-label': 'حالت نمایش' }, themeBtns),
    h('p', { class: 'muted', text: `رنگ‌بندی (${COLORWAYS.length} گزینه)` }),
    h('div', { class: 'cw-grid', role: 'radiogroup', 'aria-label': 'رنگ‌بندی' }, ...colorwayBtns));

  openDialog({
    kind: 'drawer',
    title: 'تنظیمات',
    sub: 'تغییرات همان لحظه ذخیره می‌شود',
    body: h('div', { class: 'settings' }, accountBlock, themeBlock, bizBlock, dataBlock),
    actions: [{ label: 'بستن', variant: 'ghost', onClick: () => closeDialog() }]
  });

  function exportBackup() {
    const text = JSON.stringify({ exportedAt: new Date().toISOString(), business: key, ...bucket }, null, 2);
    downloadBlob(new Blob([text], { type: 'application/json' }), `crm-${key}-backup.json`);
    toast('فایل پشتیبان ساخته شد.');
  }

  async function resetData() {
    const ok = await confirmDialog({
      title: 'بازنشانی داده‌ی نمونه',
      message: `داده‌ی «${biz.short}» پاک و دوباره با نمونه‌ی اولیه ساخته شود؟`,
      confirmLabel: 'بازنشانی',
      danger: true
    });
    if (!ok) return;
    db.resetBiz(key);
    onChange();
    toast('داده‌ی نمونه بازنشانی شد.');
  }
}
