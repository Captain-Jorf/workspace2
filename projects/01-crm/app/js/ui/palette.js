// پالت فرمان (Ctrl/⌘+K): پرش به صفحه‌ها، اقدام‌های سریع، جستجوی مشتری و تغییر حالت نمایش.
import * as store from '../core/store.js';
import { h } from '../core/dom.js';
import { openDialog } from './dialog.js';
import { applyTheme } from './theme.js';
import { VIEWS, VIEW_ORDER } from '../views/index.js';
import * as cust from '../domain/customers.js';
import { openCustomerDetail } from '../features/customerDetail.js';
import { goView, runAction, refresh } from './shell.js';
import { signOut } from './start.js';

export function paletteItems() {
  const s = store.get();
  const items = VIEW_ORDER.map((id) => ({ label: `برو به ${VIEWS[id].meta.label}`, hint: 'صفحه', run: () => goView(id) }));
  items.push(
    { label: 'اطلاعیه‌ی جدید', hint: 'اقدام', run: () => runAction('notice') },
    { label: 'مشتری جدید', hint: 'اقدام', run: () => runAction('customer') },
    { label: 'فاکتور جدید', hint: 'اقدام', run: () => runAction('invoice') },
    { label: s.theme === 'dark' ? 'حالت روشن' : 'حالت شب', hint: 'نمایش', run: () => {
      s.theme = s.theme === 'dark' ? 'light' : 'dark';
      store.commit();
      applyTheme();
      refresh();
    } },
    { label: 'خروج از حساب', hint: 'حساب', run: () => signOut() }
  );
  return items;
}

export function openPalette() {
  const input = h('input', { class: 'input palette-input', type: 'search', placeholder: 'جستجوی صفحه، اقدام یا مشتری…', 'aria-label': 'دستور یا جستجو' });
  const listEl = h('ul', { class: 'palette-list', role: 'listbox' });
  let active = 0;
  let current = [];

  const rowsFor = (q) => {
    const key = store.get().activeBiz;
    const needle = q.trim().toLowerCase();
    const cmds = paletteItems().filter((c) => !needle || c.label.toLowerCase().includes(needle));
    const customers = needle
      ? cust.list({}, key).filter((c) => cust.matchesQuery(c, needle)).slice(0, 8)
        .map((c) => ({ label: c.name, hint: 'مشتری', run: () => openCustomerDetail(c.id, { onChange: refresh }) }))
      : [];
    return [...cmds, ...customers];
  };

  const paint = () => {
    listEl.replaceChildren(...current.map((item, i) => h('li', {
      class: `palette-item${i === active ? ' on' : ''}`, role: 'option', 'aria-selected': String(i === active),
      onClick: () => pick(i)
    }, h('span', { text: item.label }), h('span', { class: 'muted small', text: item.hint }))));
    listEl.children[active]?.scrollIntoView({ block: 'nearest' });
  };

  let handle;
  const pick = (i) => {
    const item = current[i];
    if (!item) return;
    handle.close();
    item.run();
  };

  const update = () => {
    current = rowsFor(input.value);
    active = 0;
    paint();
  };

  input.addEventListener('input', update);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(current.length - 1, active + 1); paint(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); paint(); }
    if (e.key === 'Enter') { e.preventDefault(); pick(active); }
  });

  handle = openDialog({
    kind: 'modal', size: 'palette', title: 'دستورها', sub: 'Ctrl/⌘+K · Esc برای بستن',
    body: h('div', { class: 'palette' }, input, listEl)
  });
  update();
  input.focus();
}
