// یادداشت‌ها: صفحه‌ی جدا برای یادداشت‌های داخلی؛ در فرم یا جزئیات مشتری نمایش داده نمی‌شوند.
import { h, clear } from '../core/dom.js';
import { jDateTime, toFa } from '../core/format.js';
import * as notes from '../domain/notes.js';
import { byId } from '../domain/customers.js';
import { openNoteForm } from '../features/noteForm.js';
import { openCustomerDetail } from '../features/customerDetail.js';
import { confirmDialog, toast } from '../ui/dialog.js';
import { allowed, emptyState, pageHead } from './common.js';

export const meta = {
  id: 'notes', title: 'یادداشت‌ها', label: 'یادداشت‌ها', icon: '✎', filters: false, search: true,
  searchPlaceholder: 'جستجوی یادداشت‌ها (کلید /)'
};

export function mount(root, ctx) {
  const wrap = h('div', { class: 'view notes' });
  root.append(wrap);

  function refresh() {
    const items = notes.list({ query: ctx.query });
    clear(wrap);
    wrap.append(
      pageHead('یادداشت‌ها', `${toFa(items.length)} یادداشت · فقط در این صفحه دیده می‌شوند`, [
        allowed('note.manage') ? h('button', { class: 'btn primary', type: 'button', onClick: () => openNoteForm({ onDone: refresh }) }, 'یادداشت جدید') : null
      ]),
      items.length
        ? h('div', { class: 'note-grid' }, items.map(card))
        : emptyState(ctx.query ? 'یادداشتی با این عبارت پیدا نشد.' : 'هنوز یادداشتی نداری.', allowed('note.manage')
          ? h('button', { class: 'btn primary', type: 'button', onClick: () => openNoteForm({}) }, 'یادداشت جدید') : null));
  }

  function card(n) {
    const linked = n.customerId ? byId(n.customerId) : null;
    return h('article', { class: 'card note', dataset: { id: n.id } },
      h('h3', { text: n.title }),
      n.body ? h('p', { class: 'note-body', text: n.body }) : h('p', { class: 'muted', text: 'متنی ثبت نشده است.' }),
      h('footer', { class: 'note-foot' },
        linked
          ? h('button', { class: 'link-btn sm', type: 'button', onClick: () => openCustomerDetail(linked.id) }, `مشتری: ${linked.name}`)
          : h('span', { class: 'muted', text: 'بدون مشتری' }),
        h('time', { class: 'muted', text: jDateTime(n.updatedAt) })),
      allowed('note.manage') ? h('div', { class: 'card-actions' },
        h('button', { class: 'btn ghost sm', type: 'button', onClick: () => openNoteForm({ note: n, onDone: refresh }) }, 'ویرایش'),
        h('button', { class: 'btn danger-text sm', type: 'button', onClick: () => remove(n) }, 'حذف')) : null);
  }

  async function remove(n) {
    const ok = await confirmDialog({ title: 'حذف یادداشت', message: `«${n.title}» حذف شود؟`, confirmLabel: 'حذف', danger: true });
    if (!ok) return;
    const snap = notes.remove(n.id);
    if (snap) toast('یادداشت حذف شد.', { ms: 5000, action: { label: 'بازگردانی', run: () => notes.restore(snap) } });
  }

  refresh();
  return { refresh };
}
