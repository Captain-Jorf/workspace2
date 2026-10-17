// فرم یادداشت: یادداشت آزاد یا وصل‌شده به یک مشتری (از صفحه‌ی یادداشت‌ها، نه از فرم مشتری).
import * as store from '../core/store.js';
import { h } from '../core/dom.js';
import * as cust from '../domain/customers.js';
import * as notes from '../domain/notes.js';
import { openDialog } from '../ui/dialog.js';
import { toast } from '../ui/toast.js';
import { field, select, applyErrors, bindCtrlEnter } from './forms.js';

export function openNoteForm({ note = null, onSaved = () => {} } = {}) {
  const key = store.get().activeBiz;
  const customers = cust.list({}, key).slice().sort((a, b) => a.name.localeCompare(b.name, 'fa'));
  const text = h('textarea', { class: 'input', rows: '5', placeholder: 'متن یادداشت…' }, note?.text || '');
  const link = select(customers.map((c) => ({ value: String(c.id), label: c.name })), note?.customerId ? String(note.customerId) : '', 'بدون مشتری');
  const body = h('div', { class: 'form-grid' },
    field('متن یادداشت', text, { key: 'text', wide: true }),
    field('مربوط به مشتری (اختیاری)', link, { key: 'customerId', wide: true }));

  const submit = (close) => {
    const data = { text: text.value, customerId: link.value ? Number(link.value) : null };
    const r = note ? notes.updateNote(note.id, data, key) : notes.createNote(data, key);
    if (r.errors) {
      applyErrors(body, r.errors);
      return;
    }
    close();
    toast(note ? 'یادداشت ذخیره شد' : 'یادداشت ثبت شد');
    onSaved(r.note);
  };
  const handle = openDialog({
    kind: 'modal', size: 'small', title: note ? 'ویرایش یادداشت' : 'یادداشت جدید', sub: 'Ctrl+Enter برای ذخیره',
    body,
    actions: [
      { label: 'انصراف', variant: 'ghost', onClick: (close) => close() },
      { label: 'ذخیره', variant: 'primary', onClick: (close) => submit(close) }
    ]
  });
  bindCtrlEnter(handle.panel, () => submit(handle.close));
  text.focus();
  return handle;
}
