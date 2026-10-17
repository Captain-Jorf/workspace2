// کمک‌های مشترک صفحه‌ها: دسترسی نقش، کارت، کنترل مرحله، حالت خالی و تغییر مرحله با پیام خطا.
import { h } from '../core/dom.js';
import { moveStage } from '../domain/customers.js';
import { BUSINESSES } from '../config/businesses.js';
import * as db from '../core/db.js';
import * as auth from '../domain/auth.js';
import { can } from '../core/permissions.js';
import { toast } from '../ui/dialog.js';
import { select } from '../ui/form.js';

export const allowed = (action) => can(auth.session()?.role, action);

/** فیلد انتخاب مرحله؛ وقتی مجاز نباشد فقط متن نمایش داده می‌شود */
export function stageControl(c, onMoved) {
  const key = db.activeBizKey();
  const stages = BUSINESSES[key].stages;
  if (!allowed('customer.move')) return h('span', { class: 'stage-tag', text: stages[c.stage] });
  const sel = select(stages.map((s, i) => ({ value: i, label: s })), c.stage, {
    class: 'input sm', 'aria-label': `تغییر مرحله‌ی ${c.name}`
  });
  sel.addEventListener('change', () => {
    const res = moveStage(c.id, Number(sel.value));
    if (res.error) { toast(res.error); sel.value = String(c.stage); return; }
    onMoved && onMoved(res.customer);
  });
  return sel;
}

/** جابه‌جایی یک مرحله؛ خطا را نشان می‌دهد و false برمی‌گرداند */
export function tryMove(c, stage) {
  const res = moveStage(c.id, stage);
  if (res.error) { toast(res.error); return false; }
  return true;
}

export function emptyState(text, action = null) {
  return h('div', { class: 'empty' }, h('p', { text }), action);
}

export function pageHead(title, sub, actions = []) {
  return h('header', { class: 'page-head' },
    h('div', {}, h('h2', { text: title }), sub ? h('p', { class: 'sub', text: sub }) : null),
    h('div', { class: 'page-actions' }, actions));
}

export function kpi(label, value, tone = '') {
  return h('div', { class: `kpi ${tone}`.trim() }, h('span', { class: 'k', text: label }), h('strong', { class: 'v', text: value }));
}

