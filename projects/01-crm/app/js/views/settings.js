// تنظیمات: روز/شب، ۲۰ رنگ‌بندی، کسب‌وکار، بازنشانی داده‌ی نمونه (مدیر)، خروج.
import { h } from '../core/dom.js';
import { BUSINESSES } from '../config/businesses.js';
import { COLORWAYS } from '../config/colorways.js';
import { ROLES } from '../config/roles.js';
import * as store from '../core/store.js';
import { applyTheme } from '../ui/theme.js';
import { toast } from '../ui/toast.js';
import { confirmDialog } from '../ui/dialog.js';
import { resetSeed } from '../data/seed.js';
import { goBusiness } from '../ui/shell.js';
import { signOut } from '../ui/start.js';

export const meta = {
  label: 'تنظیمات',
  icon: '⚙',
  title: 'تنظیمات',
  sub: () => 'ظاهر، کسب‌وکار و حساب کاربری',
  chips: false,
  actions: []
};

export function render(root, { refresh }) {
  const s = store.get();
  const role = s.session?.role;
  const cw = COLORWAYS.find((c) => c.id === s.colorway);

  const themeBtn = h('button', { class: 'btn', type: 'button', onClick: () => {
    s.theme = s.theme === 'dark' ? 'light' : 'dark';
    store.commit();
    applyTheme();
    refresh();
  } }, s.theme === 'dark' ? 'تم روشن' : 'تم شب');

  const swatches = h('div', { class: 'swatches', role: 'radiogroup', 'aria-label': 'رنگ‌بندی' },
    ...COLORWAYS.map((c) => h('button', {
      class: 'swatch', type: 'button', role: 'radio', 'aria-checked': String(c.id === s.colorway),
      title: c.name, dataset: { colorway: c.id }, style: `--sw:${c.accent}`,
      onClick: () => { s.colorway = c.id; store.commit(); applyTheme(); refresh(); }
    }, h('span', { class: 'sr', text: c.name }))));

  root.append(
    section('ظاهر', [
      h('div', { class: 'set-row' }, h('div', {}, h('strong', { text: 'حالت نمایش' }), h('p', { class: 'muted small', text: 'روشن یا تاریک؛ میانبر نوار بالا هم همین است.' })), themeBtn),
      h('div', { class: 'set-block' },
        h('div', {}, h('strong', { text: `رنگ‌بندی: ${cw?.name || ''}` }), h('p', { class: 'muted small', text: 'ظاهر و چیدمان ثابت است؛ فقط پالت عوض می‌شود.' })),
        swatches)
    ]),
    section('کسب‌وکار', [
      h('div', { class: 'set-row' },
        h('div', {}, h('strong', { text: BUSINESSES[s.activeBiz].title }), h('p', { class: 'muted small', text: 'داده‌ی هر کسب‌وکار جدا ذخیره می‌شود.' })),
        h('button', { class: 'btn', type: 'button', onClick: () => goBusiness() }, 'تغییر کسب‌وکار'))
    ]),
    section('حساب و داده', [
      h('div', { class: 'set-row' },
        h('div', {}, h('strong', { text: `${s.session?.name || ''} · ${ROLES[role]?.label || ''}` }), h('p', { class: 'muted small', text: 'خروج از حساب، داده‌ها را پاک نمی‌کند.' })),
        h('button', { class: 'btn', type: 'button', onClick: () => signOut() }, 'خروج')),
      role === 'manager' ? h('div', { class: 'set-row' },
        h('div', {}, h('strong', { text: 'بازنشانی داده‌ی نمونه' }), h('p', { class: 'muted small', text: 'فقط مدیر. داده‌ی این کسب‌وکار دوباره ساخته می‌شود.' })),
        h('button', { class: 'btn danger', type: 'button', onClick: () => confirmDialog({
          title: 'بازنشانی داده', message: 'همه‌ی مشتری‌ها و فاکتورهای این کسب‌وکار با داده‌ی نمونه جایگزین شوند؟',
          confirmLabel: 'بازنشانی', danger: true,
          onConfirm: () => { resetSeed(s.activeBiz); toast('داده‌ی نمونه بازنشانی شد'); refresh(); }
        }) }, 'بازنشانی')) : null,
      h('p', { class: 'muted small', text: store.storageAvailable() ? 'ذخیره‌سازی: روی همین دستگاه (localStorage) فعال است.' : 'هشدار: ذخیره‌سازی مرورگر در دسترس نیست؛ داده‌ها تا بستن صفحه می‌مانند.' })
    ])
  );
}

const section = (title, children) => h('section', { class: 'settings-section' }, h('h3', { text: title }), ...children);
