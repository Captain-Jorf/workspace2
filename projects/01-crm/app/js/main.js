// نقطه‌ی ورود: بارگذاری داده، اعمال حالت نمایش، میانبرها، و ثبت Service Worker.
import * as store from './core/store.js';
import { $ } from './core/dom.js';
import { can } from './config/roles.js';
import { ctx } from './ui/context.js';
import { applyTheme } from './ui/theme.js';
import { closeDialog, isDialogOpen } from './ui/dialog.js';
import { openPalette } from './ui/palette.js';
import { renderAll, runAction, handleEscape } from './ui/shell.js';
import { resumeOrStart } from './ui/start.js';

store.load();
applyTheme();

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && key === 'k') {
    e.preventDefault();
    if (!isDialogOpen() && store.get().activeBiz) openPalette();
    return;
  }
  if (e.key === 'Escape') {
    if (isDialogOpen()) closeDialog();
    else handleEscape();
    return;
  }
  const t = e.target;
  const typing = /INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable;
  if (typing || isDialogOpen() || e.ctrlKey || e.metaKey || e.altKey || !store.get().activeBiz) return;
  if (e.key === '/') {
    e.preventDefault();
    $('#q').focus();
  } else if (key === 'n' && can(store.get().session?.role, 'customer.write') && ctx.view !== 'invoices') {
    e.preventDefault();
    runAction('notice');
  }
});

window.addEventListener('online', renderAll);
window.addEventListener('offline', renderAll);

resumeOrStart();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
