// یادداشت‌های داخلی: فرم ایجاد/ویرایش (صفحه‌ی یادداشت‌ها، نه فرم مشتری)
import * as db from '../core/db.js';
import { h } from '../core/dom.js';
import * as notes from '../domain/notes.js';
import { list as listCustomers } from '../domain/customers.js';
import { field, input, select, textarea, setError, clearErrors } from '../ui/form.js';
import { openDialog, closeDialog, toast } from '../ui/dialog.js';

export function openNoteForm({ note = null, onDone } = {}) {
  const key = db.activeBizKey();
  const isEdit = !!note;
  const title = input({ type: 'text', value: note?.title || '', placeholder: 'عنوان کوتاه یادداشت', maxlength: '80' });
  const customers = listCustomers({}, key).sort((a, b) => a.name.localeCompare(b.name, 'fa'));
  const link = select([{ value: '', label: '— بدون مشتری —' }, ...customers.map((c) => ({ value: c.id, label: c.name }))], note?.customerId ?? '');
  const body = textarea({ rows: 6, placeholder: 'متن یادداشت' });
  body.value = note?.body || '';
  const formError = h('div', { class: 'form-alert', role: 'alert' });
  const form = h('form', { class: 'form-grid', novalidate: true },
    field({ label: 'عنوان', control: title, span: true }),
    field({ label: 'مرتبط با مشتری', control: link, span: true }),
    field({ label: 'متن', control: body, span: true }),
    formError);

  const save = () => {
    clearErrors(form);
    formError.textContent = '';
    const data = { title: title.value, body: body.value, customerId: link.value ? Number(link.value) : null };
    const res = isEdit ? notes.update(note.id, data, key) : notes.create(data, key);
    if (res.error) { setError(form, title.id, res.error); return; }
    closeDialog();
    toast(isEdit ? 'یادداشت ذخیره شد.' : 'یادداشت ثبت شد.');
    onDone && onDone(res.note);
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); save(); });
  openDialog({
    kind: 'drawer', title: isEdit ? 'ویرایش یادداشت' : 'یادداشت جدید', sub: 'Ctrl+Enter برای ذخیره', body: form,
    actions: [
      { label: 'انصراف', variant: 'ghost', onClick: () => closeDialog() },
      { label: 'ذخیره', variant: 'primary', primary: true, onClick: save }
    ]
  });
}
