// یادداشت‌ها: صفحه‌ی مستقل. هر یادداشت می‌تواند به یک مشتری وصل باشد. ویرایش و حذف (با بازگردانی ۵ ثانیه‌ای).
import { h } from '../core/dom.js';
import { plural } from '../core/format.js';
import { formatDateTime } from '../core/jalali.js';
import { BUSINESSES } from '../config/businesses.js';
import { can } from '../config/roles.js';
import * as store from '../core/store.js';
import * as notes from '../domain/notes.js';
import * as cust from '../domain/customers.js';
import { toast } from '../ui/toast.js';
import { confirmDialog } from '../ui/dialog.js';
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
  const rows = notes.list(key).filter((n) => !q || n.text.toLowerCase().includes(q));

  root.append(h('p', { class: 'muted small', text: `${plural(rows.length, 'یادداشت', 'یادداشت')}` }));
  if (!rows.length) {
    root.append(emptyState('یادداشتی نیست', 'با دکمه‌ی «یادداشت جدید» اولین یادداشت را بنویس.'));
    return;
  }
  const list = h('div', { class: 'card-list' });
  for (const n of rows) {
    const c = n.customerId ? cust.byId(n.customerId, key) : null;
    list.append(h('article', { class: 'kcard note-card' },
      h('p', { class: 'note-text', text: n.text }),
      h('div', { class: 'row-meta' },
        h('span', { class: 'muted small', text: c ? `مشتری: ${c.name}` : 'یادداشت آزاد' }),
        h('span', { class: 'muted small', text: formatDateTime(n.updatedAt) })),
      writable ? h('div', { class: 'card-actions' },
        h('button', { class: 'btn sm', type: 'button', onClick: () => openNoteForm({ note: n, onSaved: refresh }) }, 'ویرایش'),
        h('button', { class: 'btn sm danger', type: 'button', onClick: () => confirmDialog({
          title: 'حذف یادداشت', message: 'این یادداشت حذف شود؟ تا ۵ ثانیه می‌توانی بازگردانی.',
          confirmLabel: 'حذف', danger: true,
          onConfirm: () => {
            const r = notes.removeNote(n.id, key);
            if (!r.snapshot) return;
            toast('یادداشت حذف شد', { actionLabel: 'بازگردانی', onAction: () => { notes.restoreNote(r.snapshot, key); refresh(); } });
            refresh();
          }
        }) }, 'حذف')) : null));
  }
  root.append(list);
}
