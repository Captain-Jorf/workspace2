// گذرگاه رویداد ساده: ماژول‌ها به‌جای فراخوانی مستقیم یکدیگر، از اینجا خبر می‌دهند.
const listeners = new Map();

export const bus = {
  on(event, fn) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(fn);
    return () => listeners.get(event).delete(fn);
  },
  emit(event, payload) {
    (listeners.get(event) || []).forEach((fn) => fn(payload));
  }
};
