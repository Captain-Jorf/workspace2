// دانلود فایل از داخل مرورگر (CSV، PNG) بدون سرور
import { toCsv } from './csv.js';

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** rows: آرایه‌ای از آرایه؛ ردیف اول سرستون. BOM برای نمایش درست فارسی در اکسل */
export function downloadCsv(rows, filename) {
  const text = '\uFEFF' + toCsv(rows);
  downloadBlob(new Blob([text], { type: 'text/csv;charset=utf-8' }), filename);
}
