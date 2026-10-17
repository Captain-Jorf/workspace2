// پالت فرمان (Ctrl/⌘ + K): جابه‌جایی بین صفحه‌ها، اجرای دستورها و پیدا کردن مشتری با یک جستجو.
import { h } from '../core/dom.js';
import { openDialog, closeDialog } from './dialog.js';
import { list, matchesQuery } from '../domain/customers.js';
import { VIEWS, NAV } from '../views/index.js';
import { openCustomerDetail } from '../features/customerDetail.js';

/** openPalette({ go, actions }) — actions: [{ label, run }] */
export function openPalette({ go, actions = [] }) {
  const input = h('input', {
    class: 'input palette-input', type: 'search', placeholder: 'صفحه، دستور یا نام مشتری…',
    'aria-label': 'پالت فرمان', autocomplete: 'off'
  });
  const listEl = h('ul', { class: 'palette-list', role: 'listbox' });
  let items = [];
  let active = 0;

  function build() {
    const q = input.value.trim();
    const pages = NAV.map((id) => ({ label: VIEWS[id].meta.label, hint: 'صفحه', run: () => go(id) }))
      .filter((i) => !q || i.label.includes(q));
    const acts = actions.map((a) => ({ label: a.label, hint: 'دستور', run: a.run }))
      .filter((i) => !q || i.label.includes(q));
    const customers = q
      ? list({}).filter((c) => matchesQuery(c, q)).slice(0, 8).map((c) => ({ label: c.name, hint: c.phone, run: () => openCustomerDetail(c.id) }))
      : [];
    items = [...acts, ...pages, ...customers];
    active = 0;
    render();
  }

  function render() {
    listEl.replaceChildren(...(items.length
      ? items.map((item, i) => h('li', { role: 'option', 'aria-selected': String(i === active) },
        h('button', {
          class: `palette-item${i === active ? ' on' : ''}`, type: 'button',
          onClick: () => choose(i), onMouseenter: () => { active = i; render(); }
        }, h('span', { text: item.label }), h('small', { text: item.hint }))))
      : [h('li', { class: 'palette-empty', text: 'موردی پیدا نشد.' })]));
  }

  function choose(i) {
    const item = items[i];
    if (!item) return;
    closeDialog();
    item.run();
  }

  input.addEventListener('input', build);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(items.length - 1, active + 1); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); render(); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(active); }
  });

  openDialog({
    kind: 'modal', size: 'palette', title: 'پالت فرمان', sub: 'Esc برای بستن',
    body: h('div', { class: 'palette' }, input, listEl),
    actions: []
  });
  build();
}
