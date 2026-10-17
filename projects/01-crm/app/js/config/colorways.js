// بیست رنگ‌بندی ملایم (پاستیلی). هر کدام: رنگ اصلی و تیره‌ی دکمه‌ها (روز)، نسخه‌ی شب، و گرادیان پس‌زمینه.
// متن روی دکمه‌ها در زمان اجرا از روی کنتراست انتخاب می‌شود (ui/theme.js).

export const DEFAULT_COLORWAY = 'sky-blue';

export const COLORWAYS = [
  { id: 'mint-sage', name: 'نعنا و سیج', accent: '#4f9d82', accentStrong: '#2f7a62', tint: '#d8f0e6', mid: '#eef8f3', soft: '#e3f4ec', dark: { accent: '#7fd1b2', accentStrong: '#a6e6cc' } },
  { id: 'lavender', name: 'یاسی', accent: '#7d6bb8', accentStrong: '#5d4c9b', tint: '#e4dcf5', mid: '#f4f0fb', soft: '#ebe5f8', dark: { accent: '#b5a6ea', accentStrong: '#cfc4f5' } },
  { id: 'peach-cream', name: 'هلویی و کرم', accent: '#c4775a', accentStrong: '#a35d43', tint: '#fbe3d6', mid: '#fdf5ef', soft: '#fbe9df', dark: { accent: '#f0a88c', accentStrong: '#f7c4ae' } },
  { id: 'sky-blue', name: 'آبی آسمانی', accent: '#2b7cb5', accentStrong: '#1d6294', tint: '#d9ebf7', mid: '#eef6fb', soft: '#e7f2fa', dark: { accent: '#5eb3e6', accentStrong: '#8fd0f5' } },
  { id: 'butter', name: 'زرد کره‌ای', accent: '#b8912a', accentStrong: '#8f6e1c', tint: '#fbf1cf', mid: '#fdf9ea', soft: '#faf1d2', dark: { accent: '#e8c765', accentStrong: '#f3da8c' } },
  { id: 'blush-rose', name: 'رز ملایم', accent: '#c9677f', accentStrong: '#a64c63', tint: '#f9dfe5', mid: '#fdf3f5', soft: '#fbe6eb', dark: { accent: '#ef9aae', accentStrong: '#f7c0cc' } },
  { id: 'sage-beige', name: 'سیج و بژ', accent: '#7a8f5c', accentStrong: '#5b6d42', tint: '#e6e9d6', mid: '#f6f6ee', soft: '#eceee0', dark: { accent: '#aabf85', accentStrong: '#c8d9a8' } },
  { id: 'slate-night', name: 'اسلیت شب', accent: '#4a6b8a', accentStrong: '#33506b', tint: '#dfe5ec', mid: '#f3f6f9', soft: '#e6ecf2', dark: { accent: '#9bb8d3', accentStrong: '#bcd3e8' } },
  { id: 'teal-aqua', name: 'فیروزه‌ای', accent: '#2a9d9d', accentStrong: '#1d7a7a', tint: '#d3efef', mid: '#eefafa', soft: '#e0f5f5', dark: { accent: '#6fd0d0', accentStrong: '#9ee3e3' } },
  { id: 'coral-apricot', name: 'مرجانی و زردآلو', accent: '#e0695c', accentStrong: '#bf4f44', tint: '#fcdcd5', mid: '#fef4f1', soft: '#fde5df', dark: { accent: '#f59a8c', accentStrong: '#f9bcb2' } },
  { id: 'pear', name: 'گلابی سبز', accent: '#8aa83a', accentStrong: '#6b8424', tint: '#e9f2cc', mid: '#f7fbea', soft: '#eff6d8', dark: { accent: '#bcd46e', accentStrong: '#d4e494' } },
  { id: 'mist', name: 'آبی مه', accent: '#5a7fa0', accentStrong: '#41627f', tint: '#dde7f0', mid: '#f2f6fa', soft: '#e6edf5', dark: { accent: '#9ebcd6', accentStrong: '#bdd3e8' } },
  { id: 'mocha', name: 'موکا', accent: '#8a6a55', accentStrong: '#6b5041', tint: '#ecdfd6', mid: '#faf6f3', soft: '#f3e9e2', dark: { accent: '#cfa98f', accentStrong: '#e3c6b2' } },
  { id: 'grape', name: 'انگوری', accent: '#9a4f8f', accentStrong: '#7a3a71', tint: '#f0d8ec', mid: '#faf2f8', soft: '#f5e4f1', dark: { accent: '#d68fca', accentStrong: '#e8b4de' } },
  { id: 'warm-grey', name: 'خاکستری گرم', accent: '#7b6f66', accentStrong: '#5c524b', tint: '#e7e2de', mid: '#f7f5f3', soft: '#efebe8', dark: { accent: '#b9aca2', accentStrong: '#d3c9c0' } },
  { id: 'night-blue', name: 'آسمان شب', accent: '#3f5f9a', accentStrong: '#2c4576', tint: '#d9e0f2', mid: '#f2f4fb', soft: '#e6ebf7', dark: { accent: '#8fa8e0', accentStrong: '#b3c4ee' } },
  { id: 'mint-grey', name: 'نعنای خاکستری', accent: '#5b8c85', accentStrong: '#416d67', tint: '#dcebe8', mid: '#f3f8f7', soft: '#e4efed', dark: { accent: '#93c4bd', accentStrong: '#b5dcd5' } },
  { id: 'amber', name: 'کهربایی', accent: '#c98b2e', accentStrong: '#a06d1f', tint: '#fbe6c6', mid: '#fdf7ec', soft: '#faebd2', dark: { accent: '#f0bd6a', accentStrong: '#f7d797' } },
  { id: 'ice', name: 'یخی', accent: '#3c9fc4', accentStrong: '#2a7d9e', tint: '#d2eef8', mid: '#f0fafd', soft: '#def4fb', dark: { accent: '#7fd0ec', accentStrong: '#a9e2f5' } },
  { id: 'rose-pink', name: 'گل‌محمدی', accent: '#d26b9a', accentStrong: '#b04d7c', tint: '#fadbe9', mid: '#fdf2f7', soft: '#fbe4ef', dark: { accent: '#f19dc2', accentStrong: '#f7c1d9' } }
];

export function colorwayById(id) {
  return COLORWAYS.find((c) => c.id === id) || COLORWAYS.find((c) => c.id === DEFAULT_COLORWAY);
}
