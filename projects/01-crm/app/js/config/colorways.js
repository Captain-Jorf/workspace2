// ۲۰ تم روز و ۲۰ تم شب. هر تم شب از همان خانواده‌ی رنگی تم روز ساخته شده و رنگ دکمه‌ی متفاوتی دارد.
// در زمان اجرا، متن روی دکمه‌ها از روی کنتراست انتخاب می‌شود (ui/theme.js).

export const DEFAULT_COLORWAY = 'sky-blue';

export const COLORWAYS = [
  { id: 'mint-sage', name: 'نعنا و سیج', mode: 'light', accent: '#4f9d82', accentStrong: '#2f7a62', tint: '#d8f0e6', mid: '#eef8f3', soft: '#e3f4ec' },
  { id: 'lavender', name: 'یاسی', mode: 'light', accent: '#7d6bb8', accentStrong: '#5d4c9b', tint: '#e4dcf5', mid: '#f4f0fb', soft: '#ebe5f8' },
  { id: 'peach-cream', name: 'هلویی و کرم', mode: 'light', accent: '#c4775a', accentStrong: '#a35d43', tint: '#fbe3d6', mid: '#fdf5ef', soft: '#fbe9df' },
  { id: 'sky-blue', name: 'آبی آسمانی', mode: 'light', accent: '#2b7cb5', accentStrong: '#1d6294', tint: '#d9ebf7', mid: '#eef6fb', soft: '#e7f2fa' },
  { id: 'butter', name: 'زرد کره‌ای', mode: 'light', accent: '#b8912a', accentStrong: '#8f6e1c', tint: '#fbf1cf', mid: '#fdf9ea', soft: '#faf1d2' },
  { id: 'blush-rose', name: 'رز ملایم', mode: 'light', accent: '#c9677f', accentStrong: '#a64c63', tint: '#f9dfe5', mid: '#fdf3f5', soft: '#fbe6eb' },
  { id: 'sage-beige', name: 'سیج و بژ', mode: 'light', accent: '#7a8f5c', accentStrong: '#5b6d42', tint: '#e6e9d6', mid: '#f6f6ee', soft: '#eceee0' },
  { id: 'slate-night', name: 'اسلیت شب', mode: 'light', accent: '#4a6b8a', accentStrong: '#33506b', tint: '#dfe5ec', mid: '#f3f6f9', soft: '#e6ecf2' },
  { id: 'teal-aqua', name: 'فیروزه‌ای', mode: 'light', accent: '#2a9d9d', accentStrong: '#1d7a7a', tint: '#d3efef', mid: '#eefafa', soft: '#e0f5f5' },
  { id: 'coral-apricot', name: 'مرجانی و زردآلو', mode: 'light', accent: '#e0695c', accentStrong: '#bf4f44', tint: '#fcdcd5', mid: '#fef4f1', soft: '#fde5df' },
  { id: 'pear', name: 'گلابی سبز', mode: 'light', accent: '#8aa83a', accentStrong: '#6b8424', tint: '#e9f2cc', mid: '#f7fbea', soft: '#eff6d8' },
  { id: 'mist', name: 'آبی مه', mode: 'light', accent: '#5a7fa0', accentStrong: '#41627f', tint: '#dde7f0', mid: '#f2f6fa', soft: '#e6edf5' },
  { id: 'mocha', name: 'موکا', mode: 'light', accent: '#8a6a55', accentStrong: '#6b5041', tint: '#ecdfd6', mid: '#faf6f3', soft: '#f3e9e2' },
  { id: 'grape', name: 'انگوری', mode: 'light', accent: '#9a4f8f', accentStrong: '#7a3a71', tint: '#f0d8ec', mid: '#faf2f8', soft: '#f5e4f1' },
  { id: 'warm-grey', name: 'خاکستری گرم', mode: 'light', accent: '#7b6f66', accentStrong: '#5c524b', tint: '#e7e2de', mid: '#f7f5f3', soft: '#efebe8' },
  { id: 'night-blue', name: 'آسمان شب', mode: 'light', accent: '#3f5f9a', accentStrong: '#2c4576', tint: '#d9e0f2', mid: '#f2f4fb', soft: '#e6ebf7' },
  { id: 'mint-grey', name: 'نعنای خاکستری', mode: 'light', accent: '#5b8c85', accentStrong: '#416d67', tint: '#dcebe8', mid: '#f3f8f7', soft: '#e4efed' },
  { id: 'amber', name: 'کهربایی', mode: 'light', accent: '#c98b2e', accentStrong: '#a06d1f', tint: '#fbe6c6', mid: '#fdf7ec', soft: '#faebd2' },
  { id: 'ice', name: 'یخی', mode: 'light', accent: '#3c9fc4', accentStrong: '#2a7d9e', tint: '#d2eef8', mid: '#f0fafd', soft: '#def4fb' },
  { id: 'rose-pink', name: 'گل‌محمدی', mode: 'light', accent: '#d26b9a', accentStrong: '#b04d7c', tint: '#fadbe9', mid: '#fdf2f7', soft: '#fbe4ef' },
];

export const NIGHT_THEMES = [
  {
    id: "night-mint-sage",
    name: "شب نعنا و سیج",
    accent: "#7fd1b2",
    accentStrong: "#a6e6cc",
    bgTop: "#1e4336",
    bgMid: "#102820",
    card: "#1d352d",
    line: "#396052"
  },
  {
    id: "night-lavender",
    name: "شب یاسی",
    accent: "#b5a6ea",
    accentStrong: "#cfc4f5",
    bgTop: "#271e43",
    bgMid: "#161028",
    card: "#221d35",
    line: "#423960"
  },
  {
    id: "night-peach-cream",
    name: "شب هلویی و کرم",
    accent: "#f0a88c",
    accentStrong: "#f7c4ae",
    bgTop: "#43281e",
    bgMid: "#281710",
    card: "#35231d",
    line: "#604439"
  },
  {
    id: "night-sky-blue",
    name: "شب آبی آسمانی",
    accent: "#5eb3e6",
    accentStrong: "#8fd0f5",
    bgTop: "#1e3443",
    bgMid: "#101e28",
    card: "#1d2b35",
    line: "#395060"
  },
  {
    id: "night-butter",
    name: "شب زرد کره‌ای",
    accent: "#e8c765",
    accentStrong: "#f3da8c",
    bgTop: "#43391e",
    bgMid: "#282110",
    card: "#352e1d",
    line: "#605539"
  },
  {
    id: "night-blush-rose",
    name: "شب رز ملایم",
    accent: "#ef9aae",
    accentStrong: "#f7c0cc",
    bgTop: "#431e27",
    bgMid: "#281016",
    card: "#351d23",
    line: "#603943"
  },
  {
    id: "night-sage-beige",
    name: "شب سیج و بژ",
    accent: "#aabf85",
    accentStrong: "#c8d9a8",
    bgTop: "#34431e",
    bgMid: "#1e2810",
    card: "#2b351d",
    line: "#506039"
  },
  {
    id: "night-slate-night",
    name: "شب اسلیت شب",
    accent: "#9bb8d3",
    accentStrong: "#bcd3e8",
    bgTop: "#1e3143",
    bgMid: "#101c28",
    card: "#1d2935",
    line: "#394d60"
  },
  {
    id: "night-teal-aqua",
    name: "شب فیروزه‌ای",
    accent: "#6fd0d0",
    accentStrong: "#9ee3e3",
    bgTop: "#1e4343",
    bgMid: "#102828",
    card: "#1d3535",
    line: "#396060"
  },
  {
    id: "night-coral-apricot",
    name: "شب مرجانی و زردآلو",
    accent: "#f59a8c",
    accentStrong: "#f9bcb2",
    bgTop: "#43221e",
    bgMid: "#281310",
    card: "#351f1d",
    line: "#603d39"
  },
  {
    id: "night-pear",
    name: "شب گلابی سبز",
    accent: "#bcd46e",
    accentStrong: "#d4e494",
    bgTop: "#39431e",
    bgMid: "#212810",
    card: "#2e351d",
    line: "#556039"
  },
  {
    id: "night-mist",
    name: "شب آبی مه",
    accent: "#9ebcd6",
    accentStrong: "#bdd3e8",
    bgTop: "#1e3243",
    bgMid: "#101d28",
    card: "#1d2935",
    line: "#394e60"
  },
  {
    id: "night-mocha",
    name: "شب موکا",
    accent: "#cfa98f",
    accentStrong: "#e3c6b2",
    bgTop: "#432d1e",
    bgMid: "#281a10",
    card: "#35261d",
    line: "#604939"
  },
  {
    id: "night-grape",
    name: "شب انگوری",
    accent: "#d68fca",
    accentStrong: "#e8b4de",
    bgTop: "#431e3d",
    bgMid: "#281024",
    card: "#351d31",
    line: "#60395a"
  },
  {
    id: "night-warm-grey",
    name: "شب خاکستری گرم",
    accent: "#b9aca2",
    accentStrong: "#d3c9c0",
    bgTop: "#432e1e",
    bgMid: "#281a10",
    card: "#35271d",
    line: "#604a39"
  },
  {
    id: "night-night-blue",
    name: "شب آسمان شب",
    accent: "#8fa8e0",
    accentStrong: "#b3c4ee",
    bgTop: "#1e2b43",
    bgMid: "#101928",
    card: "#1d2535",
    line: "#394760"
  },
  {
    id: "night-mint-grey",
    name: "شب نعنای خاکستری",
    accent: "#93c4bd",
    accentStrong: "#b5dcd5",
    bgTop: "#1e433e",
    bgMid: "#102824",
    card: "#1d3532",
    line: "#39605a"
  },
  {
    id: "night-amber",
    name: "شب کهربایی",
    accent: "#f0bd6a",
    accentStrong: "#f7d797",
    bgTop: "#43341e",
    bgMid: "#281e10",
    card: "#352b1d",
    line: "#605039"
  },
  {
    id: "night-ice",
    name: "شب یخی",
    accent: "#7fd0ec",
    accentStrong: "#a9e2f5",
    bgTop: "#1e3943",
    bgMid: "#102128",
    card: "#1d2e35",
    line: "#395560"
  },
  {
    id: "night-rose-pink",
    name: "شب گل‌محمدی",
    accent: "#f19dc2",
    accentStrong: "#f7c1d9",
    bgTop: "#431e2f",
    bgMid: "#28101b",
    card: "#351d28",
    line: "#60394b"
  }
];

export const ALL_THEMES = [...COLORWAYS, ...NIGHT_THEMES];

export function colorwayById(id) {
  return ALL_THEMES.find((c) => c.id === id) || COLORWAYS.find((c) => c.id === DEFAULT_COLORWAY);
}
