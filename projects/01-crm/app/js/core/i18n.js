// زبان رابط کاربری: فارسی (پیش‌فرض) و پنج زبان پرکاربرد دنیا. کلیدهای نبود‌ترجمه به فارسی برمی‌گردند.
import * as store from './store.js';

export const LANGS = [
  { id: 'fa', label: 'فارسی', dir: 'rtl' },
  { id: 'en', label: 'English', dir: 'ltr' },
  { id: 'zh', label: '中文', dir: 'ltr' },
  { id: 'hi', label: 'हिन्दी', dir: 'ltr' },
  { id: 'es', label: 'Español', dir: 'ltr' },
  { id: 'ar', label: 'العربية', dir: 'rtl' }
];

const D = {
  'nav.today': ['امروز', 'Today', '今天', 'आज', 'Hoy', 'اليوم'],
  'nav.notices': ['اطلاعیه‌ها', 'Notices', '线索看板', 'सूचनाएँ', 'Avisos', 'الإشعارات'],
  'nav.customers': ['مشتری‌ها', 'Customers', '客户', 'ग्राहक', 'Clientes', 'العملاء'],
  'nav.invoices': ['فاکتورها', 'Invoices', '发票', 'चालान', 'Facturas', 'الفواتير'],
  'nav.notes': ['یادداشت‌ها', 'Notes', '备注', 'नोट्स', 'Notas', 'الملاحظات'],
  'nav.archive': ['بایگانی', 'Archive', '归档', 'संग्रह', 'Archivo', 'الأرشيف'],
  'nav.reports': ['گزارش‌ها', 'Reports', '报表', 'रिपोर्ट', 'Informes', 'التقارير'],
  'nav.settings': ['تنظیمات', 'Settings', '设置', 'सेटिंग्स', 'Ajustes', 'الإعدادات'],
  'btn.palette': ['دستورها', 'Commands', '命令', 'कमांड', 'Comandos', 'الأوامر'],
  'btn.newNotice': ['اطلاعیه‌ی جدید', 'New notice', '新线索', 'नई सूचना', 'Nuevo aviso', 'إشعار جديد'],
  'btn.newCustomer': ['مشتری جدید', 'New customer', '新客户', 'नया ग्राहक', 'Nuevo cliente', 'عميل جديد'],
  'btn.newInvoice': ['فاکتور جدید', 'New invoice', '新发票', 'नया चालान', 'Nueva factura', 'فاتورة جديدة'],
  'btn.newNote': ['یادداشت جدید', 'New note', '新备注', 'नया नोट', 'Nueva nota', 'ملاحظة جديدة'],
  'btn.csv': ['خروجی CSV', 'Export CSV', '导出 CSV', 'CSV निर्यात', 'Exportar CSV', 'تصدير CSV'],
  'btn.switchBiz': ['تغییر کسب‌وکار', 'Switch business', '切换业务', 'व्यवसाय बदलें', 'Cambiar negocio', 'تغيير النشاط'],
  'btn.logout': ['خروج', 'Log out', '退出', 'लॉग आउट', 'Salir', 'تسجيل الخروج'],
  'btn.search': ['جستجو', 'Search', '搜索', 'खोजें', 'Buscar', 'بحث'],
  'btn.print': ['چاپ', 'Print', '打印', 'प्रिंट', 'Imprimir', 'طباعة'],
  'filter.all': ['همه', 'All', '全部', 'सभी', 'Todos', 'الكل'],
  'filter.today': ['امروز', 'Today', '今天', 'आज', 'Hoy', 'اليوم'],
  'filter.overdue': ['عقب‌افتاده', 'Overdue', '逾期', 'अतिदेय', 'Vencidos', 'متأخرة'],
  'filter.open': ['باز', 'Open', '进行中', 'खुला', 'Abiertos', 'مفتوح'],
  'filter.done': ['انجام‌شده‌ها', 'Done', '已完成', 'पूरे हुए', 'Hechos', 'المنجزة'],
  'set.title': ['تنظیمات', 'Settings', '设置', 'सेटिंग्स', 'Ajustes', 'الإعدادات'],
  'set.sub': ['ظاهر، زبان، کسب‌وکار و حساب کاربری', 'Appearance, language, business and account', '外观、语言、业务与账户', 'दिखावट, भाषा, व्यवसाय और खाता', 'Apariencia, idioma, negocio y cuenta', 'المظهر واللغة والنشاط والحساب'],
  'set.appearance': ['ظاهر', 'Appearance', '外观', 'दिखावट', 'Apariencia', 'المظهر'],
  'set.day': ['تم‌های روز', 'Day themes', '日间主题', 'दिन की थीम', 'Temas de día', 'سمات النهار'],
  'set.night': ['تم‌های شب', 'Night themes', '夜间主题', 'रात की थीम', 'Temas de noche', 'سمات الليل'],
  'set.themeHint': ['ظاهر و چیدمان ثابت است؛ فقط پالت عوض می‌شود.', 'Layout stays the same; only the palette changes.', '布局不变，仅更换配色。', 'लेआउट वही रहता है; केवल रंग बदलते हैं।', 'El diseño no cambia; solo la paleta.', 'يبقى التخطيط ثابتاً، وتتغير الألوان فقط.'],
  'set.fontSize': ['اندازه‌ی فونت', 'Font size', '字体大小', 'फ़ॉन्ट आकार', 'Tamaño de letra', 'حجم الخط'],
  'set.small': ['کوچک', 'Small', '小', 'छोटा', 'Pequeña', 'صغير'],
  'set.medium': ['متوسط', 'Medium', '中', 'मध्यम', 'Mediana', 'متوسط'],
  'set.large': ['بزرگ', 'Large', '大', 'बड़ा', 'Grande', 'كبير'],
  'set.language': ['زبان', 'Language', '语言', 'भाषा', 'Idioma', 'اللغة'],
  'set.langHint': ['زبان رابط کاربری.', 'Interface language.', '界面语言。', 'इंटरफ़ेस की भाषा।', 'Idioma de la interfaz.', 'لغة الواجهة.'],
  'set.business': ['کسب‌وکار فعال', 'Active business', '当前业务', 'सक्रिय व्यवसाय', 'Negocio activo', 'النشاط الحالي'],
  'set.businessHint': ['داده‌ی هر کسب‌وکار جدا ذخیره می‌شود.', "Each business's data is stored separately.", '每个业务的数据分开保存。', 'हर व्यवसाय का डेटा अलग सहेजा जाता है।', 'Los datos de cada negocio se guardan por separado.', 'تُحفظ بيانات كل نشاط بشكل منفصل.'],
  'set.account': ['حساب و داده', 'Account & data', '账户与数据', 'खाता और डेटा', 'Cuenta y datos', 'الحساب والبيانات'],
  'set.logoutHint': ['خروج از حساب، داده‌ها را پاک نمی‌کند.', 'Logging out does not delete data.', '退出不会删除数据。', 'लॉग आउट करने से डेटा नहीं हटता।', 'Cerrar sesión no borra los datos.', 'تسجيل الخروج لا يحذف البيانات.'],
  'set.export': ['خروجی پشتیبان (JSON)', 'Export backup (JSON)', '导出备份 (JSON)', 'बैकअप निर्यात (JSON)', 'Exportar copia (JSON)', 'تصدير نسخة احتياطية (JSON)'],
  'set.exportHint': ['همه‌ی داده‌ها را در یک فایل ذخیره می‌کند.', 'Saves all data to one file.', '将所有数据保存到一个文件。', 'सारा डेटा एक फ़ाइल में सहेजता है।', 'Guarda todos los datos en un archivo.', 'يحفظ كل البيانات في ملف واحد.'],
  'set.exported': ['فایل پشتیبان ساخته شد', 'Backup file created', '备份文件已创建', 'बैकअप फ़ाइल बनी', 'Archivo de copia creado', 'تم إنشاء ملف النسخة الاحتياطية'],
  'set.reset': ['بازنشانی داده‌ی نمونه', 'Reset sample data', '重置示例数据', 'नमूना डेटा रीसेट करें', 'Restablecer datos de ejemplo', 'إعادة ضبط بيانات العينة'],
  'set.resetHint': ['فقط مدیر. داده‌ی این کسب‌وکار دوباره ساخته می‌شود.', "Managers only. This business's data is regenerated.", '仅限经理。将重新生成此业务的数据。', 'केवल प्रबंधक। इस व्यवसाय का डेटा फिर से बनेगा।', 'Solo gerente. Se regenera el dato de este negocio.', 'للمدير فقط. تُعاد إنشاء بيانات هذا النشاط.'],
  'set.support': ['پشتیبانی و سازنده', 'Support & developer', '支持与开发者', 'सहायता और डेवलपर', 'Soporte y desarrollador', 'الدعم والمطوّر'],
  'set.supportContact': ['تماس با پشتیبانی', 'Contact support', '联系支持', 'सहायता से संपर्क करें', 'Contactar soporte', 'التواصل مع الدعم'],
  'set.developer': ['سازنده‌ی برنامه', 'App developer', '应用开发者', 'ऐप डेवलपर', 'Desarrollador de la app', 'مطوّر التطبيق'],
  'set.phone': ['شماره‌ی تماس', 'Phone', '电话', 'फ़ोन', 'Teléfono', 'الهاتف'],
  'set.about': ['درباره‌ی داده و برنامه', 'About the app & data', '关于应用与数据', 'ऐप और डेटा के बारे में', 'Acerca de la app y los datos', 'حول التطبيق والبيانات'],
  'set.version': ['نسخه', 'Version', '版本', 'संस्करण', 'Versión', 'الإصدار'],
  'set.storageLocation': ['محل ذخیره‌سازی', 'Storage location', '存储位置', 'भंडारण स्थान', 'Ubicación de almacenamiento', 'موقع التخزين'],
  'set.storageValue': ['این مرورگر روی این دستگاه (localStorage، کلید crm-simple-v6)', 'This browser on this device (localStorage, key crm-simple-v6)', '本设备上的此浏览器（localStorage，键 crm-simple-v6）', 'इस डिवाइस पर यह ब्राउज़र (localStorage, कुंजी crm-simple-v6)', 'Este navegador en este dispositivo (localStorage, clave crm-simple-v6)', 'هذا المتصفح على هذا الجهاز (localStorage، المفتاح crm-simple-v6)'],
  'set.storageUsed': ['حجم داده‌ها', 'Data size', '数据大小', 'डेटा का आकार', 'Tamaño de datos', 'حجم البيانات'],
  'set.storageOk': ['ذخیره‌سازی فعال است', 'Storage is active', '存储已启用', 'भंडारण सक्रिय है', 'El almacenamiento está activo', 'التخزين مفعّل'],
  'set.storageOff': ['ذخیره‌سازی مرورگر در دسترس نیست؛ داده‌ها تا بستن صفحه می‌مانند.', 'Browser storage unavailable; data lasts until the page closes.', '浏览器存储不可用；数据仅保留到页面关闭。', 'ब्राउज़र भंडारण उपलब्ध नहीं; डेटा पेज बंद होने तक रहेगा।', 'El almacenamiento no está disponible; los datos duran hasta cerrar la página.', 'تخزين المتصفح غير متاح؛ تبقى البيانات حتى إغلاق الصفحة.'],
  'set.offline': ['کار بدون اینترنت', 'Works offline', '离线可用', 'ऑफ़लाइन काम करता है', 'Funciona sin conexión', 'يعمل دون اتصال'],
  'set.signedIn': ['ورود به عنوان', 'Signed in as', '登录为', 'के रूप में साइन इन', 'Sesión iniciada como', 'مسجّل الدخول باسم'],
  'set.saved': ['ذخیره شد ✓', 'Saved ✓', '已保存 ✓', 'सहेजा गया ✓', 'Guardado ✓', 'تم الحفظ ✓'],
  'set.keys': ['میانبرها', 'Shortcuts', '快捷键', 'शॉर्टकट', 'Atajos', 'اختصارات'],
  'set.keysList': ['Ctrl+K دستورها · / جستجو · N اطلاعیه‌ی جدید · Esc بستن · Ctrl+Enter ذخیره · ↑↓ جابه‌جایی کارت · ←→ تغییر مرحله', 'Ctrl+K commands · / search · N new notice · Esc close · Ctrl+Enter save · ↑↓ move card · ←→ change stage', 'Ctrl+K 命令 · / 搜索 · N 新线索 · Esc 关闭 · Ctrl+Enter 保存 · ↑↓ 移动卡片 · ←→ 更改阶段', 'Ctrl+K कमांड · / खोजें · N नई सूचना · Esc बंद करें · Ctrl+Enter सहेजें · ↑↓ कार्ड हिलाएँ · ←→ चरण बदलें', 'Ctrl+K comandos · / buscar · N nuevo aviso · Esc cerrar · Ctrl+Enter guardar · ↑↓ mover tarjeta · ←→ cambiar etapa', 'Ctrl+K الأوامر · / بحث · N إشعار جديد · Esc إغلاق · Ctrl+Enter حفظ · ↑↓ نقل البطاقة · ←→ تغيير المرحلة']
};

const IDX = { fa: 0, en: 1, zh: 2, hi: 3, es: 4, ar: 5 };

export const lang = () => store.get()?.lang || 'fa';

/** متن ترجمه‌شده؛ اگر نبود، فارسی */
export function t(key) {
  const row = D[key];
  if (!row) return key;
  return row[IDX[lang()]] || row[0];
}

export function dirOf(id = lang()) {
  return LANGS.find((l) => l.id === id)?.dir || 'rtl';
}
