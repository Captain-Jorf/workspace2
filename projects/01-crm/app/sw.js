// Service worker: پوسته‌ی برنامه را برای کار آفلاین کش می‌کند (شبکه‌ی اول، سپس کش).
const VERSION = 'crm-v7-2026-10-17';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css', 'css/print.css', 'assets/icon.svg',
  'assets/fonts/ShoorRounded-Regular.ttf', 'assets/fonts/ShoorRounded-Medium.ttf',
  'assets/fonts/ShoorRounded-SemiBold.ttf', 'assets/fonts/ShoorRounded-Bold.ttf',
  'js/main.js',
  'js/core/dom.js', 'js/core/i18n.js', 'js/core/format.js', 'js/core/jalali.js', 'js/core/rng.js', 'js/core/store.js', 'js/core/download.js',
  'js/config/businesses.js', 'js/config/colorways.js', 'js/config/roles.js',
  'js/domain/auth.js', 'js/domain/customers.js', 'js/domain/invoices.js', 'js/domain/notes.js',
  'js/data/seed.js',
  'js/ui/context.js', 'js/ui/dialog.js', 'js/ui/toast.js', 'js/ui/theme.js', 'js/ui/shell.js', 'js/ui/start.js', 'js/ui/palette.js',
  'js/features/forms.js', 'js/features/customerForm.js', 'js/features/customerDetail.js', 'js/features/invoiceForm.js',
  'js/features/invoiceShare.js', 'js/features/noteForm.js',
  'js/views/index.js', 'js/views/parts.js', 'js/views/today.js', 'js/views/notices.js', 'js/views/customers.js',
  'js/views/invoices.js', 'js/views/notes.js', 'js/views/archive.js', 'js/views/reports.js', 'js/views/settings.js'
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
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('index.html')))
  );
});
