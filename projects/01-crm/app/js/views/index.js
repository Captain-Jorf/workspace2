// ثبت صفحه‌ها به ترتیب منوی کناری
import * as today from './today.js';
import * as notices from './notices.js';
import * as customers from './customers.js';
import * as invoices from './invoices.js';
import * as notes from './notes.js';
import * as archive from './archive.js';
import * as reports from './reports.js';

export const VIEWS = { today, notices, customers, invoices, notes, archive, reports };
export const NAV = ['today', 'notices', 'customers', 'invoices', 'notes', 'archive', 'reports'];
