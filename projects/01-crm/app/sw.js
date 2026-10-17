// service worker: پوسته‌ی برنامه را برای کار آفلاین کش می‌کند (stale-while-revalidate برای فایل‌های همین سایت)
const VERSION = 'crm-v4-2026-10-17';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest',
  'css/app.css', 'css/print.css', 'assets/icon.svg',
  'assets/fonts/ShoorRounded-Regular.ttf', 'assets/fonts/ShoorRounded-Medium.ttf',
  'assets/fonts/ShoorRounded-SemiBold.ttf', 'assets/fonts/ShoorRounded-Bold.ttf',
  'js/main.js', 'js/ui/shell.js', 'js/ui/dialog.js', 'js/ui/form.js', 'js/ui/start.js',
  'js/core/db.js', 'js/core/dom.js', 'js/core/bus.js', 'js/core/format.js', 'js/core/jalali.js',
  'js/core/csv.js', 'js/core/download.js', 'js/core/invoiceCode.js', 'js/core/permissions.js',
  'js/core/rng.js', 'js/core/storage.js', 'js/core/validate.js',
  'js/config/businesses.js', 'js/domain/auth.js', 'js/domain/customers.js', 'js/domain/invoices.js',
  'js/domain/notes.js', 'js/domain/reports.js', 'js/domain/seed.js',
  'js/features/activity.js', 'js/features/customerDetail.js', 'js/features/customerForm.js',
  'js/features/extraFields.js', 'js/features/importMerge.js', 'js/features/invoiceForm.js',
  'js/features/invoiceShare.js', 'js/features/noteForm.js', 'js/features/settings.js',
  'js/views/index.js', 'js/views/common.js', 'js/views/today.js', 'js/views/notices.js',
  'js/views/customers.js', 'js/views/invoices.js', 'js/views/notes.js', 'js/views/archive.js', 'js/views/reports.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  event.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(event.request, { ignoreSearch: true });
      const network = fetch(event.request).then((res) => {
        if (res && res.ok) cache.put(event.request, res.clone());
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
