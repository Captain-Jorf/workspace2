// اطلاعیه‌ها (پایپ‌لاین): ستون به‌ازای هر مرحله؛ کشیدن، کیبورد (← →)، انتخاب گروهی و منوی تغییر مرحله.
import { h, clear } from '../core/dom.js';
import { followUpLabel, money, toFa } from '../core/format.js';
import { BUSINESSES } from '../config/businesses.js';
import * as db from '../core/db.js';
import { list, matchesFilter, matchesQuery, moveStage, removeCustomer, restoreCustomer, stageFlags } from '../domain/customers.js';
import { openCustomerDetail } from '../features/customerDetail.js';
import { openActivity } from '../features/activity.js';
import { confirmDialog, toast } from '../ui/dialog.js';
import { select } from '../ui/form.js';
import { allowed, emptyState, pageHead, tryMove } from './common.js';

export const meta = {
  id: 'notices', title: 'اطلاعیه‌ها', label: 'اطلاعیه‌ها', icon: '▦', filters: true, search: true,
  searchPlaceholder: 'جستجوی اطلاعیه‌ها (کلید /)'
};

const INTERACTIVE = 'button, select, input, textarea, label, a';

export function mount(root, ctx) {
  const selected = new Set();
  const wrap = h('div', { class: 'view notices' });
  const bulk = h('div', { class: 'bulk-bar', hidden: true, role: 'region', 'aria-label': 'انتخاب گروهی' });
  const board = h('div', { class: 'board', role: 'list' });
  wrap.append(pageHead('اطلاعیه‌ها', 'کارت‌ها را بکش یا با کلید ← و → جابه‌جا کن. روی کارت بزنی جزئیات باز می‌شود.'), bulk, board);
  root.append(wrap);

  function refresh() {
    const key = db.activeBizKey();
    const biz = BUSINESSES[key];
    const items = list({}).filter((c) => matchesFilter(c, ctx.filter) && matchesQuery(c, ctx.query));
    const ids = new Set(list({}).map((c) => c.id));
    [...selected].forEach((id) => { if (!ids.has(id)) selected.delete(id); });
    clear(board);
    biz.stages.forEach((stageName, idx) => {
      const col = items.filter((c) => c.stage === idx).sort((a, b) => a.next - b.next);
      board.append(column(idx, stageName, col));
    });
    renderBulk();
  }

  function column(idx, name, items) {
    const flags = stageFlags(idx);
    const colEl = h('section', {
      class: `col${flags.won ? ' won' : ''}${flags.lost ? ' lost' : ''}`, role: 'listitem', dataset: { stage: idx },
      'aria-label': `${name}، ${items.length} مورد`
    },
    h('header', { class: 'col-head' }, h('h3', { text: name }), h('span', { class: 'count', text: toFa(items.length) })),
    h('div', { class: 'col-body' }, items.length ? items.map(card) : emptyState('اطلاعیه‌ای در این مرحله نیست.')));
    if (allowed('customer.move')) {
      colEl.addEventListener('dragover', (e) => { e.preventDefault(); colEl.classList.add('drop'); });
      colEl.addEventListener('dragleave', () => colEl.classList.remove('drop'));
      colEl.addEventListener('drop', (e) => {
        e.preventDefault();
        colEl.classList.remove('drop');
        const id = Number(e.dataTransfer.getData('text/plain'));
        const c = list({}).find((x) => x.id === id);
        if (c && c.stage !== idx) tryMove(c, idx);
      });
    }
    return colEl;
  }

  function card(c) {
    const key = db.activeBizKey();
    const f = followUpLabel(c.next);
    const canMove = allowed('customer.move');
    const checkbox = h('input', { type: 'checkbox', class: 'pick', 'aria-label': `انتخاب ${c.name}`, checked: selected.has(c.id) });
    checkbox.addEventListener('change', () => {
      checkbox.checked ? selected.add(c.id) : selected.delete(c.id);
      refresh();
    });
    const stageSel = canMove ? select(BUSINESSES[key].stages.map((s, i) => ({ value: i, label: s })), c.stage, { class: 'input sm', 'aria-label': `تغییر مرحله‌ی ${c.name}` }) : null;
    if (stageSel) stageSel.addEventListener('change', () => {
      if (!tryMove(c, Number(stageSel.value))) stageSel.value = String(c.stage);
    });
    const el = h('article', {
      class: `card kcard tone-${f.tone}${selected.has(c.id) ? ' picked' : ''}`,
      tabindex: '0', role: 'button', dataset: { id: c.id, stage: c.stage },
      draggable: canMove ? 'true' : 'false', 'aria-label': `${c.name}، ${f.text}. Enter برای جزئیات، ← و → برای تغییر مرحله`
    },
    h('div', { class: 'kcard-top' }, checkbox, h('h4', { text: c.name })),
    h('p', { class: 'muted', text: `${c.phone}${c.amount ? ' · ' + money(c.amount) : ''}` }),
    h('span', { class: `follow ${f.tone}`, text: f.text }),
    h('div', { class: 'card-actions' },
      allowed('customer.activity') ? h('button', { class: 'btn ghost sm', type: 'button', onClick: () => openActivity(c.id) }, 'تماس') : null,
      stageSel,
      allowed('customer.delete') ? h('button', { class: 'btn danger-text sm', type: 'button', onClick: () => remove(c) }, 'حذف') : null));

    el.addEventListener('click', (e) => {
      if (e.target.closest(INTERACTIVE)) return;
      openCustomerDetail(c.id);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target === el) { e.preventDefault(); openCustomerDetail(c.id); return; }
      if (e.key === ' ' && e.target === el) { e.preventDefault(); checkbox.click(); return; }
      if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && canMove && e.target === el) {
        e.preventDefault();
        const step = e.key === 'ArrowRight' ? 1 : -1;
        const target = c.stage + step;
        if (!BUSINESSES[key].stages[target]) return;
        if (tryMove(c, target)) {
          // کارت را بعد از رندر دوباره فوکوس کن تا کیبورد ادامه بدهد
          queueMicrotask(() => board.querySelector(`[data-id="${c.id}"]`)?.focus());
        }
      }
    });
    if (canMove) {
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', String(c.id));
        e.dataTransfer.effectAllowed = 'move';
        el.classList.add('dragging');
      });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));
    }
    return el;
  }

  function remove(c) {
    confirmDialog({ title: 'حذف اطلاعیه', message: `«${c.name}» و فاکتورهایش حذف شود؟`, confirmLabel: 'حذف', danger: true }).then((ok) => {
      if (!ok) return;
      const snap = removeCustomer(c.id);
      if (snap) toast(`«${c.name}» حذف شد.`, { ms: 5000, action: { label: 'بازگردانی', run: () => restoreCustomer(snap) } });
    });
  }

  function renderBulk() {
    clear(bulk);
    bulk.hidden = selected.size === 0 || !allowed('customer.move');
    if (bulk.hidden) return;
    const key = db.activeBizKey();
    const target = select(BUSINESSES[key].stages.map((s, i) => ({ value: i, label: s })), 0, { 'aria-label': 'مرحله‌ی مقصد' });
    bulk.append(
      h('strong', { text: `${toFa(selected.size)} مورد انتخاب شده` }),
      target,
      h('button', { class: 'btn primary sm', type: 'button', onClick: () => bulkMove(Number(target.value)) }, 'انتقال'),
      h('button', { class: 'btn ghost sm', type: 'button', onClick: () => { selected.clear(); refresh(); } }, 'لغو انتخاب'));
  }

  function bulkMove(stage) {
    let ok = 0, fail = 0, lastError = '';
    selected.forEach((id) => {
      const res = moveStage(id, stage);
      if (res.error) { fail++; lastError = res.error; } else ok++;
    });
    selected.clear();
    toast(fail ? `${toFa(ok)} مورد منتقل شد؛ ${toFa(fail)} مورد نشد: ${lastError}` : `${toFa(ok)} مورد منتقل شد.`);
    refresh();
  }

  refresh();
  return { refresh };
}
