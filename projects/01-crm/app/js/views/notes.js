// یادداشت‌ها: هر کارت عنوان و پیش‌نمایش دارد. با کلیک (یا Enter) پنجره‌ی متن کامل باز می‌شود؛ ویرایش و حذف از همان‌جا.
import { h } from '../core/dom.js';
import { plural } from '../core/format.js';
import { formatDateTime } from '../core/jalali.js';
import { BUSINESSES } from '../config/businesses.js';
import { can } from '../config/roles.js';
import * as store from '../core/store.js';
import * as notes from '../domain/notes.js';
import * as cust from '../domain/customers.js';
import { toast } from '../ui/toast.js';
import { openDialog, confirmDialog } from '../ui/dialog.js';
import { openNoteForm } from '../features/noteForm.js';
import { emptyState } from './parts.js';
import { ctx } from '../ui/context.js';
import { toEn } from '../core/format.js';

export const meta = {
  label: 'یادداشت‌ها',
  icon: '✎',
  title: 'یادداشت‌ها',
  sub: () => `${BUSINESSES[store.get().activeBiz].title} · یادداشت آزاد یا وصل به مشتری`,
  chips: false,
  actions: ['note']
};

export function render(root, { refresh }) {
  const key = store.get().activeBiz;
  const role = store.get().session?.role;
  const writable = can(role, 'note.write');
  const q = toEn(ctx.query || '').trim().toLowerCase();
  const rows = notes.list(key).filter((n) => !q || notes.titleOf(n).toLowerCase().includes(q) || n.text.toLowerCase().includes(q));

  root.append(h('p', { class: 'muted small', text: `${plural(rows.length, 'یادداشت', 'یادداشت')}` }));
  if (!rows.length) {
    root.append(emptyState('یادداشتی نیست', 'با دکمه‌ی «یادداشت جدید» اولین یادداشت را بنویس.'));
    return;
  }
  const list = h('div', { class: 'card-list' });
  for (const n of rows) {
    const c = n.customerId ? cust.byId(n.customerId, key) : null;
    const card = h('article', { class: 'kcard note-card', tabindex: '0', role: 'button', 'aria-label': `مشاهده‌ی یادداشت: ${notes.titleOf(n)}`, dataset: { id: String(n.id) } },
      h('strong', { class: 'note-title', text: notes.titleOf(n) }),
      h('p', { class: 'note-preview muted', text: n.text }),
      h('div', { class: 'row-meta' },
        h('span', { class: 'muted small', text: c ? `مشتری: ${c.name}` : 'یادداشت آزاد' }),
        h('span', { class: 'muted small', text: formatDateTime(n.updatedAt) })),
      writable ? h('div', { class: 'card-actions' },
        h('button', { class: 'btn sm', type: 'button', onClick: (e) => { e.stopPropagation(); openNoteForm({ note: n, onSaved: refresh }); } }, 'ویرایش'),
        h('button', { class: 'btn sm danger', type: 'button', onClick: (e) => { e.stopPropagation(); askDelete(n, refresh); } }, 'حذف')) : null);
    card.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      openNoteView(n, { writable, refresh, customerName: c?.name });
    });
    card.addEventListener('keydown', (e) => {
      if (e.target === card && e.key === 'Enter') openNoteView(n, { writable, refresh, customerName: c?.name });
    });
    list.append(card);
  }
  root.append(list);
}

/** پنجره‌ی متن کامل یادداشت */
export function openNoteView(note, { writable = false, refresh = () => {}, customerName = '' } = {}) {
  const body = h('div', { class: 'note-full' },
    h('p', { class: 'note-body', text: note.text }),
    h('p', { class: 'muted small', text: [customerName ? `مشتری: ${customerName}` : 'یادداشت آزاد', `ثبت: ${formatDateTime(note.createdAt)}`, note.updatedAt !== note.createdAt ? `ویرایش: ${formatDateTime(note.updatedAt)}` : ''].filter(Boolean).join(' · ') }));
  const actions = [{ label: 'بستن', variant: 'ghost', onClick: (close) => close() }];
  if (writable) {
    actions.push({ label: 'حذف', variant: 'danger', onClick: (close) => { close(); askDelete(note, refresh); } });
    actions.push({ label: 'ویرایش', variant: 'primary', onClick: (close) => { close(); openNoteForm({ note, onSaved: refresh }); } });
  }
  openDialog({ kind: 'modal', size: 'wide', title: notes.titleOf(note), sub: '', body, actions });
}

function askDelete(note, refresh) {
  const key = store.get().activeBiz;
  confirmDialog({
    title: 'حذف یادداشت', message: `«${notes.titleOf(note)}» حذف شود؟ تا ۵ ثانیه می‌توانی بازگردانی.`,
    confirmLabel: 'حذف', danger: true,
    onConfirm: () => {
      const r = notes.removeNote(note.id, key);
      if (!r.snapshot) return;
      toast('یادداشت حذف شد', { actionLabel: 'بازگردانی', onAction: () => { notes.restoreNote(r.snapshot, key); refresh(); } });
      refresh();
    }
  });
}
