// یادداشت‌های خصوصی مدیر/فروشنده: صفحه‌ی جدا در منوی کناری. در فرم یا جزئیات مشتری نمایش داده نمی‌شوند.
import * as db from '../core/db.js';

export function list({ query = '' } = {}, key = db.activeBizKey()) {
  const q = query.trim().toLowerCase();
  return db.bucket(key).notes
    .filter((n) => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function create({ title, body = '', customerId = null }, key = db.activeBizKey()) {
  if (!title || title.trim().length < 2) return { error: 'عنوان را حداقل ۲ حرف وارد کن.' };
  const now = Date.now();
  const note = {
    id: db.nextId('nextNote', key),
    title: title.trim(),
    body: String(body || '').trim(),
    customerId: customerId || null,
    createdAt: now,
    updatedAt: now
  };
  db.bucket(key).notes.push(note);
  db.touch();
  return { note };
}

export function update(id, { title, body = '', customerId = null }, key = db.activeBizKey()) {
  const note = db.bucket(key).notes.find((n) => n.id === id);
  if (!note) return { error: 'یادداشت پیدا نشد.' };
  if (!title || title.trim().length < 2) return { error: 'عنوان را حداقل ۲ حرف وارد کن.' };
  Object.assign(note, { title: title.trim(), body: String(body || '').trim(), customerId: customerId || null, updatedAt: Date.now() });
  db.touch();
  return { note };
}

export function remove(id, key = db.activeBizKey()) {
  const b = db.bucket(key);
  const idx = b.notes.findIndex((n) => n.id === id);
  if (idx < 0) return null;
  const [note] = b.notes.splice(idx, 1);
  db.touch();
  return { note, index: idx };
}

export function restore(snapshot, key = db.activeBizKey()) {
  if (!snapshot) return;
  const b = db.bucket(key);
  b.notes.splice(Math.min(snapshot.index, b.notes.length), 0, snapshot.note);
  db.touch();
}
