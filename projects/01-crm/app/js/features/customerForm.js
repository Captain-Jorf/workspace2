// فرم مشتری/سرنخ: ساخت و ویرایش. سه فیلد اجباری اصلی + مرحله + پیگیری بعدی + فیلدهای اختصاصی کسب‌وکار.
import { h } from '../core/dom.js';
import { money, parseMoney } from '../core/format.js';
import { addDays } from '../core/jalali.js';
import { BUSINESSES } from '../config/businesses.js';
import { createCustomer, updateCustomer, stages, bizKey } from '../domain/customers.js';
import { openDialog } from '../ui/dialog.js';
import { toast } from '../ui/toast.js';
import { field, select, applyErrors, bindCtrlEnter } from './forms.js';

export const FOLLOW_OPTIONS = [
  { value: 'none', label: 'بدون پیگیری' },
  { value: '1', label: 'فردا' },
  { value: '2', label: '۲ روز دیگر (پیشنهادی)' },
  { value: '7', label: 'یک هفته دیگر' },
  { value: '14', label: 'دو هفته دیگر' }
];

export function followUpFrom(value, now = Date.now()) {
  if (value === 'none') return null;
  return addDays(now, Number(value));
}

/** openCustomerForm({ customer, presetStage, onSaved }) */
export function openCustomerForm({ customer = null, presetStage = 0, onSaved = () => {} } = {}) {
  const key = bizKey();
  const cfg = BUSINESSES[key];
  const st = stages(key);
  const isEdit = !!customer;

  const name = h('input', { class: 'input', value: customer?.name || '', autocomplete: 'off', placeholder: 'نام مشتری یا سازمان' });
  const contact = h('input', { class: 'input', value: customer?.contact || '', autocomplete: 'off', placeholder: 'نام مسئول تماس' });
  const phone = h('input', { class: 'input ltr', type: 'tel', inputmode: 'numeric', value: customer?.phone || '', placeholder: '09xxxxxxxxx' });
  const source = select(cfg.sources.map((s) => ({ value: s, label: s })), customer?.source || '', 'انتخاب کن');
  const stageSel = select(st.map((s, i) => ({ value: String(i), label: s.label })), String(customer?.stage ?? presetStage));
  const amount = h('input', { class: 'input', inputmode: 'numeric', value: customer?.amount ? String(customer.amount) : '', placeholder: 'مثلاً ۲۵۰۰۰۰۰' });
  const followOpts = isEdit ? [{ value: 'keep', label: 'بدون تغییر' }, ...FOLLOW_OPTIONS] : FOLLOW_OPTIONS;
  const follow = select(followOpts, isEdit ? 'keep' : '2');

  const amountWrap = field('مبلغ (تومان)', amount, { key: 'amount', hint: 'اختیاری' });
  const amountHint = amountWrap.querySelector('.hint');
  const syncAmount = () => {
    const needed = !!st[Number(stageSel.value)]?.amount;
    amountHint.textContent = needed ? 'برای این مرحله، مبلغ الزامی است' : 'اختیاری';
  };
  stageSel.addEventListener('change', syncAmount);
  syncAmount();

  const fieldInputs = {};
  const customFields = cfg.fields.map((f) => {
    const current = customer?.fields?.[f.key] ?? '';
    let control;
    if (f.kind === 'select') control = select(f.options.map((o) => ({ value: o, label: o })), current, 'انتخاب کن');
    else control = h('input', { class: 'input', value: current, inputmode: f.kind === 'money' ? 'numeric' : 'text' });
    fieldInputs[f.key] = control;
    return field(f.label, control, { key: `fields.${f.key}` });
  });

  const body = h('div', { class: 'form-grid' },
    field('نام', name, { key: 'name', wide: true }),
    field(cfg.nameStyle === 'company' ? 'نام مسئول' : 'تماس‌گیرنده (اختیاری)', contact, { key: 'contact' }),
    field('شماره موبایل', phone, { key: 'phone', hint: 'مثلاً 09121234567' }),
    field('منبع آشنایی', source, { key: 'source' }),
    field('مرحله', stageSel, { key: 'stage' }),
    amountWrap,
    field('پیگیری بعدی', follow, { key: 'follow', hint: isEdit ? `فعلی: ${customer.followUpAt === null ? 'بدون پیگیری' : 'ثبت شده'}` : '' }),
    ...customFields);

  const submit = (close) => {
    const data = {
      name: name.value,
      contact: contact.value,
      phone: phone.value,
      source: source.value,
      stage: stageSel.value,
      amount: parseMoney(amount.value),
      fields: Object.fromEntries(Object.entries(fieldInputs).map(([k, el]) => [k, el.value]))
    };
    if (isEdit) {
      if (follow.value !== 'keep') data.followUpAt = followUpFrom(follow.value);
    } else {
      data.followUpAt = followUpFrom(follow.value);
    }
    const result = isEdit ? updateCustomer(customer.id, data, key) : createCustomer(data, key);
    if (result.errors) {
      applyErrors(body, Object.fromEntries(Object.entries(result.errors).map(([k, v]) => [k === 'stage' ? 'stage' : k, v])));
      return;
    }
    close();
    toast(isEdit ? 'تغییرات مشتری ذخیره شد' : 'مشتری جدید ثبت شد');
    onSaved(result.customer);
  };

  const handle = openDialog({
    kind: 'drawer',
    title: isEdit ? 'ویرایش مشتری' : 'مشتری جدید',
    sub: `${cfg.short} · فیلدهای ستاره‌دار اجباری‌اند`,
    body,
    actions: [
      { label: 'انصراف', variant: 'ghost', onClick: (close) => close() },
      { label: 'ذخیره', variant: 'primary', onClick: (close) => submit(close) }
    ]
  });
  bindCtrlEnter(handle.panel, () => submit(handle.close));
  name.focus();
  return handle;
}
