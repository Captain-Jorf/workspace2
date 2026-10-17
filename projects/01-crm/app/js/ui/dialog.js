// کشو (drawer) و پنجره‌ی گفتگو (modal) با لایه‌ی پشت، بستن با Esc و کلیک بیرون، و پشته‌ی چند لایه.
import { h } from '../core/dom.js';

let stack = [];

function layer() {
  return document.getElementById('layer');
}

/** openDialog({ kind:'modal'|'drawer', title, sub, body, actions, size, onClose }) → { close, panel } */
export function openDialog({ kind = 'modal', title, sub = '', body, actions = [], size = '', onClose }) {
  const close = () => closeDialog(entry);
  const panel = h('section', {
    class: `panel ${kind} ${size}`.trim(),
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': title,
    tabindex: '-1'
  },
  h('header', { class: 'panel-head' },
    h('div', {},
      h('h2', { text: title }),
      sub ? h('p', { class: 'sub', text: sub }) : null),
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'بستن', onClick: () => close() }, '✕')),
  h('div', { class: 'panel-body' }, body),
  actions.length
    ? h('footer', { class: 'panel-foot' }, ...actions.map((a) => h('button', {
      class: `btn ${a.variant || ''}`.trim(),
      type: 'button',
      disabled: a.disabled,
      onClick: () => a.onClick?.(close)
    }, a.label)))
    : null);
  const wrap = h('div', { class: 'dialog-wrap' },
    h('div', { class: 'scrim', onClick: () => close() }),
    panel);
  const entry = { wrap, onClose };
  stack.push(entry);
  layer().append(wrap);
  requestAnimationFrame(() => {
    wrap.classList.add('on');
    panel.focus();
  });
  return { close, panel };
}

/** بستن یک لایه؛ بدون آرگومان، لایه‌ی بالایی بسته می‌شود */
export function closeDialog(entry) {
  if (!stack.length) return;
  const target = entry && stack.includes(entry) ? entry : stack[stack.length - 1];
  stack = stack.filter((e) => e !== target);
  target.wrap.remove();
  target.onClose?.();
}

export const isDialogOpen = () => stack.length > 0;

export function closeAllDialogs() {
  while (stack.length) closeDialog(stack[stack.length - 1]);
}

/** پیام تأیید ساده با دو دکمه (انصراف / تأیید) */
export function confirmDialog({ title, message, confirmLabel = 'تأیید', danger = false, onConfirm }) {
  openDialog({
    kind: 'modal',
    size: 'small',
    title,
    body: h('p', { class: 'confirm-text', text: message }),
    actions: [
      { label: 'انصراف', variant: 'ghost', onClick: (close) => close() },
      {
        label: confirmLabel,
        variant: danger ? 'danger-solid' : 'primary',
        onClick: (close) => {
          close();
          onConfirm?.();
        }
      }
    ]
  });
}
