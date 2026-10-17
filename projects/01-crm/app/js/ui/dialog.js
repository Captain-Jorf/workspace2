// پنجره‌ی مودال و کشوی کناری (یکی همزمان)، پیام کوتاه و تأیید
import { h } from '../core/dom.js';

let current = null;

function layer() {
  return document.getElementById('layer');
}

export function closeDialog() {
  if (!current) return;
  const done = current;
  current = null;
  done.panel.classList.remove('on');
  done.scrim.classList.remove('on');
  setTimeout(() => { done.panel.remove(); done.scrim.remove(); }, 180);
  done.onClose && done.onClose();
}

export const isDialogOpen = () => !!current;

/**
 * openDialog({ kind:'modal'|'drawer', title, sub, body, actions, size, onClose })
 * actions: [{ label, variant:'primary'|'danger'|'ghost', primary:true, disabled, onClick }]
 * primary → Ctrl+Enter هم آن را اجرا می‌کند. ترتیب DOM = راست به چپ در RTL.
 */
export function openDialog({ kind = 'modal', title, sub = '', body, actions = [], size = '', onClose }) {
  closeDialog();
  const scrim = h('div', { class: 'scrim', onClick: () => closeDialog() });
  const closeBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'بستن', onClick: () => closeDialog() }, '✕');
  const footer = actions.length
    ? h('footer', { class: 'dlg-actions' }, actions.map((a) => h('button', {
      class: `btn ${a.variant || ''}`.trim(), type: 'button', disabled: !!a.disabled,
      onClick: () => a.onClick && a.onClick()
    }, a.label)))
    : null;
  const panel = h('section', {
    class: `panel ${kind} ${size}`.trim(), role: 'dialog', 'aria-modal': 'true', 'aria-label': title, tabindex: '-1'
  },
  h('header', { class: 'dlg-head' }, h('div', {}, h('h2', { text: title }), sub ? h('p', { class: 'sub' }, sub) : null), closeBtn),
  h('div', { class: 'dlg-body' }, body),
  footer);
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      const primary = actions.find((a) => a.primary && !a.disabled);
      if (primary) { e.preventDefault(); primary.onClick && primary.onClick(); }
    }
  });
  layer().append(scrim, panel);
  current = { scrim, panel, onClose };
  requestAnimationFrame(() => {
    panel.classList.add('on');
    scrim.classList.add('on');
    const first = panel.querySelector('input:not([type=hidden]), select, textarea');
    if (first) first.focus({ preventScroll: true });
    else panel.focus({ preventScroll: true });
  });
  return { close: closeDialog, panel };
}

/** پیام تأیید؛ Promise برمی‌گرداند که true یا false است */
export function confirmDialog({ title, message, confirmLabel = 'تأیید', danger = false }) {
  return new Promise((resolve) => {
    let answered = false;
    const finish = (value) => { if (!answered) { answered = true; resolve(value); } };
    openDialog({
      kind: 'modal',
      size: 'small',
      title,
      body: h('p', { class: 'confirm-text' }, message),
      actions: [
        { label: 'انصراف', variant: 'ghost', onClick: () => { finish(false); closeDialog(); } },
        { label: confirmLabel, variant: danger ? 'danger solid' : 'primary', primary: true, onClick: () => { finish(true); closeDialog(); } }
      ],
      onClose: () => finish(false)
    });
  });
}

// ---- پیام کوتاه (toast) با دکمه‌ی اختیاری «بازگردانی» ----
let toastTimer = null;
export function toast(message, { action = null, ms = 4000 } = {}) {
  const box = document.getElementById('toasts');
  box.replaceChildren();
  const node = h('div', { class: 'toast on', role: 'status' },
    h('span', { text: message }),
    action ? h('button', { class: 'btn sm', type: 'button', onClick: () => { action.run(); hide(); } }, action.label) : null
  );
  box.append(node);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hide, ms);
  function hide() {
    clearTimeout(toastTimer);
    node.classList.remove('on');
    setTimeout(() => node.remove(), 200);
  }
}
