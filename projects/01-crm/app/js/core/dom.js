// ابزارهای کوچک برای ساخت و یافتن عناصر DOM (بدون کتابخانه‌ی خارجی)

/**
 * h('button', { class: 'btn', onClick: fn }, 'متن', child)
 * - کلیدهای on* به رویداد تبدیل می‌شوند
 * - مقدار null/false نادیده گرفته می‌شود
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'value' || key === 'checked' || key === 'selected' || key === 'disabled' || key === 'hidden') {
      el[key] = value;
    } else if (key === 'dataset') {
      Object.assign(el.dataset, value);
    } else {
      el.setAttribute(key, value === true ? '' : String(value));
    }
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function clear(el) {
  el.replaceChildren();
  return el;
}

/** یک گزینه‌ی select بسازد */
export function options(list, selectedValue) {
  return list.map((item) => {
    const value = typeof item === 'object' ? item.value : item;
    const label = typeof item === 'object' ? item.label : item;
    return h('option', { value: String(value), selected: String(value) === String(selectedValue) }, label);
  });
}
