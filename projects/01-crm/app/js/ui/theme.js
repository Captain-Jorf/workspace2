// اعمال حالت نمایش (روز/شب) و رنگ‌بندی روی کل برنامه، از طریق متغیرهای CSS روی <html>.
import * as db from '../core/db.js';
import { colorwayById } from '../config/colorways.js';

const INK = '#12293a';

function channels(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance(hex) {
  const c = channels(hex).map((v) => {
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

export function applyTheme() {
  const s = db.current();
  const root = document.documentElement;
  const dark = s.theme === 'dark';
  const cw = colorwayById(s.colorway);
  const accent = dark ? cw.dark.accent : cw.accent;
  const strong = dark ? cw.dark.accentStrong : cw.accentStrong;

  root.dataset.theme = dark ? 'dark' : 'light';
  root.dataset.colorway = cw.id;
  root.style.setProperty('--accent', accent);
  root.style.setProperty('--accent-strong', strong);
  root.style.setProperty('--on-accent', onAccent(accent));
  root.style.setProperty('--accent-soft', cw.soft);
  root.style.setProperty('--grad-top', cw.tint);
  root.style.setProperty('--grad-mid', cw.mid);
}
