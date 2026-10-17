// ورود از CSV (با پیش‌نمایش) و ادغام شماره‌های تکراری
import * as db from '../core/db.js';
import { h } from '../core/dom.js';
import { parseCsv } from '../core/csv.js';
import { downloadCsv } from '../core/download.js';
import { cleanPhone, isPhone, toFa } from '../core/format.js';
import { parseAmount } from '../core/validate.js';
import { BUSINESSES, SOURCES } from '../config/businesses.js';
import { importRows, duplicateGroups, mergeDuplicates } from '../domain/customers.js';
import { input } from '../ui/form.js';
import { openDialog, closeDialog, toast } from '../ui/dialog.js';

const COLUMNS = {
  name: ['نام', 'name'],
  phone: ['موبایل', 'شماره موبایل', 'phone'],
  source: ['منبع', 'منبع آشنایی', 'source'],
  stage: ['مرحله', 'stage'],
  amount: ['مبلغ', 'مبلغ (تومان)', 'amount']
};

export function downloadTemplate() {
  const key = db.activeBizKey();
  const stage = BUSINESSES[key].stages[0];
  downloadCsv([
    ['نام', 'موبایل', 'منبع', 'مرحله', 'مبلغ'],
    ['نمونه مشتری', '09120000000', SOURCES[0], stage, '0']
  ], `crm-${key}-template.csv`);
}

/** مقایسه‌ی متن فارسی: فاصله و نیم‌فاصله و تفاوت «ی/ی» را نادیده می‌گیرد */
const norm = (value) => String(value ?? '').replace(/\u200c/g, '').replace(/\s/g, '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase();

function columnIndex(header, names) {
  return header.findIndex((cell) => names.includes(String(cell).trim().toLowerCase()) || names.includes(String(cell).trim()));
}

/** ردیف‌های CSV را به رکورد مشتری تبدیل و موارد نامعتبر را شمارش می‌کند */
export function mapCsv(text, key = db.activeBizKey()) {
  const table = parseCsv(text);
  if (table.length < 2) return { records: [], total: 0, error: 'فایل خالی است یا ردیف داده ندارد.' };
  const header = table[0];
  const idx = Object.fromEntries(Object.entries(COLUMNS).map(([k, names]) => [k, columnIndex(header, names)]));
  if (idx.name < 0 || idx.phone < 0) return { records: [], total: 0, error: 'ستون «نام» و «موبایل» باید در فایل باشد.' };
  const stages = BUSINESSES[key].stages;
  const records = table.slice(1).map((row) => {
    const stageLabel = idx.stage >= 0 ? norm(row[idx.stage]) : '';
    const stageIndex = stages.findIndex((s) => norm(s) === stageLabel);
    return {
      name: String(row[idx.name] || '').trim(),
      phone: cleanPhone(row[idx.phone] || ''),
      source: idx.source >= 0 && SOURCES.includes(String(row[idx.source]).trim()) ? String(row[idx.source]).trim() : SOURCES[0],
      stage: stageIndex >= 0 ? stageIndex : 0,
      amount: idx.amount >= 0 ? parseAmount(row[idx.amount]) : 0
    };
  });
  return { records, total: records.length };
}

export function openImport(onDone) {
  let records = [];
  const file = input({ type: 'file', accept: '.csv,text/csv' });
  const summary = h('p', { class: 'muted', role: 'status' }, 'یک فایل CSV انتخاب کن. ستون‌های «نام» و «موبایل» الزامی است.');
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    if (!f) return;
    const parsed = mapCsv(await f.text());
    if (parsed.error) { records = []; summary.textContent = parsed.error; refresh(); return; }
    records = parsed.records;
    const valid = records.filter((r) => r.name.length >= 2 && isPhone(r.phone)).length;
    summary.textContent = `${toFa(parsed.total)} ردیف خوانده شد؛ ${toFa(valid)} ردیف معتبر است و ${toFa(parsed.total - valid)} ردیف نادیده گرفته می‌شود. شماره‌های تکراری هم رد می‌شوند.`;
    refresh();
  });
  const dlg = openDialog({
    kind: 'modal', title: 'ورود از فایل CSV', sub: 'ردیف‌های تکراری و نامعتبر رد می‌شوند',
    body: h('div', { class: 'import-body' },
      summary, file,
      h('button', { class: 'btn ghost sm', type: 'button', onClick: downloadTemplate }, 'دانلود فایل نمونه')),
    actions: [
      { label: 'انصراف', variant: 'ghost', onClick: () => closeDialog() },
      { label: 'ورود داده‌ها', variant: 'primary', primary: true, disabled: true, onClick: run }
    ]
  });
  const importBtn = dlg.panel.querySelectorAll('.dlg-actions .btn')[1];
  function refresh() { importBtn.disabled = records.length === 0; }
  function run() {
    const res = importRows(records);
    closeDialog();
    toast(`${toFa(res.added)} ردیف اضافه شد؛ ${toFa(res.skipped)} تکراری و ${toFa(res.invalid)} نامعتبر رد شد.`);
    onDone && onDone(res);
  }
}

export function openMerge(onDone) {
  const groups = duplicateGroups();
  if (!groups.length) { toast('شماره‌ی تکراری پیدا نشد.'); return; }
  const list = h('ul', { class: 'merge-list' }, groups.map((g) => h('li', {},
    h('strong', { text: g[0].phone }), h('span', { text: ` · ${g.map((c) => c.name).join('، ')}` }))));
  openDialog({
    kind: 'modal', title: 'ادغام شماره‌های تکراری',
    sub: `${toFa(groups.length)} گروه · قدیمی‌ترین رکورد می‌ماند و فاکتورها منتقل می‌شوند`,
    body: list,
    actions: [
      { label: 'انصراف', variant: 'ghost', onClick: () => closeDialog() },
      { label: 'ادغام همه', variant: 'primary', primary: true, onClick: () => {
        const n = mergeDuplicates();
        closeDialog();
        toast(`${toFa(n)} گروه ادغام شد.`);
        onDone && onDone(n);
      } }
    ]
  });
}
