// صفحه‌ی شروع: انتخاب یکی از پنج کسب‌وکار دمو و ورود با نقش دمو یا حساب خود کاربر.
import { h, clear } from '../core/dom.js';
import { BIZ_ORDER, BUSINESSES } from '../config/businesses.js';
import { ROLES } from '../core/permissions.js';
import * as auth from '../domain/auth.js';
import { openDialog, closeDialog } from './dialog.js';
import { field, input, clearErrors } from './form.js';

export function renderStart(root, onPick) {
  clear(root);
  BIZ_ORDER.forEach((key) => {
    const biz = BUSINESSES[key];
    root.append(h('article', { class: 'glass biz', dataset: { biz: key } },
      h('h2', {}, biz.title),
      h('p', {}, biz.desc),
      h('ul', {}, biz.features.map((f) => h('li', {}, f))),
      h('p', { class: 'stages' }, 'مراحل: ', biz.stages.join(' ← ')),
      h('button', { class: 'btn primary', type: 'button', onClick: () => onPick(key) }, 'انتخاب این کسب‌وکار')
    ));
  });
}

/** نقش‌های دمو + ورود با حساب کاربری شخصی */
export function showRoleDialog(bizKey, onDone) {
  const biz = BUSINESSES[bizKey];
  const roleButtons = Object.entries(ROLES).map(([role, def]) => h('button', {
    class: 'role-btn', type: 'button', dataset: { role },
    onClick: () => { auth.loginDemo(role); closeDialog(); onDone(); }
  },
  h('strong', {}, `ورود به‌عنوان ${def.label} نمونه`),
  h('small', {}, role === 'manager' ? 'همه‌ی امکانات: حذف، ادغام، ایمپورت و تنظیمات' : role === 'sales' ? 'پیگیری، فاکتور و پرداخت؛ بدون حذف' : 'پیگیری و یادداشت؛ بدون فاکتور')));
  openDialog({
    title: `ورود به دمو: ${biz.short}`,
    sub: 'نقش دمو را انتخاب کن یا با حساب خودت وارد شو.',
    body: h('div', { class: 'role-list' },
      roleButtons,
      h('button', { class: 'btn ghost wide', type: 'button', onClick: () => showAccountDialog(bizKey, onDone) }, 'ورود یا ثبت‌نام با حساب خودم')),
    actions: []
  });
}

/** فرم ورود و ثبت‌نام با شماره و رمز (روی همین دستگاه) */
export function showAccountDialog(bizKey, onDone) {
  let mode = 'login';
  const name = input({ type: 'text', placeholder: 'مثلاً زهرا احمدی' });
  const phone = input({ type: 'tel', inputmode: 'numeric', placeholder: '09129194975', maxlength: '11' });
  const pass = input({ type: 'password', autocomplete: 'current-password' });
  const nameField = field({ label: 'نام', control: name, span: true });
  const alertBox = h('div', { class: 'form-alert', role: 'alert' });
  const form = h('form', { class: 'form-grid', novalidate: true },
    nameField,
    field({ label: 'شماره موبایل', control: phone }),
    field({ label: 'رمز', control: pass, hint: 'حداقل ۶ نویسه' }),
    alertBox);
  nameField.hidden = true;

  const submit = async () => {
    clearErrors(form);
    alertBox.textContent = '';
    const payload = { name: name.value, phone: phone.value, password: pass.value };
    const result = mode === 'login' ? await auth.login(payload) : await auth.register(payload);
    if (result.error) { alertBox.textContent = result.error; return; }
    closeDialog();
    onDone();
  };

  const primary = h('button', { class: 'btn primary', type: 'button', onClick: submit }, 'ورود');
  const switcher = h('button', { class: 'btn ghost', type: 'button' }, 'ساخت حساب جدید');
  switcher.addEventListener('click', () => {
    mode = mode === 'login' ? 'register' : 'login';
    nameField.hidden = mode === 'login';
    switcher.textContent = mode === 'login' ? 'ساخت حساب جدید' : 'ورود با حساب موجود';
    primary.textContent = mode === 'login' ? 'ورود' : 'ثبت‌نام';
    pass.setAttribute('autocomplete', mode === 'login' ? 'current-password' : 'new-password');
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });

  openDialog({
    title: 'حساب کاربری',
    sub: 'حساب روی همین دستگاه ساخته می‌شود و رمز به‌صورت رمزنگاری‌شده ذخیره می‌شود.',
    body: h('div', {}, form, h('div', { class: 'row-actions' }, switcher, h('button', { class: 'btn ghost', type: 'button', onClick: () => showRoleDialog(bizKey, onDone) }, 'بازگشت به نقش‌های دمو'), primary))
  });
}
