// عدد تصادفی قابل تکرار (برای داده‌ی نمونه‌ی ثابت).

export function hashSeed(text) {
  let h = 2166136261;
  for (const ch of String(text)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32: برمی‌گرداند تابعی که عددهای بین ۰ و ۱ می‌دهد */
export function rngFrom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = (rng, list) => list[Math.floor(rng() * list.length)];
export const int = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
