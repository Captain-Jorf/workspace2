// یادداشت‌ها: عنوان (حداکثر ۲۰ کلمه) و متن کامل. هر یادداشت می‌تواند به یک مشتری وصل باشد.
import * as store from '../core/store.js';
import { bucket, bizKey } from './customers.js';

export const TITLE_MAX_WORDS = 20;

export const wordCount = (text) => String(text || '').trim().split(/\s+/).filter(Boolean).length;

/** عنوان نمایشی: عنوان ذخیره‌شده، یا برای یادداشت‌های قدیمی، ۲۰ کلمه‌ی اول متن */
export function titleOf(note) {
  if (note.title) return note.title;
  return String(note.text || '').trim().split(/\s+/).slice(0, TITLE_MAX_WORDS).join(' ');
}

export function list(key = bizKey()) {
  return bucket(key).notes.slice().sort((a, b) => b.updatedAt - a.updatedAt);
}

function validate({ title, text }) {
  const errors = {};
  const t = String(title || '').trim();
  if (!t) errors.title = 'عنوان یادداشت را وارد کن';
  else if (wordCount(t) > TITLE_MAX_WORDS) errors.title = `عنوان حداکثر ${TITLE_MAX_WORDS} کلمه باشد (الان ${wordCount(t)})`;
  if (!String(text || '').trim()) errors.text = 'متن یادداشت خالی است';
  return errors;
}

export function createNote({ title, text, customerId = null }, key = bizKey(), now = Date.now()) {
  const errors = validate({ title, text });
  if (Object.keys(errors).length) return { errors };
  const note = {
    id: store.nextSeq('note', key), title: String(title).trim(), text: String(text).trim(),
    customerId, createdAt: now, updatedAt: now
  };
  bucket(key).notes.push(note);
  store.commit();
  return { note };
}

export function updateNote(id, { title, text, customerId = null }, key = bizKey(), now = Date.now()) {
  const note = bucket(key).notes.find((n) => n.id === id);
  if (!note) return { error: 'یادداشت پیدا نشد' };
  const errors = validate({ title, text });
  if (Object.keys(errors).length) return { errors };
  Object.assign(note, { title: String(title).trim(), text: String(text).trim(), customerId, updatedAt: now });
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
