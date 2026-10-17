// نقطه‌ی ورود برنامه: بارگذاری داده‌ی محلی، راه‌اندازی پوسته و ثبت service worker برای کار آفلاین.
import * as db from './core/db.js';
import { init } from './ui/shell.js';

db.load();
init();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* بدون service worker هم برنامه کار می‌کند */ });
}
