// کتابخانه‌ی نمودارهای SVG بدون وابستگی: میله‌ای، مساحتی، دونات، گیج، قیف و میله‌ی افقی.
// رنگ‌ها ملایم‌اند و متن‌ها از متغیرهای تم می‌آیند تا در حالت شب هم خوانا بمانند.
import { h } from '../core/dom.js';
import { toFa } from '../core/format.js';

export const PALETTE = ['#5aa2d6', '#6fc2a0', '#f0b35a', '#e0788f', '#9b8ae0', '#5fc7c4', '#e8956d', '#a6c15e'];
const NS = 'http://www.w3.org/2000/svg';
let uid = 0;

function el(tag, attrs = {}, ...kids) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== undefined && v !== null && v !== false) node.setAttribute(k, String(v));
  }
  for (const k of kids.flat()) if (k) node.append(k);
  return node;
}
const text = (value) => document.createTextNode(String(value));
const titleEl = (value) => el('title', {}, text(value));

/** عدد کوتاه فارسی: ۱٫۲ میلیون، ۴۵ هزار */
export function compact(n) {
  const v = Math.abs(n);
  if (v >= 1e9) return `${toFa((n / 1e9).toFixed(1))} میلیارد`;
  if (v >= 1e6) return `${toFa((n / 1e6).toFixed(1))} میلیون`;
  if (v >= 1e3) return `${toFa(Math.round(n / 1e3))} هزار`;
  return toFa(Math.round(n));
}

function gradient(id, color, top = 0.9, bottom = 0.25) {
  return el('defs', {},
    el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 },
      el('stop', { offset: '0%', 'stop-color': color, 'stop-opacity': top }),
      el('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': bottom })));
}

/** نمودار ستونی عمودی با برچسب مقدار و تولتیپ */
export function barChart(items, { height = 190, fmt = compact, color = PALETTE[0], labelEvery = 1 } = {}) {
  const W = 360; const H = height; const pad = { t: 22, b: 30, l: 8, r: 8 };
  const max = Math.max(1, ...items.map((i) => i.value));
  const step = (W - pad.l - pad.r) / Math.max(1, items.length);
  const gid = `bg${++uid}`;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', preserveAspectRatio: 'xMidYMid meet' });
  svg.append(el('defs', {}, gradient(gid, color).firstChild));
  items.forEach((it, i) => {
    const bh = Math.max(2, ((H - pad.t - pad.b) * it.value) / max);
    const w = step * 0.6; const x = pad.l + i * step + (step - w) / 2; const y = H - pad.b - bh;
    const g = el('g', { class: 'bar-col' });
    g.append(el('rect', { x, y, width: w, height: bh, rx: 7, fill: `url(#${gid})`, class: 'cbar' }), titleEl(`${it.label}: ${fmt(it.value)}`));
    g.append(el('text', { x: x + w / 2, y: y - 6, 'text-anchor': 'middle', class: 'val' }, text(fmt(it.value))));
    if (i % labelEvery === 0 || i === items.length - 1) g.append(el('text', { x: x + w / 2, y: H - pad.b + 16, 'text-anchor': 'middle', class: 'lbl' }, text(it.label)));
    svg.append(g);
  });
  return svg;
}

/** نمودار مساحتی خطی برای روند زمانی */
export function areaChart(points, { height = 170, fmt = compact, color = PALETTE[0], labelEvery = 1 } = {}) {
  const W = 360; const H = height; const pad = { t: 18, b: 24, l: 10, r: 10 };
  const max = Math.max(1, ...points.map((p) => p.value));
  const n = points.length;
  const xs = (i) => (n <= 1 ? W / 2 : pad.l + (i * (W - pad.l - pad.r)) / (n - 1));
  const ys = (v) => H - pad.b - ((H - pad.t - pad.b) * v) / max;
  const gid = `ag${++uid}`;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(p.value).toFixed(1)}`).join(' ');
  const area = `${line} L${xs(n - 1).toFixed(1)},${H - pad.b} L${xs(0).toFixed(1)},${H - pad.b} Z`;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img' });
  svg.append(el('defs', {}, gradient(gid, color, 0.45, 0.02).firstChild));
  for (let g = 1; g <= 3; g += 1) {
    const y = pad.t + ((H - pad.t - pad.b) * g) / 4;
    svg.append(el('line', { x1: pad.l, x2: W - pad.r, y1: y, y2: y, class: 'grid-line' }));
  }
  svg.append(el('path', { d: area, fill: `url(#${gid})`, class: 'area' }));
  svg.append(el('path', { d: line, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', class: 'area-line' }));
  points.forEach((p, i) => {
    const c = el('circle', { cx: xs(i), cy: ys(p.value), r: 3.5, fill: color, class: 'dot' });
    c.append(titleEl(`${p.label}: ${fmt(p.value)}`));
    svg.append(c);
    if (i % labelEvery === 0) svg.append(el('text', { x: xs(i), y: H - 6, 'text-anchor': 'middle', class: 'lbl' }, text(p.label)));
  });
  return svg;
}

/** اسپارک‌لاین کوچک برای کارت‌های شاخص */
export function sparkline(values, color = PALETTE[1]) {
  const W = 120; const H = 36;
  const max = Math.max(1, ...values); const n = values.length;
  const pts = values.map((v, i) => [n <= 1 ? W : (i * W) / (n - 1), H - 4 - ((H - 8) * v) / max]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const gid = `sg${++uid}`;
  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'spark', preserveAspectRatio: 'none' });
  svg.append(el('defs', {}, gradient(gid, color, 0.4, 0).firstChild));
  svg.append(el('path', { d: `${d} L${W},${H} L0,${H} Z`, fill: `url(#${gid})` }));
  svg.append(el('path', { d, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' }));
  return svg;
}

/** دونات با لیست رنگی */
export function donut(items, { center = '', sub = '' } = {}) {
  const S = 180; const r = 70; const C = 2 * Math.PI * r;
  const total = items.reduce((s, i) => s + i.value, 0);
  const svg = el('svg', { viewBox: `0 0 ${S} ${S}`, class: 'chart donut' });
  svg.append(el('circle', { cx: S / 2, cy: S / 2, r, fill: 'none', 'stroke-width': 22, class: 'donut-track' }));
  const g = el('g', { transform: `rotate(-90 ${S / 2} ${S / 2})` });
  let off = 0;
  items.forEach((it, i) => {
    if (!total || !it.value) return;
    const len = (C * it.value) / total;
    const seg = el('circle', {
      cx: S / 2, cy: S / 2, r, fill: 'none', 'stroke-width': 22, stroke: it.color || PALETTE[i % PALETTE.length],
      'stroke-dasharray': `${len} ${C - len}`, 'stroke-dashoffset': -off, class: 'donut-seg'
    });
    seg.append(titleEl(`${it.label}: ${toFa(it.value)}`));
    g.append(seg);
    off += len;
  });
  svg.append(g);
  svg.append(el('text', { x: S / 2, y: S / 2 + 2, 'text-anchor': 'middle', class: 'donut-center' }, text(center)));
  svg.append(el('text', { x: S / 2, y: S / 2 + 22, 'text-anchor': 'middle', class: 'donut-sub' }, text(sub)));
  const legend = h('ul', { class: 'legend' }, ...items.map((it, i) => h('li', {},
    h('i', { style: { background: it.color || PALETTE[i % PALETTE.length] } }),
    h('span', { text: it.label }),
    h('strong', { text: toFa(it.value) }))));
  return h('div', { class: 'donut-wrap' }, svg, legend);
}

/** گیج نیم‌دایره برای درصد */
export function gauge(pct, label = '') {
  const p = Math.max(0, Math.min(100, pct));
  const r = 70; const cx = 90; const cy = 92;
  const pt = (a) => [cx + r * Math.cos(Math.PI * (1 - a)), cy - r * Math.sin(Math.PI * (1 - a))];
  const arc = (a0, a1) => {
    const [x0, y0] = pt(a0); const [x1, y1] = pt(a1);
    return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
  };
  const svg = el('svg', { viewBox: '0 0 180 110', class: 'chart gauge' });
  svg.append(el('path', { d: arc(0, 1), fill: 'none', 'stroke-width': 16, 'stroke-linecap': 'round', class: 'donut-track' }));
  if (p > 0) svg.append(el('path', { d: arc(0, p / 100), fill: 'none', 'stroke-width': 16, 'stroke-linecap': 'round', stroke: PALETTE[1] }));
  svg.append(el('text', { x: cx, y: cy - 8, 'text-anchor': 'middle', class: 'donut-center' }, text(`${toFa(Math.round(p))}٪`)));
  svg.append(el('text', { x: cx, y: cy + 12, 'text-anchor': 'middle', class: 'donut-sub' }, text(label)));
  return svg;
}

/** قیف فروش: هر مرحله یک نوار با عرض نسبی */
export function funnel(items) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return h('div', { class: 'funnel' }, ...items.map((it, i) => h('div', { class: 'funnel-row' },
    h('span', { class: 'funnel-label', text: it.label }),
    h('span', { class: 'funnel-bar', style: { width: `${Math.max(12, (it.count / max) * 100)}%`, background: PALETTE[i % PALETTE.length] }, text: toFa(it.count) }),
    h('small', { class: 'muted small', text: it.amount ? compact(it.amount) : '—' }))));
}

/** میله‌های افقی با برچسب و مقدار */
export function hbars(items, { fmt = toFa } = {}) {
  if (!items.length) return h('p', { class: 'muted small', text: 'داده‌ای نیست' });
  const max = Math.max(1, ...items.map((i) => i.value));
  return h('div', { class: 'hbars' }, ...items.map((it, i) => h('div', { class: 'hbar-row' },
    h('span', { class: 'hbar-label', text: it.label }),
    h('span', { class: 'hbar-track' },
      h('span', { class: 'hbar-fill', style: { width: `${Math.max(2, (it.value / max) * 100)}%`, background: PALETTE[i % PALETTE.length] } })),
    h('strong', { class: 'hbar-val', text: fmt(it.value) }))));
}

/** کارت شاخص: عنوان، عدد بزرگ و اسپارک‌لاین */
export function kpiTile(label, value, spark, color) {
  return h('div', { class: 'dash-kpi' },
    h('span', { class: 'muted small', text: label }),
    h('strong', { text: value }),
    spark ? sparkline(spark, color) : null);
}

/** کارت نمودار با عنوان */
export function chartCard(title, body, { wide = false, sub = '' } = {}) {
  return h('section', { class: `dash-card${wide ? ' wide' : ''}` },
    h('header', { class: 'dash-card-head' }, h('h3', { text: title }), sub ? h('span', { class: 'muted small', text: sub }) : null),
    body);
}

/** گزارش کار نموداری یک مشتری؛ بالای پنجره‌ی جزئیات مشتری نشان داده می‌شود */
export function customerReport(stats) {
  const { invoices, paid, due, total, activitiesByType, daily, statusItems } = stats;
  const paidPct = total ? (paid / total) * 100 : 0;
  return h('div', { class: 'cust-report' },
    h('div', { class: 'dash-kpis' },
      kpiTile('کل فاکتورها', compact(total)),
      kpiTile('پرداخت‌شده', compact(paid)),
      kpiTile('مانده', compact(due)),
      kpiTile('فعالیت‌ها', toFa(activitiesByType.reduce((s, i) => s + i.value, 0)))),
    h('div', { class: 'dash-grid compact' },
      chartCard('فعالیت در ۳۰ روز گذشته', daily.some((d) => d.value) ? barChart(daily, { height: 160, fmt: toFa, color: PALETTE[5], labelEvery: 5 }) : h('p', { class: 'muted small', text: 'در ۳۰ روز گذشته فعالیتی ثبت نشده است.' }), { wide: true, sub: 'هر ستون یک روز است؛ عدد بالای ستون تعداد فعالیت همان روز' }),
      chartCard('نوع فعالیت', hbars(activitiesByType)),
      chartCard('وضعیت فاکتورها', invoices ? donut(statusItems, { center: toFa(invoices), sub: 'فاکتور' }) : h('p', { class: 'muted small', text: 'فاکتوری ثبت نشده است.' })),
      chartCard('وصول مبلغ فاکتورها', gauge(paidPct, 'وصول شده'))));
}

const dayFmtFa = new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short' });
/** شمارش رویدادها برای n روز اخیر؛ هر روز یک نقطه/ستون */
export function dailyCounts(times, days, now = Date.now()) {
  const d0 = new Date(now); d0.setHours(0, 0, 0, 0);
  const today = d0.getTime(); const DAY = 86400000; const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const from = today - i * DAY; const to = from + DAY;
    out.push({ label: dayFmtFa.format(from), value: times.filter((t) => t >= from && t < to).length });
  }
  return out;
}

export { el as svgEl };
