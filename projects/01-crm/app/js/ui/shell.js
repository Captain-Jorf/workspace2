// پوسته‌ی برنامه: منوی راست (هشت صفحه)، نوار بالا، کاربر، جستجو، فیلترها، دکمه‌های صفحه، و رندر نماها.
import * as store from '../core/store.js';
import { h, clear, $ } from '../core/dom.js';
import { BUSINESSES } from '../config/businesses.js';
import { can, ROLES } from '../config/roles.js';
import { t } from '../core/i18n.js';
import { ctx } from './context.js';
import { applyTheme } from './theme.js';
import { VIEWS, VIEW_ORDER } from '../views/index.js';
import { emptyState } from '../views/parts.js';
import { openCustomerForm } from '../features/customerForm.js';
import { openInvoiceForm } from '../features/invoiceForm.js';
import { openNoteForm } from '../features/noteForm.js';
import { exportCustomersCsv } from '../views/customers.js';
import { showStart } from './start.js';
import { openPalette } from './palette.js';
import { closeAllDialogs, isDialogOpen } from './dialog.js';

const ACTIONS = {
  notice: ['btn.newNotice', 'primary'],
  customer: ['btn.newCustomer', 'ghost'],
  invoice: ['btn.newInvoice', 'primary'],
  note: ['btn.newNote', 'primary'],
  csv: ['btn.csv', ''],
  print: ['btn.print', 'ghost']
};

const FILTERS = [['all', 'filter.all'], ['today', 'filter.today'], ['overdue', 'filter.overdue'], ['open', 'filter.open'], ['done', 'filter.done']];

let refreshTimer = null;

export function mountShell() {
  const shell = $('#shell');
  shell.hidden = false;
  if (!shell.dataset.built) {
    shell.dataset.built = '1';
    bindChrome();
  }
  const from = location.hash.replace('#/', '');
  if (VIEW_ORDER.includes(from)) ctx.view = from;
  ctx.query = '';
  $('#q').value = '';
  renderAll();
}

export function unmountShell() {
  $('#shell').hidden = true;
}

export function goView(id) {
  if (!VIEW_ORDER.includes(id)) return;
  ctx.view = id;
  if (location.hash !== `#/${id}`) history.replaceState(null, '', `#/${id}`);
  renderAll();
}

/** بازگشت به صفحه‌ی انتخاب کسب‌وکار */
export function goBusiness() {
  closeAllDialogs();
  store.get().activeBiz = null;
  store.commit();
  showStart();
}

/** رندر دوباره‌ی صفحه‌ی جاری (با تأخیر کوتاه برای ادغام تغییرات پشت‌سرهم) */
export function refresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(renderAll, 0);
}

function bindChrome() {
  $('#toggleSide').addEventListener('click', () => {
    const open = !$('#side').classList.contains('open');
    $('#side').classList.toggle('open', open);
    $('#toggleSide').setAttribute('aria-expanded', String(open));
  });
  $('#paletteBtn').addEventListener('click', () => openPalette());
  $('#switchBiz').addEventListener('click', () => goBusiness());
  $('#q').addEventListener('input', (e) => {
    ctx.query = e.target.value;
    renderView();
  });
  window.addEventListener('hashchange', () => {
    const id = location.hash.replace('#/', '');
    if (VIEW_ORDER.includes(id) && id !== ctx.view) goView(id);
  });
}

function closeSide() {
  $('#side').classList.remove('open');
  $('#toggleSide').setAttribute('aria-expanded', 'false');
}

/** منوی راست را با زبان فعلی می‌سازد */
function buildNav() {
  const nav = $('#navList');
  clear(nav);
  for (const id of VIEW_ORDER) {
    nav.append(h('button', {
      class: `nav-item${ctx.view === id ? ' on' : ''}`, type: 'button', dataset: { view: id },
      onClick: () => { goView(id); closeSide(); }
    },
    h('span', { class: 'nav-icon', 'aria-hidden': 'true', text: VIEWS[id].meta.icon }),
    h('span', { text: t(`nav.${id}`) })));
  }
}

export function renderAll() {
  const s = store.get();
  if (!s.activeBiz || !s.session) return;
  const cfg = BUSINESSES[s.activeBiz];
  const meta = VIEWS[ctx.view].meta;

  applyTheme();
  $('#brandBiz').textContent = cfg.short;
  $('#pageTitle').textContent = t(`nav.${ctx.view}`);
  $('#pageSub').textContent = ctx.view === 'settings' ? t('set.sub') : meta.sub();
  document.title = `${t(`nav.${ctx.view}`)} · ${cfg.short}`;
  buildNav();
  $('#userName').textContent = s.session.name;
  $('#userRole').textContent = ROLES[s.session.role]?.label || '';
  $('#paletteBtn').textContent = t('btn.palette');
  $('#switchBiz').textContent = t('btn.switchBiz');
  $('#q').placeholder = t('btn.search');
  $('#footnote').textContent = `${cfg.title} · ${t('set.storageOk')}`;

  // فیلترهای فهرست (فقط در صفحاتی که meta.chips دارند)
  const chips = $('#filters');
  clear(chips);
  if (meta.chips) {
    for (const [id, key] of FILTERS) {
      chips.append(h('button', {
        class: 'chip', type: 'button', 'aria-pressed': String(ctx.filter === id),
        onClick: () => { ctx.filter = id; renderAll(); }
      }, t(key)));
    }
  }

  // دکمه‌های عملیات صفحه
  const acts = $('#headerActions');
  clear(acts);
  const role = s.session.role;
  for (const a of meta.actions) {
    if (a === 'csv') {
      acts.append(h('button', { class: 'btn', type: 'button', onClick: () => exportCustomersCsv() }, t('btn.csv')));
      continue;
    }
    if (a === 'invoice' && !can(role, 'invoice.write')) continue;
    if (a === 'note' && !can(role, 'note.write')) continue;
    if ((a === 'notice' || a === 'customer') && !can(role, 'customer.write')) continue;
    const [key, variant] = ACTIONS[a];
    acts.append(h('button', { class: `btn ${variant}`.trim(), type: 'button', onClick: () => runAction(a) }, t(key)));
  }

  renderView();
}

export function runAction(a) {
  if (a === 'notice') openCustomerForm({ presetStage: 0, onSaved: refresh });
  if (a === 'customer') openCustomerForm({ onSaved: refresh });
  if (a === 'invoice') openInvoiceForm({ onSaved: refresh });
  if (a === 'note') openNoteForm({ onSaved: refresh });
  if (a === 'csv') exportCustomersCsv();
  if (a === 'print') printCurrentView();
}

/** چاپ صفحه‌ی جاری: بدنه‌ی نما بدون دکمه و فیلتر در #printArea، سپس چاپ */
function printCurrentView() {
  const area = $('#printArea');
  clear(area);
  const body = $('#view').cloneNode(true);
  body.querySelectorAll('button, input, select, textarea, .toolbar, .chips').forEach((el) => el.remove());
  area.append(h('div', { class: 'print-sheet' },
    h('header', {}, h('h1', { text: $('#pageTitle').textContent }), h('p', { text: $('#pageSub').textContent })),
    body));
  window.print();
}

function renderView() {
  const root = $('#view');
  clear(root);
  root.scrollTop = 0;
  try {
    VIEWS[ctx.view].render(root, { refresh: () => refresh() });
  } catch (err) {
    console.error(err);
    root.append(emptyState('خطا در نمایش صفحه', 'صفحه بارگذاری نشد. اطلاعات ذخیره‌شده دست‌نخورده است؛ صفحه را دوباره باز کن.'));
  }
  $('#saveState').textContent = store.storageAvailable() ? t('set.saved') : t('set.storageOff');
  $('#netState').textContent = navigator.onLine === false ? 'Offline' : 'Local';
}

export function handleEscape() {
  if (isDialogOpen()) return false;
  if ($('#side').classList.contains('open')) { closeSide(); return true; }
  return false;
}

export { closeSide };
