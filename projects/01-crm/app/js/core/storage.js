// دسترسی ایمن به localStorage: اگر مرورگر اجازه نداد، برنامه با حافظه‌ی موقت ادامه می‌دهد و خطا نمی‌دهد
const KEY = 'crm-v3';
let memory = null;
let available = true;

export function readRaw() {
  try {
    return localStorage.getItem(KEY);
  } catch (e) {
    available = false;
    return memory;
  }
}

/** true برمی‌گرداند اگر در localStorage ذخیره شد */
export function writeRaw(text) {
  memory = text;
  try {
    localStorage.setItem(KEY, text);
    available = true;
    return true;
  } catch (e) {
    available = false;
    return false;
  }
}

export const storageAvailable = () => available;
export const STORAGE_KEY = KEY;
