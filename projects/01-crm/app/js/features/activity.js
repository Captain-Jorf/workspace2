// ثبت فعالیت (تماس، پیام، جلسه، ایمیل) و تعیین تاریخ پیگیری بعدی
import * as db from '../core/db.js';
import { h } from '../core/dom.js';
import { FOLLOW_UP_OPTIONS } from '../config/businesses.js';
import { ACTIVITY_TYPES, logActivity, byId } from '../domain/customers.js';
import { field, input, select, textarea } from '../ui/form.js';
import { openDialog, closeDialog, toast } from '../ui/dialog.js';

export function openActivity(customerId, onDone) {
  const c = byId(customerId);
  if (!c) return;
  const type = select(ACTIVITY_TYPES, 'call');
  const text = textarea({ rows: 3, placeholder: 'خلاصه‌ی گفتگو یا تصمیم بعدی' });
  const follow = select(FOLLOW_UP_OPTIONS, 2);
  const form = h('form', { class: 'form-grid', novalidate: true },
    field({ label: 'نوع فعالیت', control: type }),
    field({ label: 'پیگیری بعدی', control: follow, hint: 'اگر لازم نیست، همان پیش‌فرض بماند' }),
    field({ label: 'یادداشت فعالیت', control: text, span: true }));
  const save = () => {
    const res = logActivity(customerId, { type: type.value, text: text.value, follow: Number(follow.value) });
    if (res.error) { toast(res.error); return; }
    closeDialog();
    toast('فعالیت ثبت شد.');
    onDone && onDone(res.customer);
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); save(); });
  openDialog({
    kind: 'drawer',
    title: `ثبت فعالیت · ${c.name}`,
    sub: 'Ctrl+Enter برای ذخیره',
    body: form,
    actions: [
      { label: 'انصراف', variant: 'ghost', onClick: () => closeDialog() },
      { label: 'ثبت فعالیت', variant: 'primary', primary: true, onClick: save }
    ]
  });
}
