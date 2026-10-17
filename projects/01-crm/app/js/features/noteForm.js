// فرم یادداشت: یادداشت آزاد یا وصل‌شده به یک مشتری (از صفحه‌ی یادداشت‌ها، نه از فرم مشتری).
import * as store from '../core/store.js';
import { h } from '../core/dom.js';
import * as cust from '../domain/customers.js';
import * as notes from '../domain/notes.js';
import { TITLE_MAX_WORDS, wordCount } from '../domain/notes.js';
import { openDialog } from '../ui/dialog.js';
import { toast } from '../ui/toast.js';
import { field, select, applyErrors, bindCtrlEnter } from './forms.js';

export function openNoteForm({ note = null, onSaved = () => {} } = {}) {
  const key = store.get().activeBiz;
  const customers = cust.list({}, key).slice().sort((a, b) => a.name.localeCompare(b.name, 'fa'));
  const title = h('input', { class: 'input', maxlength: '300', placeholder: 'عنوان کوتاه (حداکثر ۲۰ کلمه)', value: note ? (note.title || '') : '' });
  const titleWrap = field(`عنوان (حداکثر ${TITLE_MAX_WORDS} کلمه)`, title, { key: 'title', hint: `0 از ${TITLE_MAX_WORDS} کلمه`, wide: true });
  const counter = titleWrap.querySelector('.hint');
  const paintCount = () => {
    const n = wordCount(title.value);
    counter.textContent = `${n} از ${TITLE_MAX_WORDS} کلمه`;
    counter.style.color = n > TITLE_MAX_WORDS ? 'var(--danger)' : '';
  };
  title.addEventListener('input', paintCount);
  paintCount();
  const text = h('textarea', { class: 'input', rows: '6', placeholder: 'متن کامل یادداشت…' }, note?.text || '');
  const link = select(customers.map((c) => ({ value: String(c.id), label: c.name })), note?.customerId ? String(note.customerId) : '', 'بدون مشتری');
  const body = h('div', { class: 'form-grid' },
    titleWrap,
    field('متن یادداشت', text, { key: 'text', wide: true }),
    field('مربوط به مشتری (اختیاری)', link, { key: 'customerId', wide: true }));

  const submit = (close) => {
    const data = { title: title.value, text: text.value, customerId: link.value ? Number(link.value) : null };
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
  title.focus();
  return handle;
}
