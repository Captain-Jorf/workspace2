// پوسته‌ی برنامه: منوی راست (هشت صفحه)، نوار بالا با عنوان، کاربر، جستجو، فیلترها و دکمه‌های صفحه، و رندر نماها.
import * as store from '../core/store.js';
import { h, clear, $ } from '../core/dom.js';
import { BUSINESSES } from '../config/businesses.js';
import { can, ROLES } from '../config/roles.js';
import { ctx } from './context.js';
import { applyTheme } from './theme.js';
import { VIEWS, VIEW_ORDER } from '../views/index.js';
import { emptyState } from '../views/parts.js';
import { openCustomerForm } from '../features/customerForm.js';
import { openInvoiceForm } from '../features/invoiceForm.js';
import { openNoteForm } from '../features/noteForm.js';
import { exportCustomersCsv } from '../views/customers.js';
import { showStart } from '../ui/start.js';
import { openPalette } from './palette.js';
import { closeAllDialogs, isDialogOpen } from './dialog.js';

const ACTION_LABELS = {
  notice: ['اطلاعیه‌ی جدید', 'primary'],
  customer: ['مشتری جدید', 'ghost'],
  invoice: ['فاکتور جدید', 'primary'],
  note: ['یادداشت جدید', 'primary'],
  csv: ['خروجی CSV', '']
};

let refreshTimer = null;

export function mountShell() {
  const shell = $('#shell');
  shell.hidden = false;
  if (!shell.dataset.built) {
    shell.dataset.built = '1';
    buildChrome();
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

/** بازنشانی به صفحه‌ی شروع کسب‌وکار */
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

function buildChrome() {
  const nav = $('#navList');
  for (const id of VIEW_ORDER) {
    const v = VIEWS[id].meta;
    nav.append(h('button', { class: 'nav-item', type: 'button', dataset: { view: id }, onClick: () => { goView(id); closeSide(); } },
      h('span', { class: 'nav-icon', 'aria-hidden': 'true', text: v.icon }),
      h('span', { text: v.label })));
  }
  $('#toggleSide').addEventListener('click', () => {
    const open = !$('#side').classList.contains('open');
    $('#side').classList.toggle('open', open);
    $('#toggleSide').setAttribute('aria-expanded', String(open));
  });
  $('#paletteBtn').addEventListener('click', () => openPalette());
  $('#themeBtn').addEventListener('click', () => {
    const s = store.get();
    s.theme = s.theme === 'dark' ? 'light' : 'dark';
    store.commit();
    applyTheme();
    renderAll();
  });
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

export function renderAll() {
  const s = store.get();
  if (!s.activeBiz || !s.session) return;
  const cfg = BUSINESSES[s.activeBiz];
  const meta = VIEWS[ctx.view].meta;

  $('#brandBiz').textContent = cfg.short;
  $('#pageTitle').textContent = meta.title;
  $('#pageSub').textContent = meta.sub();
  document.title = `${meta.title} · ${cfg.short}`;

  for (const b of $('#navList').children) b.classList.toggle('on', b.dataset.view === ctx.view);
  $('#userName').textContent = s.session.name;
  $('#userRole').textContent = ROLES[s.session.role]?.label || '';
  $('#themeBtn').textContent = s.theme === 'dark' ? '☀ روشن' : '☾ شب';
  $('#footnote').textContent = `${cfg.title} · داده‌ها روی این دستگاه ذخیره می‌شوند`;

  // فیلترهای فهرست (فقط در صفحاتی که meta.chips دارند)
  const chips = $('#filters');
  clear(chips);
  if (meta.chips) {
    const list = [
      ['all', 'همه'], ['today', 'امروز'], ['overdue', 'عقب‌افتاده'], ['open', 'باز'], ['done', 'انجام‌شده‌ها']
    ];
    for (const [id, label] of list) {
      chips.append(h('button', {
        class: 'chip', type: 'button', 'aria-pressed': String(ctx.filter === id),
        onClick: () => { ctx.filter = id; renderAll(); }
      }, label));
    }
  }
  $('#q').placeholder = meta.chips ? 'جستجوی نام یا موبایل (کلید /)' : 'جستجو (کلید /)';
  $('#q').hidden = meta.searchable === false;

  // دکمه‌های عملیات صفحه
  const acts = $('#headerActions');
  clear(acts);
  const writable = can(s.session.role, 'customer.write');
  for (const a of meta.actions) {
    const [label, variant] = ACTION_LABELS[a];
    if (a === 'csv') {
      acts.append(h('button', { class: 'btn', type: 'button', onClick: () => exportCustomersCsv() }, label));
      continue;
    }
    if (a === 'invoice' && !can(s.session.role, 'invoice.write')) continue;
    if (a === 'note' && !can(s.session.role, 'note.write')) continue;
    if ((a === 'notice' || a === 'customer') && !writable) continue;
    acts.append(h('button', { class: `btn ${variant}`.trim(), type: 'button', onClick: () => runAction(a) }, label));
  }

  renderView();
}

export function runAction(a) {
  if (a === 'notice') openCustomerForm({ presetStage: 0, onSaved: refresh });
  if (a === 'customer') openCustomerForm({ onSaved: refresh });
  if (a === 'invoice') openInvoiceForm({ onSaved: refresh });
  if (a === 'note') openNoteForm({ onSaved: refresh });
  if (a === 'csv') exportCustomersCsv();
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
  const saved = store.storageAvailable() ? 'ذخیره شد ✓' : 'فقط در حافظه (ذخیره‌ی مرورگر در دسترس نیست)';
  $('#saveState').textContent = saved;
  $('#netState').textContent = navigator.onLine === false ? 'آفلاین' : 'روی دستگاه';
}

export function handleEscape() {
  if (isDialogOpen()) return false;
  if ($('#side').classList.contains('open')) { closeSide(); return true; }
  return false;
}

export { closeSide };
