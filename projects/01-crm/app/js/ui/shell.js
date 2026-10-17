// پوسته‌ی برنامه: منوی کناری، نوار بالا، فیلترها، جستجو، وضعیت ذخیره، کلیدهای میان‌بر و چرخه‌ی رندر.
import * as db from '../core/db.js';
import { bus } from '../core/bus.js';
import { h, $, $$, clear } from '../core/dom.js';
import { BUSINESSES, bizOf } from '../config/businesses.js';
import { FILTERS, dueToday } from '../domain/customers.js';
import { can } from '../core/permissions.js';
import { closeDialog, isDialogOpen } from './dialog.js';
import { renderStart, showRoleDialog, showAccountDialog } from './start.js';
import { VIEWS, NAV } from '../views/index.js';
import { openCustomerForm } from '../features/customerForm.js';
import { openSettings } from '../features/settings.js';
import { openPalette } from './palette.js';
import * as auth from '../domain/auth.js';
import { applyTheme } from './theme.js';

const ctx = { view: 'today', filter: 'all', query: '' };
let mounted = null;
let renderQueued = false;

const $start = () => $('#start');
const $shell = () => $('#shell');

/** وضعیت منو فقط ظاهری است؛ با flush ذخیره می‌شود و رندر کامل صفحه را دوباره اجرا نمی‌کند */
function setCollapsed(value) {
  db.current().collapsed = !!value;
  db.flush();
  applyCollapsed();
}

function applyCollapsed() {
  const collapsed = !!db.current().collapsed;
  $shell().classList.toggle('collapsed', collapsed);
  $('#toggleSide').setAttribute('aria-expanded', String(!collapsed));
}

function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => { renderQueued = false; render(); });
}

function updateStatus() {
  const saved = $('#saveState');
  const ok = db.storageStatus();
  saved.textContent = ok ? 'روی دستگاه ذخیره شد' : 'حافظه‌ی مرورگر در دسترس نیست';
  saved.classList.toggle('warn', !ok);
  const net = $('#netState');
  net.textContent = navigator.onLine ? 'آنلاین' : 'آفلاین · بدون نیاز به اینترنت';
  net.classList.toggle('warn', !navigator.onLine);
}

function buildNav() {
  const nav = $('#navList');
  clear(nav);
  NAV.forEach((id) => {
    const meta = VIEWS[id].meta;
    nav.append(h('button', { class: 'nav', type: 'button', dataset: { view: id }, onClick: () => go(id) },
      h('span', { class: 'ic', 'aria-hidden': 'true' }, meta.icon),
      h('span', { class: 'label' }, meta.label),
      id === 'today' ? h('span', { class: 'badge', id: 'badgeToday' }, '۰') : null));
  });
  nav.append(h('div', { class: 'sep' }));
  const s = auth.session();
  nav.append(h('button', {
    class: 'nav profile', type: 'button', id: 'profileBtn',
    onClick: () => (s ? openSettings({ onChange: scheduleRender, onSwitch: switchBusiness })
      : showAccountDialog(db.activeBizKey(), scheduleRender))
  },
  h('span', { class: 'ic', 'aria-hidden': 'true' }, '◎'),
  h('span', { class: 'label' }, s ? s.name : 'ورود / ثبت‌نام')));
  nav.append(h('button', { class: 'nav', type: 'button', onClick: () => openSettings({ onChange: scheduleRender, onSwitch: switchBusiness }) },
    h('span', { class: 'ic', 'aria-hidden': 'true' }, '⚙'), h('span', { class: 'label' }, 'تنظیمات')));
  nav.append(h('button', { class: 'nav', type: 'button', onClick: switchBusiness },
    h('span', { class: 'ic', 'aria-hidden': 'true' }, '⇄'), h('span', { class: 'label' }, 'تغییر کسب‌وکار')));
}

function buildFilters() {
  const box = $('#filters');
  clear(box);
  FILTERS.forEach((f) => {
    box.append(h('button', {
      class: 'chip', type: 'button', dataset: { filter: f.id }, 'aria-pressed': String(ctx.filter === f.id),
      onClick: () => { ctx.filter = f.id; scheduleRender(); }
    }, f.label));
  });
}

function buildHeaderActions() {
  const box = $('#headerActions');
  clear(box);
  if (can(auth.session()?.role, 'customer.create')) {
    box.append(h('button', { class: 'btn primary', type: 'button', id: 'btnNewNotice', onClick: () => newNotice() },
      'اطلاعیه‌ی جدید', h('kbd', {}, 'N')));
    box.append(h('button', { class: 'btn', type: 'button', id: 'btnNewCustomer', onClick: () => newCustomer() }, 'مشتری جدید'));
  }
  box.append(h('button', { class: 'btn ghost palette-btn', type: 'button', id: 'btnPalette', onClick: () => openCommandPalette(), 'aria-label': 'پالت فرمان و جستجوی سراسری' }, 'جستجو و دستور ', h('kbd', {}, '⌘K')));
  box.append(h('button', { class: 'icon-btn theme-btn', type: 'button', id: 'themeBtn', 'aria-label': 'تغییر حالت شب و روز', title: 'حالت شب / روز', onClick: toggleTheme }, db.current().theme === 'dark' ? '☀' : '☾'));
}

export function newNotice() {
  if (!can(auth.session()?.role, 'customer.create')) return;
  openCustomerForm({ stage: 0, onSaved: scheduleRender });
}

export function newCustomer() {
  if (!can(auth.session()?.role, 'customer.create')) return;
  const won = BUSINESSES[db.activeBizKey()].won[0];
  openCustomerForm({ stage: won, onSaved: scheduleRender });
}

function toggleTheme() {
  const next = db.current().theme === 'dark' ? 'light' : 'dark';
  db.setTheme(next);
  applyTheme();
  buildHeaderActions();
}


function go(viewId) {
  closeDialog();
  ctx.view = viewId;
  // منو یک لایه‌ی روی صفحه است؛ بعد از انتخاب صفحه جمع می‌شود تا محتوا دیده شود
  if (!db.current().collapsed) setCollapsed(true);
  render();
}

function render() {
  if (!db.activeBizKey() || !$start().hidden) return;
  const key = db.activeBizKey();
  const viewDef = VIEWS[ctx.view];
  const meta = viewDef.meta;
  $('#pageTitle').textContent = meta.title;
  const count = db.bucket(key).customers.filter((c) => !c.archived).length;
  $('#pageSub').textContent = `${bizOf(key).title} · ${count} مشتری`;
  $('#filters').hidden = !meta.filters;
  $('#q').hidden = !meta.search;
  $('#q').placeholder = meta.searchPlaceholder || 'جستجوی نام یا موبایل (کلید /)';
  const profile = $('#profileBtn .label');
  if (profile) profile.textContent = auth.session()?.name || 'ورود / ثبت‌نام';
  $$('.chip', $('#filters')).forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === ctx.filter)));
  $$('.nav[data-view]').forEach((b) => b.setAttribute('aria-current', b.dataset.view === ctx.view ? 'page' : 'false'));
  const due = dueToday().length;
  const badge = $('#badgeToday');
  if (badge) badge.textContent = String(due);
  buildHeaderActions();
  updateStatus();
  const root = $('#view');
  if (!mounted || mounted.id !== ctx.view) {
    clear(root);
    const node = h('div', { class: 'view-root', dataset: { view: ctx.view } });
    root.append(node);
    mounted = { id: ctx.view, instance: viewDef.mount(node, ctx) };
  } else {
    mounted.instance.refresh();
  }
}

function showStart() {
  closeDialog();
  $shell().hidden = true;
  $start().hidden = false;
  mounted = null;
  renderStart($('#bizGrid'), (key) => pickBusiness(key));
  updateStatus();
}

export function showShell() {
  $start().hidden = true;
  $shell().hidden = false;
  applyCollapsed();
  applyTheme();
  buildNav();
  buildFilters();
  ctx.view = 'today';
  ctx.filter = 'all';
  ctx.query = '';
  $('#q').value = '';
  mounted = null;
  render();
}

function pickBusiness(key) {
  db.setActiveBiz(key);
  db.ensureSeeded(key);
  if (auth.session()) showShell();
  else showRoleDialog(key, () => showShell());
}

function switchBusiness() {
  db.setActiveBiz(null);
  showStart();
}

/** ورودهای کلیدی: / برای جستجو، N برای اطلاعیه‌ی جدید، Escape برای بستن */
function paletteActions() {
  return [
    { label: 'اطلاعیه‌ی جدید', run: () => newNotice() },
    { label: 'مشتری جدید', run: () => newCustomer() },
    { label: 'تنظیمات', run: () => openSettings({ onChange: scheduleRender, onSwitch: switchBusiness }) },
    { label: 'تغییر کسب‌وکار', run: () => switchBusiness() },
    { label: 'تغییر حالت شب و روز', run: () => toggleTheme() }
  ];
}

function openCommandPalette() {
  if (!db.activeBizKey() || !$start().hidden) return;
  openPalette({ go, actions: paletteActions() });
}

function bindKeys() {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openCommandPalette(); return; }
    if (e.key === 'Escape') { closeDialog(); return; }
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '');
    if (typing || isDialogOpen() || !db.activeBizKey()) return;
    if (e.key === '/' && !$('#q').hidden) { e.preventDefault(); $('#q').focus(); }
    if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); newNotice(); }
  });
}

/** ساید بار باز که بیرون از آن کلیک شود، خودکار بسته می‌شود */
function bindSidebarAutoClose() {
  document.addEventListener('click', (e) => {
    if (db.current().collapsed || $shell().hidden) return;
    // مسیر رویداد در لحظه‌ی کلیک ثبت می‌شود؛ چون منو بعد از کلیک بازسازی می‌شود، target ممکن است جدا شده باشد
    const inside = e.composedPath().some((el) => el.id === 'side' || el.id === 'toggleSide' || el.id === 'layer');
    if (inside) return;
    setCollapsed(true);
  });
}

export function init() {
  applyTheme();
  $('#toggleSide').addEventListener('click', () => setCollapsed(!db.current().collapsed));
  $('#q').addEventListener('input', (e) => { ctx.query = e.target.value; scheduleRender(); });
  bus.on('data', scheduleRender);
  bus.on('status', updateStatus);
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  $('#footnote').textContent = 'نمونه‌ی کار با داده‌های ساختگی یک برنامه مدیریت مشتری';
  bindKeys();
  bindSidebarAutoClose();
  const active = db.activeBizKey();
  if (active && auth.session()) {
    db.ensureSeeded(active);
    showShell();
  } else {
    showStart();
  }
}

/** برای تست‌ها و صفحات دیگر */
export const shellContext = ctx;
