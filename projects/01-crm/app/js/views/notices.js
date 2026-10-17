// اطلاعیه‌ها: تابلوی مراحل فروش. کارت‌ها کلیک‌پذیرند (جزئیات)، کشیدن یا کلیدهای ← → مرحله را عوض می‌کنند،
// و هر کارت «تماس»، منوی مرحله و «حذف» (با بازگردانی ۵ ثانیه‌ای) دارد.
import { h } from '../core/dom.js';
import { money, plural } from '../core/format.js';
import { BUSINESSES } from '../config/businesses.js';
import { can } from '../config/roles.js';
import * as cust from '../domain/customers.js';
import * as store from '../core/store.js';
import { toast } from '../ui/toast.js';
import { confirmDialog } from '../ui/dialog.js';
import { openActivityForm } from '../features/customerDetail.js';
import { emptyState, followBadge, openOnBodyClick } from './parts.js';
import { ctx } from '../ui/context.js';
import { t } from '../core/i18n.js';

export const meta = {
  label: 'اطلاعیه‌ها',
  icon: '▦',
  title: 'اطلاعیه‌ها',
  sub: () => `${BUSINESSES[store.get().activeBiz].title} · ${t('nav.notices')}`,
  chips: true,
  actions: ['notice', 'customer']
};

export function render(root, { refresh }) {
  const key = store.get().activeBiz;
  const cfg = BUSINESSES[key];
  const role = store.get().session?.role;
  const writable = can(role, 'customer.write');
  const now = Date.now();
  const q = ctx.query;
  const visible = cust.list({}, key).filter((c) => cust.matchesFilter(c, ctx.filter, now, key) && cust.matchesQuery(c, q));
  const total = visible.length;

  root.append(h('p', { class: 'muted small', text: `${plural(total, 'مورد', 'مورد')} نمایش داده می‌شود` }));
  if (!total) {
    root.append(emptyState('موردی پیدا نشد', 'فیلتر یا جستجو را تغییر بده، یا یک اطلاعیه‌ی جدید ثبت کن.'));
  }

  const board = h('div', { class: 'board', role: 'list' });
  cfg.stages.forEach((st, index) => {
    const items = visible.filter((c) => c.stage === index);
    const sum = items.reduce((s, c) => s + (c.amount || 0), 0);
    const col = h('section', {
      class: `col ${st.won ? 'won' : st.lost ? 'lost' : ''}`.trim(),
      dataset: { stage: String(index) },
      role: 'listitem',
      'aria-label': st.label
    },
    h('header', { class: 'col-head' },
      h('h3', { text: st.label }),
      h('span', { class: 'count', text: String(items.length) })),
    sum ? h('p', { class: 'col-sum muted small', text: money(sum) }) : null);

    col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('drop'); });
    col.addEventListener('dragleave', () => col.classList.remove('drop'));
    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drop');
      const id = Number(e.dataTransfer.getData('text/plain'));
      if (id) moveTo(id, index);
    });

    for (const c of items) col.append(card(c));
    board.append(col);
  });
  root.append(board);
  if (ctx.focusId) {
    const card = board.querySelector(`.kcard[data-id="${ctx.focusId}"]`);
    ctx.focusId = null;
    card?.focus();
  }

  function moveTo(id, stage) {
    const r = cust.moveStage(id, stage, key);
    if (r.error) {
      toast(r.error, { tone: 'warn' });
      return;
    }
    ctx.focusId = id;
    toast(`به «${cfg.stages[stage].label}» منتقل شد`);
    refresh();
  }

  function card(c) {
    const el = h('article', { class: 'kcard', tabindex: '0', draggable: writable ? 'true' : 'false', dataset: { id: String(c.id) } },
      h('div', { class: 'kcard-top' },
        h('strong', { text: c.name }),
        c.amount ? h('span', { class: 'amount', text: money(c.amount) }) : null),
      h('div', { class: 'muted small', text: `${c.phone}${c.contact ? ` · ${c.contact}` : ''}` }),
      h('div', { class: 'row-meta' }, followBadge(c)),
      writable ? h('div', { class: 'card-controls' },
        h('button', { class: 'btn sm', type: 'button', onClick: () => openActivityForm({ customerId: c.id, type: 'call', onSaved: refresh }) }, 'تماس'),
        h('select', {
          class: 'input sm', 'aria-label': 'تغییر مرحله',
          onChange: (e) => moveTo(c.id, Number(e.target.value))
        }, ...cfg.stages.map((s, i) => h('option', { value: String(i), selected: i === c.stage, text: s.label }))),
        h('button', { class: 'btn sm danger', type: 'button', onClick: () => askDelete(c) }, 'حذف')) : null);

    if (writable) {
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', String(c.id));
        el.classList.add('picked');
      });
      el.addEventListener('dragend', () => el.classList.remove('picked'));
      el.addEventListener('keydown', (e) => {
        if (e.target !== el) return;
        // ↑ ↓: کارت قبلی/بعدی در همان ستون
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const cards = [...el.parentElement.querySelectorAll('.kcard')];
          const i = cards.indexOf(el) + (e.key === 'ArrowDown' ? 1 : -1);
          cards[i]?.focus();
          return;
        }
        // ← →: تغییر مرحله (در چیدمان راست‌به‌چپ، ← به ستون سمت چپ می‌رود)
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          const next = Math.min(cfg.stages.length - 1, Math.max(0, c.stage + (e.key === 'ArrowLeft' ? 1 : -1)));
          if (next !== c.stage) moveTo(c.id, next);
        }
      });
    }
    openOnBodyClick(el, c.id, refresh);
    return el;
  }

  function askDelete(c) {
    confirmDialog({
      title: 'حذف مشتری',
      message: `«${c.name}» حذف شود؟ تا ۵ ثانیه می‌توانی بازگردانی.`,
      confirmLabel: 'حذف',
      danger: true,
      onConfirm: () => {
        const r = cust.removeCustomer(c.id, key);
        if (!r.snapshot) return;
        toast('اطلاعیه حذف شد', { actionLabel: 'بازگردانی', onAction: () => cust.restoreCustomer(r.snapshot, key) });
      }
    });
  }
}
