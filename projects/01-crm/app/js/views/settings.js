// تنظیمات: ۲۰ تم روز و ۲۰ تم شب، اندازه‌ی فونت، زبان، کسب‌وکار، حساب و پشتیبان، پشتیبانی، سازنده و محل ذخیره‌سازی.
import { h } from '../core/dom.js';
import { BUSINESSES } from '../config/businesses.js';
import { COLORWAYS, NIGHT_THEMES } from '../config/colorways.js';
import { ROLES } from '../config/roles.js';
import * as store from '../core/store.js';
import { t, LANGS } from '../core/i18n.js';
import { applyTheme } from '../ui/theme.js';
import { toast } from '../ui/toast.js';
import { confirmDialog } from '../ui/dialog.js';
import { resetSeed } from '../data/seed.js';
import { goBusiness } from '../ui/shell.js';
import { signOut } from '../ui/start.js';
import { downloadText } from '../core/download.js';

export const SUPPORT_PHONE = '+989215692615';
export const DEVELOPER = { name: 'Alireza Ranjbar', phone: '+989215692615' };
export const APP_VERSION = 'v6 (2026-10-17)';

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
  const apply = () => { applyTheme(); refresh(); };

  const swatchGrid = (list) => h('div', { class: 'swatches', role: 'radiogroup' },
    ...list.map((c) => h('button', {
      class: 'swatch', type: 'button', role: 'radio', 'aria-checked': String(c.id === s.colorway),
      title: c.name, 'aria-label': c.name, dataset: { colorway: c.id }, style: `--sw:${c.accent}`,
      onClick: () => { s.colorway = c.id; store.commit(); apply(); }
    })));

  const seg = (items, current, onPick) => h('div', { class: 'seg', role: 'radiogroup' },
    ...items.map(([id, label]) => h('button', {
      class: 'seg-btn', type: 'button', role: 'radio', 'aria-checked': String(id === current),
      onClick: () => onPick(id)
    }, label)));

  const langSeg = h('div', { class: 'seg lang-seg', role: 'radiogroup', 'aria-label': t('set.language') },
    ...LANGS.map((l) => h('button', {
      class: 'seg-btn', type: 'button', role: 'radio', lang: l.id, 'aria-checked': String(l.id === (s.lang || 'fa')),
      onClick: () => { s.lang = l.id; store.commit(); apply(); }
    }, l.label)));

  const used = (JSON.stringify(s).length / 1024).toFixed(1);
  const exportBackup = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    downloadText(JSON.stringify(s, null, 2), `crm-backup-${stamp}.json`, 'application/json');
    toast(t('set.exported'));
  };

  root.append(
    section(t('set.appearance'), [
      h('p', { class: 'muted small', text: t('set.themeHint') }),
      h('h4', { class: 'sub-title', text: t('set.day') }),
      swatchGrid(COLORWAYS),
      h('h4', { class: 'sub-title', text: t('set.night') }),
      swatchGrid(NIGHT_THEMES),
      row(t('set.fontSize'), null, seg([['small', t('set.small')], ['medium', t('set.medium')], ['large', t('set.large')]], s.fontSize || 'medium', (id) => { s.fontSize = id; store.commit(); apply(); }))
    ]),
    section(t('set.language'), [
      row(t('set.langHint'), null, langSeg)
    ]),
    section(t('set.business'), [
      row(BUSINESSES[s.activeBiz].title, t('set.businessHint'),
        h('button', { class: 'btn', type: 'button', onClick: () => goBusiness() }, t('btn.switchBiz')))
    ]),
    section(t('set.account'), [
      row(`${t('set.signedIn')}: ${s.session?.name || ''} · ${ROLES[role]?.label || ''}`, t('set.logoutHint'),
        h('button', { class: 'btn', type: 'button', onClick: () => signOut() }, t('btn.logout'))),
      row(t('set.export'), t('set.exportHint'), h('button', { class: 'btn', type: 'button', onClick: exportBackup }, t('set.export'))),
      role === 'manager' ? row(t('set.reset'), t('set.resetHint'),
        h('button', { class: 'btn danger', type: 'button', onClick: () => confirmDialog({
          title: t('set.reset'), message: 'همه‌ی مشتری‌ها و فاکتورهای این کسب‌وکار با داده‌ی نمونه جایگزین شوند؟',
          confirmLabel: t('set.reset'), danger: true,
          onConfirm: () => { resetSeed(s.activeBiz); toast(t('set.saved')); refresh(); }
        }) }, t('set.reset'))) : null
    ]),
    section(t('set.support'), [
      row(t('set.supportContact'), `${t('set.phone')}: ${SUPPORT_PHONE}`,
        h('a', { class: 'btn primary', href: `tel:${SUPPORT_PHONE}` }, t('set.supportContact'))),
      row(t('set.developer'), `${t('set.phone')}: ${DEVELOPER.phone}`,
        h('span', { class: 'strong ltr', text: DEVELOPER.name }))
    ]),
    section(t('set.about'), [
      info(t('set.version'), APP_VERSION),
      info(t('set.storageLocation'), t('set.storageValue')),
      info(t('set.storageUsed'), `${used} KB`),
      info('localStorage', store.storageAvailable() ? t('set.storageOk') : t('set.storageOff')),
      info(t('set.offline'), 'Service Worker · sw.js')
    ])
  );
}

const section = (title, children) => h('section', { class: 'settings-section' }, h('h3', { text: title }), ...children);

const row = (title, hint, control) => h('div', { class: 'set-row' },
  h('div', {}, h('strong', { text: title }), hint ? h('p', { class: 'muted small', text: hint }) : null),
  control);

const info = (label, value) => h('div', { class: 'info-row' },
  h('span', { class: 'muted small', text: label }),
  h('span', { class: 'info-val', text: value }));
