// صفحه‌ی شروع: ورود / ثبت‌نام (یا ورود نمونه با یکی از سه نقش)، سپس انتخاب کسب‌وکار.
import * as store from '../core/store.js';
import { h, clear, $ } from '../core/dom.js';
import { BUSINESSES, BUSINESS_KEYS } from '../config/businesses.js';
import { ensureSeed } from '../data/seed.js';
import { DEMO_USERS, demoLogin, login, register, logout } from '../domain/auth.js';
import { field, applyErrors } from '../features/forms.js';
import { toast } from './toast.js';
import { applyTheme } from './theme.js';
import { mountShell, unmountShell } from './shell.js';
import { closeAllDialogs } from './dialog.js';

/** خروج از حساب و بازگشت به صفحه‌ی ورود */
export function signOut() {
  closeAllDialogs();
  logout();
  toast('از حساب خارج شدی');
  showStart();
}

export function showStart() {
  const s = store.get();
  unmountShell();
  $('#start').hidden = false;
  const root = $('#start');
  clear(root);
  root.append(h('header', { class: 'start-head glass' },
    h('h1', { text: 'CRM ساده' }),
    h('p', { text: s.session ? 'یک کسب‌وکار نمونه را انتخاب کن. داده‌ها روی همین دستگاه ذخیره می‌شوند و بدون اینترنت کار می‌کنند.' : 'برای ادامه وارد شو یا یک حساب نمونه انتخاب کن.' })));
  root.append(s.session ? bizPicker() : authPanel());
  root.append(h('p', { class: 'footnote', text: 'همه‌ی اطلاعات نمونه ساختگی‌اند.' }));
}

function bizPicker() {
  const grid = h('div', { class: 'biz-grid' });
  for (const key of BUSINESS_KEYS) {
    const b = BUSINESSES[key];
    grid.append(h('button', { class: 'biz-card', type: 'button', onClick: () => enter(key) },
      h('strong', { text: b.title }),
      h('span', { class: 'muted small', text: b.description }),
      h('span', { class: 'btn sm primary', text: 'ورود به این کسب‌وکار' })));
  }
  return h('section', { class: 'start-body' },
    h('p', { class: 'muted small', text: `ورود به عنوان ${store.get().session.name}` }),
    grid,
    h('button', { class: 'btn ghost', type: 'button', onClick: () => signOut() }, 'خروج از حساب'));
}

function authPanel() {
  const mode = { value: 'login' };
  const box = h('div', { class: 'auth-box' });
  const paint = () => {
    clear(box);
    const tabs = h('div', { class: 'chips', role: 'tablist' },
      ...[['login', 'ورود'], ['register', 'ثبت‌نام']].map(([id, label]) => h('button', {
        class: 'chip', type: 'button', role: 'tab', 'aria-selected': String(mode.value === id),
        onClick: () => { mode.value = id; paint(); }
      }, label)));
    const name = h('input', { class: 'input', placeholder: 'نام و نام خانوادگی', autocomplete: 'name' });
    const phone = h('input', { class: 'input ltr', placeholder: '09xxxxxxxxx', inputmode: 'tel', autocomplete: 'tel' });
    const pass = h('input', { class: 'input ltr', type: 'password', placeholder: 'رمز عبور', autocomplete: mode.value === 'login' ? 'current-password' : 'new-password' });
    const form = h('form', { class: 'form-grid', novalidate: true },
      mode.value === 'register' ? field('نام', name, { key: 'name', wide: true }) : null,
      field('شماره موبایل', phone, { key: 'phone', wide: true }),
      field('رمز عبور', pass, { key: 'password', wide: true }),
      h('div', { class: 'form-actions wide' },
        h('button', { class: 'btn primary', type: 'submit' }, mode.value === 'login' ? 'ورود' : 'ثبت‌نام')));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const r = mode.value === 'login'
        ? await login({ phone: phone.value, password: pass.value })
        : await register({ name: name.value, phone: phone.value, password: pass.value });
      if (r.errors) { applyErrors(form, r.errors); return; }
      if (r.error) { applyErrors(form, { password: r.error }); return; }
      toast(mode.value === 'login' ? 'خوش آمدی' : 'حساب ساخته شد');
      showStart();
    });
    box.append(tabs, form);
  };
  paint();

  const demo = h('div', { class: 'demo-roles' },
    h('p', { class: 'muted small', text: 'یا با یک حساب نمونه وارد شو:' }),
    h('div', { class: 'chips' }, ...DEMO_USERS.map((u) => h('button', {
      class: 'chip', type: 'button', onClick: () => { demoLogin(u.role); showStart(); }
    }, u.name))));
  return h('section', { class: 'start-body auth' }, box, demo);
}

function enter(key) {
  const s = store.get();
  ensureSeed(key);
  s.activeBiz = key;
  store.commit();
  applyTheme();
  $('#start').hidden = true;
  mountShell();
}

/** اگر جلسه و کسب‌وکار فعال باشد، مستقیم وارد پوسته می‌شود */
export function resumeOrStart() {
  const s = store.get();
  applyTheme();
  if (s.session && s.activeBiz && BUSINESSES[s.activeBiz]) {
    $('#start').hidden = true;
    mountShell();
  } else {
    showStart();
  }
}
