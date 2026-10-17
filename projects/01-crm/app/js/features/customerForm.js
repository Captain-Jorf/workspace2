// فرم ایجاد/ویرایش مشتری (کشوی راست). توضیحات مشتری اینجا است، نه یادداشت‌های صفحه‌ی جدا.
import * as db from '../core/db.js';
import { h } from '../core/dom.js';
import { cleanPhone, isPhone } from '../core/format.js';
import { parseAmount } from '../core/validate.js';
import { BUSINESSES, SOURCES, FOLLOW_UP_OPTIONS, MONEY_FROM_STAGE } from '../config/businesses.js';
import { createCustomer, updateCustomer, needsAmount, stageFlags } from '../domain/customers.js';
import { field, input, select, textarea, setError, clearErrors } from '../ui/form.js';
import { openDialog, closeDialog, toast } from '../ui/dialog.js';
import { extraControls, readExtra } from './extraFields.js';

/**
 * openCustomerForm({ stage, customer, onSaved })
 * - بدون customer: مشتری/سرنخ جدید در مرحله‌ی stage
 * - با customer: ویرایش
 */
export function openCustomerForm({ stage = 0, customer = null, onSaved } = {}) {
  const key = db.activeBizKey();
  const biz = BUSINESSES[key];
  const isEdit = !!customer;
  const c = customer || {};
  const startStage = isEdit ? c.stage : stage;

  const name = input({ type: 'text', value: c.name || '', placeholder: 'نام مشتری یا شرکت', maxlength: '80' });
  const phone = input({ type: 'tel', inputmode: 'numeric', value: c.phone || '', placeholder: '09xxxxxxxxx', maxlength: '11' });
  const source = select(SOURCES.map((s) => ({ value: s, label: s })), c.source || SOURCES[0]);
  const stageSel = select(biz.stages.map((s, i) => ({ value: i, label: s })), startStage);
  const amount = input({ type: 'text', inputmode: 'numeric', value: c.amount ? String(c.amount) : '', placeholder: 'مثلاً ۶۵۰۰۰۰۰۰' });
  const followList = isEdit ? [{ value: 0, label: 'بدون تغییر' }, ...FOLLOW_UP_OPTIONS] : FOLLOW_UP_OPTIONS;
  const follow = select(followList, isEdit ? 0 : 2);
  const notes = textarea({ rows: 3, placeholder: 'هر نکته‌ای که درباره‌ی این مشتری لازم است' });
  notes.value = c.notes || '';
  const formError = h('div', { class: 'form-alert', role: 'alert' });

  const amountHint = () => (needsAmount(Number(stageSel.value), key)
    ? `برای «${biz.stages[Number(stageSel.value)]}» مبلغ الزامی است.`
    : `مبلغ از مرحله‌ی «${biz.stages[MONEY_FROM_STAGE]}» به بعد الزامی می‌شود.`);
  const amountField = field({ label: 'مبلغ (تومان)', control: amount, hint: amountHint() });
  stageSel.addEventListener('change', () => {
    amountField.querySelector('.hint').textContent = amountHint();
  });

  const form = h('form', { class: 'form-grid', novalidate: true },
    field({ label: 'نام', control: name, span: true }),
    field({ label: 'شماره موبایل', control: phone, hint: 'فقط ۱۱ رقم، بدون فاصله' }),
    field({ label: 'منبع آشنایی', control: source }),
    field({ label: 'مرحله', control: stageSel }),
    amountField,
    field({ label: 'پیگیری بعدی', control: follow }),
    ...extraControls(key, c.extra),
    h('h3', { class: 'section-title span' }, 'توضیحات'),
    field({ label: 'توضیحات مشتری', control: notes, span: true }),
    formError);

  const save = () => {
    clearErrors(form);
    formError.textContent = '';
    const data = {
      name: name.value,
      phone: cleanPhone(phone.value),
      source: source.value,
      stage: Number(stageSel.value),
      amount: parseAmount(amount.value),
      follow: Number(follow.value),
      notes: notes.value,
      extra: readExtra(form, key)
    };
    let bad = false;
    if (String(data.name).trim().length < 2) { setError(form, name.id, 'نام را حداقل ۲ حرف وارد کن.'); bad = true; }
    if (!isPhone(data.phone)) { setError(form, phone.id, 'شماره موبایل باید ۱۱ رقم و با 09 شروع شود.'); bad = true; }
    if (needsAmount(data.stage, key) && !(data.amount > 0)) { setError(form, amount.id, 'برای این مرحله مبلغ الزامی است.'); bad = true; }
    if (bad) return;
    const res = isEdit ? updateCustomer(c.id, data) : createCustomer(data);
    if (res.error) { formError.textContent = res.error; return; }
    closeDialog();
    toast(isEdit ? 'تغییرات ذخیره شد.' : `«${data.name}» ثبت شد.`);
    onSaved && onSaved(res.customer);
  };
  form.addEventListener('submit', (e) => { e.preventDefault(); save(); });

  openDialog({
    kind: 'drawer',
    title: isEdit ? 'ویرایش مشتری' : (stageFlags(startStage, key).won ? 'مشتری جدید' : 'اطلاعیه‌ی جدید'),
    sub: 'Ctrl+Enter برای ذخیره',
    body: form,
    actions: [
      { label: 'انصراف', variant: 'ghost', onClick: () => closeDialog() },
      { label: 'ذخیره', variant: 'primary', primary: true, onClick: save }
    ]
  });
}
