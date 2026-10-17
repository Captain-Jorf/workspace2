// فهرست نماها به ترتیب منوی راست (نه صفحه، با نمودارها).
import * as today from './today.js';
import * as notices from './notices.js';
import * as customers from './customers.js';
import * as invoices from './invoices.js';
import * as notes from './notes.js';
import * as archive from './archive.js';
import * as reports from './reports.js';
import * as charts from './charts.js';
import * as settings from './settings.js';

export const VIEWS = { today, notices, customers, invoices, notes, archive, reports, charts, settings };
export const VIEW_ORDER = ['today', 'notices', 'customers', 'invoices', 'notes', 'archive', 'reports', 'charts', 'settings'];
