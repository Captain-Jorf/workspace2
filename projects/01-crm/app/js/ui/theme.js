// اعمال تم (روز یا شب)، زبان و جهت متن، و اندازه‌ی فونت روی <html>. تم شب از colorways.js می‌آید.
import * as store from '../core/store.js';
import { colorwayById } from '../config/colorways.js';
import { dirOf } from '../core/i18n.js';

const INK = '#12293a';
const FONT_SCALE = { small: '0.9', medium: '1', large: '1.15' };

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** متن روی دکمه‌ی اصلی: سفید یا تیره، هر کدام کنتراست بیشتری داشت */
export function onAccent(hex) {
  return contrast(hex, '#ffffff') >= contrast(hex, INK) ? '#ffffff' : INK;
}

const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

export function applyTheme() {
  const s = store.get();
  if (!s) return;
  const root = document.documentElement;
  const cw = colorwayById(s.colorway);
  const night = !!cw.bgMid;
  const set = (k, v) => root.style.setProperty(k, v);

  root.dataset.theme = night ? 'dark' : 'light';
  root.dataset.colorway = cw.id;
  set('--accent', cw.accent);
  set('--accent-strong', cw.accentStrong);
  set('--on-accent', onAccent(cw.accent));
  if (night) {
    set('--accent-soft', rgba(cw.accent, 0.16));
    set('--grad-top', cw.bgTop);
    set('--grad-mid', cw.bgMid);
    set('--glass', rgba(cw.card, 0.5));
    set('--glass-strong', rgba(cw.card, 0.92));
    set('--line', cw.line);
  } else {
    set('--accent-soft', cw.soft);
    set('--grad-top', cw.tint);
    set('--grad-mid', cw.mid);
    set('--glass', 'rgba(255, 255, 255, 0.38)');
    set('--glass-strong', 'rgba(255, 255, 255, 0.85)');
    set('--line', 'rgba(18, 41, 58, 0.1)');
  }

  const lang = s.lang || 'fa';
  root.lang = lang;
  root.dir = dirOf(lang);
  root.style.setProperty('--fs', FONT_SCALE[s.fontSize] || '1');
}
