// یادداشت‌ها: صفحه‌ی مستقل (نه داخل فرم مشتری). هر یادداشت می‌تواند به یک مشتری وصل باشد.
import * as store from '../core/store.js';
import { bucket, bizKey } from './customers.js';

export function list(key = bizKey()) {
  return bucket(key).notes.slice().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function createNote({ text, customerId = null }, key = bizKey(), now = Date.now()) {
  const body = String(text || '').trim();
  if (!body) return { errors: { text: 'متن یادداشت خالی است' } };
  const note = { id: store.nextSeq('note', key), text: body, customerId, createdAt: now, updatedAt: now };
  bucket(key).notes.push(note);
  store.commit();
  return { note };
}

export function updateNote(id, { text, customerId = null }, key = bizKey(), now = Date.now()) {
  const note = bucket(key).notes.find((n) => n.id === id);
  if (!note) return { error: 'یادداشت پیدا نشد' };
  const body = String(text || '').trim();
  if (!body) return { errors: { text: 'متن یادداشت خالی است' } };
  Object.assign(note, { text: body, customerId, updatedAt: now });
  store.commit();
  return { note };
}

export function removeNote(id, key = bizKey()) {
  const b = bucket(key);
  const index = b.notes.findIndex((n) => n.id === id);
  if (index < 0) return { error: 'یادداشت پیدا نشد' };
  const [note] = b.notes.splice(index, 1);
  store.commit();
  return { snapshot: { note, index } };
}

export function restoreNote(snapshot, key = bizKey()) {
  const b = bucket(key);
  if (!b.notes.some((n) => n.id === snapshot.note.id)) {
    b.notes.splice(Math.min(snapshot.index, b.notes.length), 0, snapshot.note);
    store.commit();
  }
  return { note: snapshot.note };
}
