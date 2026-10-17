// پیام کوتاه پایین صفحه. با actionLabel می‌شود «بازگردانی» داد (Undo) تا ۵ ثانیه.
import { h } from '../core/dom.js';

const MAX = 3;

export function toast(message, { actionLabel = null, onAction = null, ms = 5000, tone = 'info' } = {}) {
  const host = document.getElementById('toasts');
  while (host.children.length >= MAX) host.firstElementChild.remove();
  let timer = null;
  const el = h('div', { class: `toast ${tone}`, role: 'status' },
    h('span', { text: message }),
    actionLabel
      ? h('button', {
        class: 'toast-btn',
        type: 'button',
        onClick: () => {
          clearTimeout(timer);
          el.remove();
          onAction?.();
        }
      }, actionLabel)
      : null);
  host.append(el);
  requestAnimationFrame(() => el.classList.add('on'));
  timer = setTimeout(() => {
    el.classList.remove('on');
    setTimeout(() => el.remove(), 250);
  }, ms);
  return el;
}
