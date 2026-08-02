// ══════════════════════════════════════════════
// VALO Check — Smart Value Inspector
// Pure Frontend + Firebase · Serverless
// ══════════════════════════════════════════════

/* ── CONFIG & STATE ── */
const CONFIG = {
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    defaultLimit: 50,
    gemini: {
        keys: [],
        models: ['gemini-2.5-flash', 'gemini-1.5-flash'],
    },
    openrouter: { model: 'google/gemini-2.0-flash-001', url: 'https://openrouter.ai/api/v1/chat/completions' },
};

const STATE = {
    lang: 'ar', theme: 'dark', mode: 'buy', category: 'phone',
    country: 'EG', region: '', city: '',
    image: null, imageDataUrl: '', images: [], compressedImages: [],
    isAnalyzing: false, lastResult: null,
    dailyScans: parseInt(localStorage.getItem('valo_scans') || '0'),
    lastScanDate: localStorage.getItem('valo_scan_date') || '',
    features: { autoCountry: true, ads: true, camera: true, sellMode: true, multiLang: true, pdfReport: true },
};

/* ── FIREBASE INIT ── */
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDvaasGECJAlGdg2-KNnasJfzok1Fs7iro",
    authDomain: "valo-check.firebaseapp.com",
    projectId: "valo-check",
    storageBucket: "valo-check.firebasestorage.app",
    messagingSenderId: "595305842951",
    appId: "1:595305842951:web:6acce617e0080f521c9da2",
    measurementId: "G-7CWFC538KV"
};

if (typeof firebase !== 'undefined' && firebase.initializeApp) {
    firebase.initializeApp(FIREBASE_CONFIG);
}
const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;

/* ── DYNAMIC CONFIG FROM ADMIN ── */
window.APP_CONFIG = {
    features: { auto_country: true, ads: true, camera: true, sell_mode: false, multi_lang: false, pdf_report: true },
    limits: { daily_limit: 50, max_file_size_mb: 10, limit_message: '' },
    api_keys: [], ads: [], adsense: '',
    ad_settings: { delay: 5000, mobile: true, ad_triggers_enabled: true },
    categories: {}, store: { enabled: false, products: [] }
};

if (db) {
    ['features','limits','api_keys','ads','adsense','ad_settings','categories','store'].forEach(id => {
        db.collection('config').doc(id).onSnapshot(snap => {
            if (snap.exists) window.APP_CONFIG[id] = snap.data();
            if (id === 'limits' && snap.exists) CONFIG.defaultLimit = snap.data().daily_limit || 50;
            if (id === 'api_keys' && snap.exists) CONFIG.gemini.keys = snap.data().keys || [];
        });
    });
}

/* ── SESSION AD TRIGGER ── */
function triggerSessionAd(action) {
    if (!window.APP_CONFIG.ad_settings?.ad_triggers_enabled) return;
    if (!STATE.features.ads) return;
    const k = `ad_fired_${action}`;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, '1');
    const ads = (window.APP_CONFIG.ads || []).filter(a => a.active && a.type === action);
    if (!ads.length) return;
    const ad = ads[Math.floor(Math.random() * ads.length)];
    const link = getSafeUrl(ad.link);
    if (link) window.open(link, '_blank', 'noopener,noreferrer');
}

function getSafeUrl(url) {
    if (!url) return null;
    try { const u = new URL(url); if (u.protocol === 'https:' || u.protocol === 'http:') return u.href; } catch {}
    return url.startsWith('http') ? url : 'https://' + url;
}

/* ── TRANSLATIONS ── */
const LANG_CODES = ['ar', 'en', 'fr', 'de', 'zh', 'es'];
const LANG_DIR = { ar: 'rtl', en: 'ltr', fr: 'ltr', de: 'ltr', zh: 'ltr', es: 'ltr' };

function trackEvent(name, params) {
    try { if (typeof gtag === 'function') gtag('event', name, params || {}); } catch {}
}

const I18N = {
    ar: {
        heroTitle: 'فاحص القيمة الذكي',
        heroSubtitle: 'ارفع صورة السلعة المستعملة وسنحللها بالخبير الاصطناعي لنخبرك إذا كانت صفقة جيدة أم لا',
        statAccuracy: 'دقة التحليل', statScans: 'فحص تم', statSaved: 'جنيه وفر',
        modeBuy: '🛒 أنا أشتري', modeSell: '💰 أنا أبيع',
        selectCategory: 'اختر نوع المنتج',
        dropTitle: 'Drop your Asset Image here to Scan',
        dropDesc: 'اسحب الصورة هنا أو اضغط لاختيار من جهازك',
        btnChoose: '📁 اختيار صورة', btnCamera: '📷 فتح الكاميرا',
        enterPrice: 'أدخل السعر المعروض (اختياري)', enterNotes: 'ملاحظات إضافية (اختياري)',
        btnAnalyze: '🔬 ابدأ الفحص بالخبير',
        quickGuidePhotos: 'ماذا تصوّر؟', quickGuidePhotosDesc: 'صوّر الواجهة، الخلفية، الزوايا، المنافذ، وأي ملصق موديل.',
        quickGuideInspect: 'ماذا تفحص؟', quickGuideInspectDesc: 'الخدوش، الكسور، تآكل البطارية، علامات الماء.',
        quickGuideResult: 'ماذا ستحصل؟', quickGuideResultDesc: 'تقرير كامل: السعر العادل، العيوب، تكلفة الإصلاح.',
        loadingAnalyze: 'جاري تحليل الصورة...', loadingCompare: 'مقارنة النتائج...', loadingFinal: 'تجهيز التقرير...',
        errAnalyze: 'فشل التحليل. حاول مرة أخرى.',
        aiEngine: '🔬 محرك الخبير الذكي — تحليل فوري بالذكاء الاصطناعي',
        buyerAssistant: '🤖 المساعد الذكي للشراء',
        suggestBtn: '💡 اقتراح منتجات',
        analysisResult: '🔍 نتيجة الفحص',
        exportPdf: '📄 تصدير PDF',
        noData: 'لا توجد بيانات فحص',
        dailyLimit: 'لقد استنفدت الحد اليومي للفحوصات',
    },
    en: {
        heroTitle: 'Smart Value Inspector',
        heroSubtitle: 'Upload a used product photo and our AI will tell you if it\'s a good deal',
        statAccuracy: 'Accuracy', statScans: 'Scans Done', statSaved: 'Saved',
        modeBuy: '🛒 I\'m Buying', modeSell: '💰 I\'m Selling',
        selectCategory: 'Select Product Type',
        dropTitle: 'Drop your Asset Image here to Scan', dropDesc: 'Drag & drop or click to select',
        btnChoose: '📁 Choose Image', btnCamera: '📷 Open Camera',
        enterPrice: 'Listed price (optional)', enterNotes: 'Additional notes (optional)',
        btnAnalyze: '🔬 Start AI Analysis',
        quickGuidePhotos: 'What to photograph?', quickGuidePhotosDesc: 'Front, back, corners, ports, model label.',
        quickGuideInspect: 'What to inspect?', quickGuideInspectDesc: 'Scratches, cracks, battery wear, water signs.',
        quickGuideResult: 'What you get?', quickGuideResultDesc: 'Full report: fair price, defects, repair cost.',
        loadingAnalyze: 'Analyzing image...', loadingCompare: 'Comparing results...', loadingFinal: 'Preparing report...',
        errAnalyze: 'Analysis failed. Try again.',
        aiEngine: '🔬 AI Expert Engine — Instant AI Analysis',
        buyerAssistant: '🤖 Smart Buyer Assistant',
        suggestBtn: '💡 Suggest Products',
        analysisResult: '🔍 Analysis Result',
        exportPdf: '📄 Export PDF',
        noData: 'No scan data available',
        dailyLimit: 'Daily scan limit reached',
    },
    fr: {
        heroTitle: 'Inspecteur Intelligent de Valeur',
        heroSubtitle: 'Téléchargez une photo d\'un produit d\'occasion et notre IA vous dira si c\'est une bonne affaire',
        statAccuracy: 'Précision', statScans: 'Analyses faites', statSaved: 'Économisé',
        modeBuy: '🛒 J\'achète', modeSell: '💰 Je vends',
        selectCategory: 'Choisir le type de produit',
        dropTitle: 'Drop your Asset Image here to Scan', dropDesc: 'Glissez-déposez ou cliquez pour sélectionner',
        btnChoose: '📁 Choisir une image', btnCamera: '📷 Ouvrir la caméra',
        enterPrice: 'Prix affiché (optionnel)', enterNotes: 'Notes supplémentaires (optionnel)',
        btnAnalyze: '🔬 Lancer l\'analyse IA',
        quickGuidePhotos: 'Que photographier ?', quickGuidePhotosDesc: 'Avant, arrière, coins, ports, étiquette du modèle.',
        quickGuideInspect: 'Quoi inspecter ?', quickGuideInspectDesc: 'Rayures, fissures, usure de la batterie, traces d\'eau.',
        quickGuideResult: 'Ce que vous obtenez ?', quickGuideResultDesc: 'Rapport complet : juste prix, défauts, coût de réparation.',
        loadingAnalyze: 'Analyse de l\'image...', loadingCompare: 'Comparaison des résultats...', loadingFinal: 'Préparation du rapport...',
        errAnalyze: 'L\'analyse a échoué. Réessayez.',
        aiEngine: '🔬 Moteur Expert IA — Analyse instantanée',
        buyerAssistant: '🤖 Assistant d\'achat intelligent',
        suggestBtn: '💡 Suggérer des produits',
        analysisResult: '🔍 Résultat de l\'analyse',
        exportPdf: '📄 Exporter en PDF',
        noData: 'Aucune donnée d\'analyse disponible',
        dailyLimit: 'Limite quotidienne d\'analyses atteinte',
    },
    de: {
        heroTitle: 'Intelligenter Wertprüfer',
        heroSubtitle: 'Laden Sie ein Foto eines Gebrauchtprodukts hoch und unsere KI verrät Ihnen, ob es ein gutes Geschäft ist',
        statAccuracy: 'Genauigkeit', statScans: 'Scans durchgeführt', statSaved: 'Gespart',
        modeBuy: '🛒 Ich kaufe', modeSell: '💰 Ich verkaufe',
        selectCategory: 'Produkttyp wählen',
        dropTitle: 'Drop your Asset Image here to Scan', dropDesc: 'Ziehen & Loslassen oder klicken zum Auswählen',
        btnChoose: '📁 Bild wählen', btnCamera: '📷 Kamera öffnen',
        enterPrice: 'Angebotener Preis (optional)', enterNotes: 'Zusätzliche Hinweise (optional)',
        btnAnalyze: '🔬 KI-Analyse starten',
        quickGuidePhotos: 'Was fotografieren?', quickGuidePhotosDesc: 'Vorderseite, Rückseite, Ecken, Anschlüsse, Modellaufkleber.',
        quickGuideInspect: 'Was prüfen?', quickGuideInspectDesc: 'Kratzer, Risse, Batterieverschleiß, Wasserschäden.',
        quickGuideResult: 'Was erhalten Sie?', quickGuideResultDesc: 'Voller Bericht: fairer Preis, Mängel, Reparaturkosten.',
        loadingAnalyze: 'Bild wird analysiert...', loadingCompare: 'Ergebnisse werden verglichen...', loadingFinal: 'Bericht wird erstellt...',
        errAnalyze: 'Analyse fehlgeschlagen. Versuchen Sie es erneut.',
        aiEngine: '🔬 KI-Experten-Engine — Sofortige Analyse',
        buyerAssistant: '🤖 Intelligenter Kaufassistent',
        suggestBtn: '💡 Produkte vorschlagen',
        analysisResult: '🔍 Analyseergebnis',
        exportPdf: '📄 Als PDF exportieren',
        noData: 'Keine Scandaten verfügbar',
        dailyLimit: 'Tägliches Scan-Limit erreicht',
    },
    zh: {
        heroTitle: '智能价值检测器',
        heroSubtitle: '上传二手产品照片，我们的人工智能将告诉您这是否划算',
        statAccuracy: '准确率', statScans: '已完成扫描', statSaved: '已节省',
        modeBuy: '🛒 我要购买', modeSell: '💰 我要出售',
        selectCategory: '选择产品类型',
        dropTitle: 'Drop your Asset Image here to Scan', dropDesc: '拖拽或点击选择图片',
        btnChoose: '📁 选择图片', btnCamera: '📷 打开相机',
        enterPrice: '标价（可选）', enterNotes: '附加说明（可选）',
        btnAnalyze: '🔬 开始AI分析',
        quickGuidePhotos: '拍摄什么？', quickGuidePhotosDesc: '正面、背面、边角、接口、型号标签。',
        quickGuideInspect: '检查什么？', quickGuideInspectDesc: '划痕、裂缝、电池磨损、进水痕迹。',
        quickGuideResult: '您将获得什么？', quickGuideResultDesc: '完整报告：公平价格、缺陷、维修费用。',
        loadingAnalyze: '正在分析图片...', loadingCompare: '正在比较结果...', loadingFinal: '正在生成报告...',
        errAnalyze: '分析失败，请重试。',
        aiEngine: '🔬 AI专家引擎 — 即时分析',
        buyerAssistant: '🤖 智能购买助手',
        suggestBtn: '💡 推荐产品',
        analysisResult: '🔍 分析结果',
        exportPdf: '📄 导出PDF',
        noData: '没有可用的扫描数据',
        dailyLimit: '已达到每日扫描上限',
    },
    es: {
        heroTitle: 'Inspector Inteligente de Valor',
        heroSubtitle: 'Sube una foto de un producto usado y nuestra IA te dirá si es una buena oferta',
        statAccuracy: 'Precisión', statScans: 'Escaneos realizados', statSaved: 'Ahorrado',
        modeBuy: '🛒 Voy a comprar', modeSell: '💰 Voy a vender',
        selectCategory: 'Selecciona el tipo de producto',
        dropTitle: 'Drop your Asset Image here to Scan', dropDesc: 'Arrastra y suelta o haz clic para seleccionar',
        btnChoose: '📁 Elegir imagen', btnCamera: '📷 Abrir cámara',
        enterPrice: 'Precio mostrado (opcional)', enterNotes: 'Notas adicionales (opcional)',
        btnAnalyze: '🔬 Iniciar análisis IA',
        quickGuidePhotos: '¿Qué fotografiar?', quickGuidePhotosDesc: 'Frente, trasera, esquinas, puertos, etiqueta del modelo.',
        quickGuideInspect: '¿Qué inspeccionar?', quickGuideInspectDesc: 'Rayones, grietas, desgaste de batería, marcas de agua.',
        quickGuideResult: '¿Qué obtienes?', quickGuideResultDesc: 'Informe completo: precio justo, defectos, costo de reparación.',
        loadingAnalyze: 'Analizando imagen...', loadingCompare: 'Comparando resultados...', loadingFinal: 'Preparando informe...',
        errAnalyze: 'El análisis falló. Inténtalo de nuevo.',
        aiEngine: '🔬 Motor Experto IA — Análisis instantáneo',
        buyerAssistant: '🤖 Asistente de compra inteligente',
        suggestBtn: '💡 Sugerir productos',
        analysisResult: '🔍 Resultado del análisis',
        exportPdf: '📄 Exportar PDF',
        noData: 'No hay datos de escaneo disponibles',
        dailyLimit: 'Límite diario de escaneos alcanzado',
    }
};
function getText(key) { const t = I18N[STATE.lang]; return t?.[key] || key; }

/* ── CATEGORIES ── */
const CATEGORIES = {
    phone: { nameAr: 'موبايل', nameEn: 'Phone', icon: '📱' },
    laptop: { nameAr: 'لابتوب', nameEn: 'Laptop', icon: '💻' },
    car: { nameAr: 'سيارة', nameEn: 'Car', icon: '🚗' },
    scooter: { nameAr: 'سكوتر كهربائي', nameEn: 'Scooter', icon: '🛴' },
    fridge: { nameAr: 'تلاجة', nameEn: 'Fridge', icon: '❄️' },
    ac: { nameAr: 'مكيف', nameEn: 'AC', icon: '❄️' },
    washer: { nameAr: 'غسالة', nameEn: 'Washer', icon: '🧺' },
    pc: { nameAr: 'كمبيوتر', nameEn: 'PC', icon: '🖥️' },
    headphones: { nameAr: 'سماعات', nameEn: 'Headphones', icon: '🎧' },
    monitor: { nameAr: 'شاشة', nameEn: 'Monitor', icon: '🖥️' },
};

/* ── COUNTRIES ── */
const COUNTRIES = {
    EG: { name: 'مصر', nameEn: 'Egypt', currency: 'EGP', symbol: 'ج.م', locale: 'ar-EG' },
    US: { name: 'الولايات المتحدة', nameEn: 'United States', currency: 'USD', symbol: '$', locale: 'en-US' },
    AU: { name: 'أستراليا', nameEn: 'Australia', currency: 'AUD', symbol: 'A$', locale: 'en-AU' },
    SA: { name: 'السعودية', nameEn: 'Saudi Arabia', currency: 'SAR', symbol: '﷼', locale: 'ar-SA' },
    AE: { name: 'الإمارات', nameEn: 'UAE', currency: 'AED', symbol: 'د.إ', locale: 'ar-AE' },
    GB: { name: 'بريطانيا', nameEn: 'United Kingdom', currency: 'GBP', symbol: '£', locale: 'en-GB' },
    DE: { name: 'ألمانيا', nameEn: 'Germany', currency: 'EUR', symbol: '€', locale: 'de-DE' },
    FR: { name: 'فرنسا', nameEn: 'France', currency: 'EUR', symbol: '€', locale: 'fr-FR' },
    CN: { name: 'الصين', nameEn: 'China', currency: 'CNY', symbol: '¥', locale: 'zh-CN' },
    ES: { name: 'إسبانيا', nameEn: 'Spain', currency: 'EUR', symbol: '€', locale: 'es-ES' },
};

/* ── UI HELPERS ── */
function $(id) { return document.getElementById(id); }
function esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

function showToast(type, msg) {
    const c = $('toastContainer');
    const t = document.createElement('div');
    t.className = 'toast toast-' + type;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3500);
}

function getSpecs(category) {
    const map = {
        phone: [{ key: 'ram', labelAr: 'الرام', labelEn: 'RAM', placeholderAr: 'مثال: 6GB', placeholderEn: 'e.g. 6GB' },
                { key: 'storage', labelAr: 'المساحة', labelEn: 'Storage', placeholderAr: 'مثال: 128GB', placeholderEn: 'e.g. 128GB' },
                { key: 'battery', labelAr: 'البطارية', labelEn: 'Battery', placeholderAr: 'مثال: 85%', placeholderEn: 'e.g. 85%' }],
        laptop: [{ key: 'cpu', labelAr: 'المعالج', labelEn: 'CPU', placeholderAr: 'مثال: i7 12th Gen', placeholderEn: 'e.g. i7 12th Gen' },
                 { key: 'ram', labelAr: 'الرام', labelEn: 'RAM', placeholderAr: 'مثال: 16GB', placeholderEn: 'e.g. 16GB' },
                 { key: 'storage', labelAr: 'المساحة', labelEn: 'Storage', placeholderAr: 'مثال: 512GB SSD', placeholderEn: 'e.g. 512GB SSD' }],
        car: [{ key: 'year', labelAr: 'الموديل', labelEn: 'Year', placeholderAr: 'مثال: 2020', placeholderEn: 'e.g. 2020' },
              { key: 'mileage', labelAr: 'الكيلومترات', labelEn: 'Mileage', placeholderAr: 'مثال: 50000 كم', placeholderEn: 'e.g. 50000 km' }],
    };
    return map[category] || [];
}

/* ── FILE HANDLING ── */
function handleFiles(event) {
    const files = event.target.files;
    if (!files?.length) return;
    triggerSessionAd('upload');
    STATE.images = [];
    STATE.imageDataUrl = '';
    STATE.compressedImages = [];
    for (const f of files) {
        if (!CONFIG.allowedTypes.includes(f.type)) { showToast('error', 'صيغة غير مدعومة: ' + f.type); continue; }
        if (f.size > CONFIG.maxFileSize) { showToast('error', 'حجم الملف كبير جداً (حد أقصى 10MB)'); continue; }
        const reader = new FileReader();
        reader.onload = e => {
            STATE.images.push({ file: f, dataUrl: e.target.result });
            if (STATE.images.length === 1) STATE.imageDataUrl = e.target.result;
            renderPreviews();
            compressNextImage();
            checkReady();
        };
        reader.readAsDataURL(f);
    }
}

async function compressAndPrepareImage(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            const maxDim = 1600;
            let w = img.naturalWidth, h = img.naturalHeight;
            if (w > maxDim || h > maxDim) {
                const r = Math.min(maxDim / w, maxDim / h);
                w = Math.round(w * r); h = Math.round(h * r);
            }
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            resolve(c.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

let compressQueue = [];
function compressNextImage() {
    const next = STATE.images.find(i => !i.compressed);
    if (!next) return;
    compressAndPrepareImage(next.dataUrl).then(url => {
        next.compressed = url;
        STATE.compressedImages.push(url);
        compressNextImage();
    });
}

function renderPreviews() {
    const grid = $('previewGrid'), zone = $('dropZone'), area = $('previewArea');
    grid.innerHTML = '';
    STATE.images.forEach(i => {
        const img = document.createElement('img');
        img.src = i.dataUrl; img.alt = 'Preview';
        grid.appendChild(img);
    });
    zone.classList.add('has-image');
    area.style.display = 'block';
    $('dropContent').style.display = 'none';
}

function checkReady() {
    $('analyzeBtn').disabled = !STATE.images.length;
}

/* ── MODE / CATEGORY UI ── */
function populateCategoryPicker() {
    const sel = $('categoryPicker');
    sel.innerHTML = '';
    Object.entries(CATEGORIES).forEach(([k, v]) => {
        const o = document.createElement('option');
        o.value = k;
        o.textContent = v.icon + ' ' + (STATE.lang === 'ar' ? v.nameAr : v.nameEn);
        if (k === STATE.category) o.selected = true;
        sel.appendChild(o);
    });
}

function renderSpecs() {
    const container = $('specsContainer');
    container.innerHTML = '';
    const specs = getSpecs(STATE.category);
    specs.forEach(s => {
        const input = document.createElement('input');
        input.className = 'form-input';
        input.placeholder = STATE.lang === 'ar' ? s.placeholderAr : s.placeholderEn;
        input.dataset.key = s.key;
        input.id = 'spec_' + s.key;
        container.appendChild(input);
    });
}

function collectSpecs() {
    const specs = {};
    document.querySelectorAll('#specsContainer .form-input').forEach(inp => {
        if (inp.value.trim()) specs[inp.dataset.key] = inp.value.trim();
    });
    return specs;
}

/* ── THEME & LANG ── */
function toggleTheme() {
    STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('light-mode', STATE.theme === 'light');
    localStorage.setItem('vc_theme', STATE.theme);
    $('themeToggle').textContent = STATE.theme === 'dark' ? '🌙' : '☀️';
}

function toggleLang() {
    const idx = LANG_CODES.indexOf(STATE.lang);
    STATE.lang = LANG_CODES[(idx + 1) % LANG_CODES.length];
    localStorage.setItem('vc_lang', STATE.lang);
    document.documentElement.dir = LANG_DIR[STATE.lang] || 'ltr';
    document.documentElement.lang = STATE.lang;
    applyI18n();
    populateCategoryPicker();
    renderSpecs();
    trackEvent('language_switch', { lang: STATE.lang });
}

function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const text = getText(key);
        if (text && text !== key) el.textContent = text;
    });
}

/* ── DETECT COUNTRY ── */
async function detectCountry() {
    try {
        const r = await fetch('https://ipwho.is/');
        const d = await r.json();
        if (d.success) {
            STATE.country = d.country_code || 'EG';
            STATE.region = d.region || '';
            STATE.city = d.city || '';
        }
    } catch {}
}

/* ── GEMINI API — 3-TIER FALLBACK ── */
async function callGeminiAPI(imageData, category, categoryName, extras) {
    if (!navigator.onLine) throw new Error(extras.lang === 'ar' ? 'لا يوجد اتصال بالإنترنت.' : 'No internet connection.');

    const keys = CONFIG.gemini.keys.filter(k => k.active !== false).map(k => k.key);
    if (!keys.length) throw new Error(extras.lang === 'ar' ? 'لا توجد مفاتيح API نشطة.' : 'No active API keys.');

    const prompt = buildPrompt(category, categoryName, extras);
    const parts = [{ text: prompt }, { inline_data: { mime_type: imageData.mimeType, data: imageData.base64 } }];
    let lastError;

    // Tier 1 & 2: Gemini models (model → keys loop)
    for (const model of CONFIG.gemini.models) {
        for (const key of keys) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
                const ctrl = new AbortController();
                const t = setTimeout(() => ctrl.abort(), 60000);
                const r = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.7, maxOutputTokens: 8192 } }),
                    signal: ctrl.signal
                });
                clearTimeout(t);
                if (!r.ok) {
                    if (r.status === 429 || r.status === 403) continue;
                    const e = await r.json().catch(() => ({}));
                    throw new Error(e.error?.message || `API error: ${r.status}`);
                }
                const data = await r.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error('No response text');
                return text;
            } catch (e) {
                lastError = e;
                if (e.name === 'AbortError') lastError = new Error('Request timed out.');
                continue;
            }
        }
    }

    // Tier 3: OpenRouter fallback
    try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 60000);
        const r = await fetch(CONFIG.openrouter.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + keys[0],
                'HTTP-Referer': location.origin,
                'X-Title': 'VALO Check'
            },
            body: JSON.stringify({
                model: CONFIG.openrouter.model,
                messages: [{ role: 'user', content: prompt + '\n\n[Image: base64 image data attached]' }],
                max_tokens: 8192,
                temperature: 0.7
            }),
            signal: ctrl.signal
        });
        clearTimeout(t);
        if (r.ok) {
            const data = await r.json();
            const text = data.choices?.[0]?.message?.content;
            if (text) return text;
        }
        const errText = await r.text().catch(() => '');
        lastError = new Error('OpenRouter: ' + (errText.substring(0, 200) || r.status));
    } catch (e) {
        lastError = e;
    }

    throw lastError || new Error('AI_SERVICE_UNAVAILABLE');
}

/* ── BUILD PROMPT (Market Intelligence) ── */
function buildPrompt(category, categoryName, extras) {
    const c = COUNTRIES[extras.country] || COUNTRIES.EG;
    const base = `You are a professional used-item appraiser with LOCAL MARKET expertise for ${c.nameEn}. Analyze the attached product image and return a SINGLE valid JSON object (no markdown, no code fences). Use REAL local market prices for ${c.nameEn} in ${c.currency} (currency code: ${c.currency}). Research the current second-hand market value in ${c.nameEn}.

Structure:
{
  "overall_condition_score": 0-100,
  "condition_label": "Excellent|Good|Fair|Poor",
  "fair_price": <market price in ${c.currency}>,
  "market_min_price": <lowest in ${c.currency}>,
  "market_max_price": <highest in ${c.currency}>,
  "total_estimated_repair_cost": <in ${c.currency}>,
  "total_recommended_deduction": <deduction in ${c.currency}>,
  "fair_price_after_deductions": <final fair price in ${c.currency}>,
  "device_title": "<detected model>",
  "summary": "<Arabic 2-3 sentence summary>",
  "defects_analysis": [{ "defect_name": "<Arabic>", "severity": "high|medium|low", "details": "<Arabic>", "estimated_repair_cost": <number in ${c.currency}>, "recommended_price_deduction": <number in ${c.currency}> }],
  "pros": ["<Arabic pro>"],
  "cons": ["<Arabic con>"],
  "checked_visually": ["<Arabic item>"],
  "unchecked_requires_manual": ["<Arabic item>"],
  "recommendation": "<Arabic final advice>",
  "red_flags": ["<Arabic flag>"]
}

RULES:
- ALL text fields MUST be in Arabic.
- Prices MUST be in ${c.currency} based on REAL current used market in ${c.nameEn}.
- Return ONLY the JSON. No explanation, no markdown.`;
    const hints = {
        phone: 'Screen, body, battery, camera, ports, water damage, buttons.',
        laptop: 'Screen, keyboard, trackpad, ports, hinges, battery, chassis, CPU/GPU stickers.',
        car: 'Body panels, paint, tires, interior, odometer, engine bay, lights, rust.',
        scooter: 'Body, tires, battery, motor, display, lights, brakes, charging port.',
        fridge: 'Exterior, interior, door seal, compressor, frost, energy label.',
        ac: 'Unit condition, filters, refrigerant lines, outdoor unit, noise.',
        washer: 'Drum, door seal, controls, hoses, vibration, noise.',
        pc: 'Case, monitor, ports, PSU, cable management, component condition.',
        headphones: 'Ear pads, headband, mesh, cable, ports, buttons, microphone.',
        monitor: 'Screen, stand, ports, bezel, back panel, buttons, dead pixels.',
    };
    const specHint = extras.specs ? '\nUser specs: ' + JSON.stringify(extras.specs) : '';
    const notesHint = extras.notes ? '\nUser notes: ' + extras.notes : '';
    const priceHint = extras.price > 0 ? '\nListed price: ' + extras.price + ' ' + c.currency + ' (evaluate value)' : '';
    return `${base}\n\nCategory: ${categoryName}\nInspection focus: ${hints[category] || 'Overall condition, wear, defects'}${specHint}${notesHint}${priceHint}\n\nIMPORTANT: Research REAL used market prices in ${c.nameEn} for this item. Do NOT guess — use ${c.currency} values that reflect actual second-hand listings.`;
}

/* ── PARSE RESPONSE ── */
function sanitizeResponse(text) {
    if (!text) return '';
    return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/m, '').replace(/\*\*/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

function parseGeminiResponse(text) {
    const cleaned = sanitizeResponse(text);
    try {
        const json = JSON.parse(cleaned);
        return {
            overall_condition_score: Number(json.overall_condition_score) || 0,
            condition_label: json.condition_label || 'Fair',
            fair_price: Number(json.fair_price) || 0,
            market_min_price: Number(json.market_min_price) || 0,
            market_max_price: Number(json.market_max_price) || 0,
            total_estimated_repair_cost: Number(json.total_estimated_repair_cost) || 0,
            total_recommended_deduction: Number(json.total_recommended_deduction) || 0,
            fair_price_after_deductions: Number(json.fair_price_after_deductions) || 0,
            device_title: json.device_title || '',
            summary: json.summary || '',
            defects_analysis: Array.isArray(json.defects_analysis) ? json.defects_analysis : [],
            pros: Array.isArray(json.pros) ? json.pros : [],
            cons: Array.isArray(json.cons) ? json.cons : [],
            checked_visually: Array.isArray(json.checked_visually) ? json.checked_visually : [],
            unchecked_requires_manual: Array.isArray(json.unchecked_requires_manual) ? json.unchecked_requires_manual : [],
            recommendation: json.recommendation || '',
            red_flags: Array.isArray(json.red_flags) ? json.red_flags : [],
        };
    } catch {
        return { error: true, message: 'AI_SERVICE_UNAVAILABLE', _rawText: cleaned };
    }
}

/* ── ANALYSIS FLOW ── */
async function startAnalysis() {
    if (STATE.isAnalyzing) return;
    STATE.isAnalyzing = true;
    const btn = $('analyzeBtn'), overlay = $('loadingOverlay');
    btn.disabled = true;
    overlay.style.display = 'flex';

    try {
        // Check daily limit
        const today = new Date().toDateString();
        if (STATE.lastScanDate !== today) {
            STATE.dailyScans = 0;
            STATE.lastScanDate = today;
        }
        if (STATE.dailyScans >= CONFIG.defaultLimit) {
            throw new Error(getText('dailyLimit'));
        }

        trackEvent('scan_start', { category: STATE.category, mode: STATE.mode, country: STATE.country });

        // Compress and analyze
        triggerSessionAd('scan');
        const images = STATE.compressedImages.length ? STATE.compressedImages : [STATE.imageDataUrl];
        const dataUrl = images[0] || STATE.imageDataUrl;
        const mimeType = dataUrl.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
        const base64 = (dataUrl.split(',')[1] || '').trim();
        if (!base64) throw new Error('No image data');

        const catName = CATEGORIES[STATE.category]?.nameEn || STATE.category;
        const notes = $('notesInput')?.value.trim() || '';
        const price = parseFloat($('priceInput')?.value) || 0;
        const specs = collectSpecs();

        for (let i = 1; i < 4; i++) {
            $('loadingText').textContent = [getText('loadingAnalyze'), getText('loadingCompare'), getText('loadingFinal')][i - 1];
            $('loadingBar').style.width = `${15 + i * 28}%`;
            await new Promise(r => setTimeout(r, 500));
        }

        const text = await callGeminiAPI({ base64, mimeType }, STATE.category, catName, { notes, price, specs, country: STATE.country, lang: STATE.lang });
        const parsed = parseGeminiResponse(text);
        parsed.currency = (COUNTRIES[STATE.country] || {}).currency || 'EGP';

        displayResults(parsed);
        STATE.dailyScans++;
        localStorage.setItem('valo_scans', String(STATE.dailyScans));
        localStorage.setItem('valo_scan_date', STATE.lastScanDate);
        logVisitor();
        trackEvent('scan_complete', { category: STATE.category, mode: STATE.mode, country: STATE.country });
    } catch (e) {
        showToast('error', e.message || getText('errAnalyze'));
    } finally {
        overlay.style.display = 'none';
        STATE.isAnalyzing = false;
        btn.disabled = false;
    }
}

/* ── DISPLAY RESULTS ── */
function displayResults(data) {
    const section = $('resultsSection');
    if (!data || data.error) {
        showToast('error', data?.message || 'AI_SERVICE_UNAVAILABLE');
        return;
    }
    STATE.lastResult = data;
    section.style.display = 'block';

    const isAr = STATE.lang === 'ar';
    const c = COUNTRIES[STATE.country] || COUNTRIES.EG;
    const currency = data.currency || c.currency;
    const score = Math.min(100, Math.max(0, Number(data.overall_condition_score)));
    const fairPrice = Number(data.fair_price);
    const minPrice = Number(data.market_min_price);
    const maxPrice = Number(data.market_max_price);
    const totalRepair = Number(data.total_estimated_repair_cost);
    const totalDeduction = Number(data.total_recommended_deduction);
    const fairAfter = Number(data.fair_price_after_deductions);
    const priceInp = parseFloat($('priceInput')?.value) || 0;
    const diff = priceInp > 0 ? priceInp - fairPrice : 0;

    const status = score >= 75 ? { label: isAr ? 'ممتاز' : 'Excellent', color: '#00c853' }
        : score >= 50 ? { label: isAr ? 'جيد' : 'Good', color: '#ecc94b' }
        : { label: isAr ? 'ضعيف' : 'Poor', color: '#e53e3e' };

    const defects = data.defects_analysis || [];
    const pros = data.pros || [];
    const cons = data.cons || [];
    const checked = data.checked_visually || [];
    const manual = data.unchecked_requires_manual || [];
    const flags = data.red_flags || [];

    const fmt = (n) => (n || 0).toLocaleString(c.locale || 'en-US');

    let html = `
    <div class="result-score" style="text-align:center;padding:20px;background:rgba(0,200,83,0.05);border-radius:16px;margin-bottom:20px">
        <div style="font-size:14px;color:#718096;margin-bottom:4px">${isAr ? 'درجة الجودة' : 'Condition Score'}</div>
        <div style="font-size:48px;font-weight:800;color:${status.color}">${score}%</div>
        <div style="font-size:16px;color:${status.color};margin-top:4px">${status.label}</div>
        ${data.device_title ? '<div style="font-size:14px;color:#e2e8f0;margin-top:12px">🏷️ ' + esc(data.device_title) + '</div>' : ''}
    </div>
    <div class="result-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px">
        ${fairPrice > 0 ? `<div style="background:rgba(0,200,83,0.06);border:1px solid rgba(0,200,83,0.1);padding:14px;border-radius:12px"><div style="font-size:11px;color:#718096">${isAr ? 'السعر العادل' : 'Fair Price'}</div><div style="font-size:22px;font-weight:700;color:#00c853">${fmt(fairPrice)} ${currency}</div></div>` : ''}
        ${priceInp > 0 ? `<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);padding:14px;border-radius:12px"><div style="font-size:11px;color:#718096">${isAr ? 'السعر المعروض' : 'Listed Price'}</div><div style="font-size:22px;font-weight:700;color:#e2e8f0">${fmt(priceInp)} ${currency}</div></div>` : ''}
        ${diff !== 0 ? `<div style="background:rgba(${diff > 0 ? '0,200,83' : '229,62,62'},0.06);border:1px solid rgba(${diff > 0 ? '0,200,83' : '229,62,62'},0.15);padding:14px;border-radius:12px"><div style="font-size:11px;color:#718096">${isAr ? (diff > 0 ? 'توفير' : 'خسارة') : (diff > 0 ? 'Savings' : 'Loss')}</div><div style="font-size:22px;font-weight:700;color:${diff > 0 ? '#00c853' : '#e53e3e'}">${diff > 0 ? '+' : ''}${fmt(diff)} ${currency}</div></div>` : ''}
        ${minPrice > 0 || maxPrice > 0 ? `<div style="background:rgba(99,179,237,0.06);border:1px solid rgba(99,179,237,0.1);padding:14px;border-radius:12px"><div style="font-size:11px;color:#718096">${isAr ? 'نطاق السوق' : 'Market Range'}</div><div style="font-size:18px;font-weight:700;color:#63b3ed">${fmt(minPrice)} — ${fmt(maxPrice)} ${currency}</div></div>` : ''}
    </div>`;

    if (defects.length) {
        html += `<div style="margin-bottom:16px"><h3 style="font-size:15px;color:#e53e3e;margin-bottom:10px">⚠️ ${isAr ? 'العيوب' : 'Defects'}</h3>`;
        defects.forEach(d => {
            const sv = (d.severity || '').includes('high') ? '#e53e3e' : (d.severity || '').includes('medium') ? '#dd6b20' : '#38a169';
            html += `<div style="background:rgba(229,62,62,0.04);border:1px solid rgba(229,62,62,0.1);padding:12px;border-radius:10px;margin-bottom:8px">
                <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
                    <strong>${esc(d.defect_name || '')}</strong>
                    <span style="color:${sv};font-size:12px;font-weight:600">${esc(d.severity || '')}</span>
                </div>
                ${d.details ? '<div style="font-size:13px;color:#718096;margin-top:4px">' + esc(d.details) + '</div>' : ''}
                <div style="display:flex;gap:16px;margin-top:6px;font-size:12px;color:#a0aec0">
                    <span>🔧 ${isAr ? 'إصلاح' : 'Repair'}: <strong style="color:#e53e3e">${fmt(d.estimated_repair_cost)} ${currency}</strong></span>
                    <span>📉 ${isAr ? 'خصم' : 'Deduction'}: <strong style="color:#2b6cb0">${fmt(d.recommended_price_deduction)} ${currency}</strong></span>
                </div>
            </div>`;
        });
        if (totalRepair > 0) html += `<div style="display:flex;gap:12px;margin-top:8px"><div style="flex:1;background:rgba(229,62,62,0.08);padding:10px;border-radius:8px;text-align:center;font-size:12px;color:#e53e3e">${isAr ? 'إجمالي الإصلاح' : 'Total Repair'}: <strong>${fmt(totalRepair)} ${currency}</strong></div><div style="flex:1;background:rgba(43,108,176,0.08);padding:10px;border-radius:8px;text-align:center;font-size:12px;color:#2b6cb0">${isAr ? 'إجمالي الخصم' : 'Total Deduction'}: <strong>${fmt(totalDeduction)} ${currency}</strong></div></div>`;
        html += `</div>`;
    }

    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div style="background:rgba(0,200,83,0.04);border:1px solid rgba(0,200,83,0.08);padding:12px;border-radius:10px">
            <h4 style="font-size:13px;color:#00c853;margin-bottom:6px">✅ ${isAr ? 'نقاط القوة' : 'Pros'}</h4>
            ${pros.length ? pros.map(p => '<div style="font-size:13px;color:#a0aec0;margin-bottom:3px">👍 ' + esc(p) + '</div>').join('') : '<div style="font-size:12px;color:#4a5568">—</div>'}
        </div>
        <div style="background:rgba(229,62,62,0.04);border:1px solid rgba(229,62,62,0.08);padding:12px;border-radius:10px">
            <h4 style="font-size:13px;color:#e53e3e;margin-bottom:6px">👎 ${isAr ? 'نقاط الضعف' : 'Cons'}</h4>
            ${cons.length ? cons.map(p => '<div style="font-size:13px;color:#a0aec0;margin-bottom:3px">👎 ' + esc(p) + '</div>').join('') : '<div style="font-size:12px;color:#4a5568">—</div>'}
        </div>
    </div>`;

    if (checked.length) html += `<div style="margin-bottom:12px"><h4 style="font-size:13px;color:#38a169;margin-bottom:6px">✅ ${isAr ? 'تم فحصه' : 'Checked Visually'}</h4>${checked.map(p => '<span style="display:inline-block;background:rgba(0,200,83,0.06);border:1px solid rgba(0,200,83,0.1);padding:4px 10px;border-radius:6px;font-size:12px;margin:2px">' + esc(p) + '</span>').join('')}</div>`;
    if (manual.length) html += `<div style="background:rgba(221,107,32,0.06);border:1px solid rgba(221,107,32,0.12);padding:12px;border-radius:10px;margin-bottom:12px"><h4 style="font-size:13px;color:#dd6b20;margin-bottom:6px">🔍 ${isAr ? 'فحص يدوي مطلوب' : 'Manual Check Required'}</h4>${manual.map(p => '<div style="font-size:13px;color:#9c4221">• ' + esc(p) + '</div>').join('')}</div>`;
    if (flags.length) html += `<div style="background:rgba(229,62,62,0.06);border:1px solid rgba(229,62,62,0.15);padding:12px;border-radius:10px;margin-bottom:12px"><h4 style="font-size:13px;color:#e53e3e;margin-bottom:6px">🚩 ${isAr ? 'تحذيرات' : 'Red Flags'}</h4>${flags.map(p => '<div style="font-size:13px;color:#fc8181">🚩 ' + esc(p) + '</div>').join('')}</div>`;

    if (data.recommendation) html += `<div style="background:rgba(99,179,237,0.06);border:1px solid rgba(99,179,237,0.1);padding:14px;border-radius:10px;margin-bottom:12px"><h4 style="font-size:14px;color:#63b3ed;margin-bottom:4px">💡 ${isAr ? 'النصيحة' : 'Advice'}</h4><div style="font-size:14px;color:#e2e8f0">${esc(data.recommendation)}</div></div>`;
    if (data.summary) html += `<div style="font-size:13px;color:#718096;line-height:1.7;padding:12px;background:rgba(255,255,255,0.02);border-radius:8px">${esc(data.summary)}</div>`;

    $('resultsContent').innerHTML = html;
    $('exportPdfBtn').style.display = STATE.features.pdfReport ? 'inline-flex' : 'none';
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── PDF EXPORT ── */
function buildPdfReportHTML(data) {
    if (!data || data.error) return '';
    const isAr = STATE.lang === 'ar';
    const c = COUNTRIES[STATE.country] || COUNTRIES.EG;
    const currency = data.currency || c.currency;
    const score = Number(data.overall_condition_score);
    const fairPrice = Number(data.fair_price);
    const minPrice = Number(data.market_min_price);
    const maxPrice = Number(data.market_max_price);
    const totalRepair = Number(data.total_estimated_repair_cost);
    const totalDeduction = Number(data.total_recommended_deduction);
    const fairAfter = Number(data.fair_price_after_deductions);
    const priceInp = parseFloat($('priceInput')?.value) || 0;
    const diff = priceInp > 0 ? priceInp - fairPrice : 0;
    const fmt = (n) => (n || 0).toLocaleString(c.locale || 'en-US');
    const dateStr = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const defects = data.defects_analysis || [];
    const scoreColor = score >= 75 ? '#22543d' : score >= 50 ? '#c05621' : '#c53030';

    return `<div style="font-family:'Segoe UI',Arial,sans-serif;direction:${isAr ? 'rtl' : 'ltr'};padding:30px;max-width:800px;margin:0 auto;background:#ffffff!important;color:#000000!important">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #00c853;padding-bottom:12px;margin-bottom:24px">
            <div><h1 style="margin:0;color:#00c853;font-size:24px;font-weight:800">VALO Check</h1><p style="margin:4px 0 0;color:#718096;font-size:11px">${isAr ? 'تقرير تقييم منتج مستعمل' : 'Used Item Inspection Report'}</p></div>
            <div style="text-align:${isAr ? 'left' : 'right'}"><div style="background:#f7fafc;border:1px solid #e2e8f0;padding:6px 12px;border-radius:6px;font-size:11px;color:#4a5568">📅 ${dateStr}</div></div>
        </div>
        ${data.device_title ? `<div style="margin-bottom:20px;font-size:16px;font-weight:700;color:#1a202c">🏷️ ${esc(data.device_title)}</div>` : ''}
        <div style="display:grid;grid-template-columns:repeat(${priceInp > 0 ? 4 : 3},1fr);gap:10px;margin-bottom:24px">
            <div style="background:#f0fff4;border:1px solid #c6f6d5;padding:12px;border-radius:8px;text-align:center"><span style="font-size:10px;color:#276749;display:block">${isAr ? 'الجودة' : 'Condition'}</span><strong style="font-size:18px;color:${scoreColor}">${score}%</strong></div>
            ${fairPrice > 0 ? `<div style="background:#ebf8ff;border:1px solid #bee3f8;padding:12px;border-radius:8px;text-align:center"><span style="font-size:10px;color:#2c5282;display:block">${isAr ? 'السعر العادل' : 'Fair Price'}</span><strong style="font-size:18px;color:#2b6cb0">${fmt(fairPrice)} ${currency}</strong></div>` : ''}
            ${priceInp > 0 ? `<div style="background:#edf2f7;border:1px solid #e2e8f0;padding:12px;border-radius:8px;text-align:center"><span style="font-size:10px;color:#4a5568;display:block">${isAr ? 'المعروض' : 'Listed'}</span><strong style="font-size:18px;color:#1a202c">${fmt(priceInp)} ${currency}</strong></div>` : ''}
            ${diff !== 0 ? `<div style="background:#fff5f5;border:1px solid #fed7d7;padding:12px;border-radius:8px;text-align:center"><span style="font-size:10px;color:#9b2c2c;display:block">${isAr ? 'الفرق' : 'Diff'}</span><strong style="font-size:18px;color:${diff > 0 ? '#276749' : '#c53030'}">${diff > 0 ? '+' : ''}${fmt(diff)} ${currency}</strong></div>` : ''}
        </div>
        ${minPrice > 0 || maxPrice > 0 ? `<div style="margin-bottom:20px"><h3 style="font-size:13px;color:#2d3748;border-${isAr ? 'right' : 'left'}:4px solid #00c853;padding-${isAr ? 'right' : 'left'}:8px;margin-bottom:8px">📊 ${isAr ? 'نطاق السوق' : 'Market Range'}</h3><table style="width:100%;border-collapse:collapse;font-size:12px"><tr style="background:#edf2f7"><th style="padding:8px;border:1px solid #e2e8f0;text-align:center">${isAr ? 'الحد الأدنى' : 'Min'}</th><th style="padding:8px;border:1px solid #e2e8f0;text-align:center">${isAr ? 'العادل' : 'Fair'}</th><th style="padding:8px;border:1px solid #e2e8f0;text-align:center">${isAr ? 'الحد الأعلى' : 'Max'}</th>${fairAfter > 0 ? `<th style="padding:8px;border:1px solid #e2e8f0;text-align:center">${isAr ? 'بعد الخصم' : 'After Deductions'}</th>` : ''}</tr><tr><td style="padding:10px;border:1px solid #e2e8f0;text-align:center;font-weight:bold;color:#e53e3e">${fmt(minPrice)} ${currency}</td><td style="padding:10px;border:1px solid #e2e8f0;text-align:center;font-weight:bold;color:#2b6cb0">${fmt(fairPrice)} ${currency}</td><td style="padding:10px;border:1px solid #e2e8f0;text-align:center;font-weight:bold;color:#276749">${fmt(maxPrice)} ${currency}</td>${fairAfter > 0 ? `<td style="padding:10px;border:1px solid #e2e8f0;text-align:center;font-weight:bold;color:#c05621">${fmt(fairAfter)} ${currency}</td>` : ''}</tr></table></div>` : ''}
        ${defects.length ? `<div style="margin-bottom:20px"><h3 style="font-size:13px;color:#c53030;border-${isAr ? 'right' : 'left'}:4px solid #e53e3e;padding-${isAr ? 'right' : 'left'}:8px;margin-bottom:8px">⚠️ ${isAr ? 'العيوب' : 'Defects'}</h3><table style="width:100%;border-collapse:collapse;font-size:11px"><thead><tr style="background:#edf2f7"><th style="padding:8px;border:1px solid #e2e8f0">${isAr ? 'العيب' : 'Defect'}</th><th style="padding:8px;border:1px solid #e2e8f0;text-align:center">${isAr ? 'الخطورة' : 'Severity'}</th><th style="padding:8px;border:1px solid #e2e8f0;text-align:center">${isAr ? 'الإصلاح' : 'Repair'}</th><th style="padding:8px;border:1px solid #e2e8f0;text-align:center">${isAr ? 'الخصم' : 'Deduction'}</th></tr></thead><tbody>${defects.map(d => `<tr><td style="padding:8px;border:1px solid #e2e8f0">${esc(d.defect_name || '')}</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:${(d.severity||'').includes('high')?'#e53e3e':(d.severity||'').includes('medium')?'#dd6b20':'#38a169'}">${esc(d.severity || '')}</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#e53e3e;font-weight:bold">${fmt(d.estimated_repair_cost)} ${currency}</td><td style="padding:8px;border:1px solid #e2e8f0;text-align:center;color:#2b6cb0;font-weight:bold">${fmt(d.recommended_price_deduction)} ${currency}</td></tr>`).join('')}</tbody></table>${totalRepair > 0 ? `<div style="display:flex;gap:12px;margin-top:8px"><div style="flex:1;background:#fff5f5;padding:8px;border-radius:6px;text-align:center;font-size:12px;color:#e53e3e">${isAr ? 'إجمالي الإصلاح' : 'Total Repair'}: <strong>${fmt(totalRepair)} ${currency}</strong></div><div style="flex:1;background:#fff5f5;padding:8px;border-radius:6px;text-align:center;font-size:12px;color:#9b2c2c">${isAr ? 'إجمالي الخصم' : 'Total Deduction'}: <strong>${fmt(totalDeduction)} ${currency}</strong></div></div>` : ''}</div>` : ''}
        ${data.recommendation ? `<div style="background:#ebf8ff;border:1px solid #bee3f8;padding:14px;border-radius:8px;margin-bottom:16px"><h4 style="margin:0 0 6px;font-size:13px;color:#2c5282">💡 ${isAr ? 'النصيحة' : 'Advice'}</h4><p style="margin:0;font-size:12px;color:#2d3748">${esc(data.recommendation)}</p></div>` : ''}
        <div style="margin-top:30px;border-top:1px solid #e2e8f0;padding-top:10px;text-align:center;font-size:10px;color:#a0aec0">VALO Check — ${dateStr}</div>
    </div>`;
}

function exportReportPdf() {
    if (!STATE.features.pdfReport) return;
    const data = STATE.lastResult;
    if (!data || data.error) {
        alert(getText('noData'));
        return;
    }
    const isAr = STATE.lang === 'ar';
    const content = buildPdfReportHTML(data);
    if (!content) return;

    let iframe = $('print-pdf-iframe');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'print-pdf-iframe';
        iframe.style.cssText = 'position:fixed;left:0;top:0;width:794px;height:1123px;border:none;opacity:0;pointer-events:none;z-index:-1';
        document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write('<!DOCTYPE html><html dir="' + (isAr ? 'rtl' : 'ltr') + '"><head><meta charset="UTF-8"><title>VALO Check Report</title><style>*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{font-family:"Segoe UI",Arial,sans-serif!important;background:#ffffff!important;color:#000000!important;padding:0;margin:0;direction:' + (isAr ? 'rtl' : 'ltr') + '}@page{size:A4;margin:10mm}</style></head><body>' + content + '</body></html>');
    doc.close();

    setTimeout(() => { iframe.contentWindow.focus(); iframe.contentWindow.print(); }, 600);
}

/* ── BUYER ASSISTANT ── */
async function suggestProducts() {
    const budget = parseFloat($('budgetInput')?.value) || 0;
    const cat = STATE.category;
    const c = COUNTRIES[STATE.country] || COUNTRIES.EG;
    const container = $('suggestionsContainer');
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#718096">⏳ ' + (STATE.lang === 'ar' ? 'جاري التحميل...' : 'Loading...') + '</div>';

    try {
        const keys = CONFIG.gemini.keys.filter(k => k.active !== false).map(k => k.key);
        if (!keys.length) { container.innerHTML = '<div style="text-align:center;padding:16px;color:#718096">⚠️ ' + (STATE.lang === 'ar' ? 'لا توجد مفاتيح API' : 'No API keys configured') + '</div>'; return; }

        const prompt = `Suggest 5 popular used ${cat} models available in ${c.nameEn} market with estimated prices in ${c.currency}. Return a JSON array only: [{ "name": "...", "specs": "...", "price": number, "currency": "${c.currency}" }]. No markdown. No explanation.`;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${keys[0]}`;
        const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 2048 } })
        });
        if (!r.ok) throw new Error('API error');
        const data = await r.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('No response');
        const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/m, '').trim();
        const items = JSON.parse(cleaned);

        if (!items?.length) throw new Error('Empty');
        container.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">' +
            items.filter(i => !budget || i.price <= budget).slice(0, 6).map(i => `
                <div style="background:rgba(0,200,83,0.04);border:1px solid rgba(0,200,83,0.1);padding:14px;border-radius:12px">
                    <div style="font-weight:700;color:#e2e8f0;margin-bottom:4px">${esc(i.name)}</div>
                    <div style="font-size:12px;color:#718096;margin-bottom:6px">${esc(i.specs || '')}</div>
                    <div style="font-size:18px;font-weight:700;color:#00c853">${(i.price || 0).toLocaleString()} ${c.currency}</div>
                </div>
            `).join('') + '</div>';
    } catch {
        container.innerHTML = '<div style="text-align:center;padding:16px;color:#718096">⚠️ ' + (STATE.lang === 'ar' ? 'تعذر التحميل' : 'Failed to load') + '</div>';
    }
}

/* ── VISITOR LOGGING ── */
async function logVisitor() {
    if (!db) return;
    try {
        const sessionId = sessionStorage.getItem('vc_session') || 's_' + Math.random().toString(36).substr(2,9) + Date.now().toString(36);
        sessionStorage.setItem('vc_session', sessionId);
        const today = new Date().toISOString().split('T')[0];
        const ua = navigator.userAgent;
        const device = /Mobi|Android|iPhone/i.test(ua) ? (/iPad|Tablet/i.test(ua) ? 'Tablet' : 'Mobile') : 'Desktop';
        const browser = /Edg\//i.test(ua) ? 'Edge' : /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? 'Firefox' : /Safari/i.test(ua) ? 'Safari' : 'Other';

        await db.collection('analytics').doc('visitors').collection('logs').add({
            sessionId, country: STATE.country, device, browser, category: STATE.category, mode: STATE.mode,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            date: today, userAgent: ua.substring(0, 200)
        });
        await db.collection('analytics').doc('stats').set({
            totalScans: firebase.firestore.FieldValue.increment(1),
            lastScan: new Date().toISOString()
        }, { merge: true });
    } catch {}
}

/* ── EVENT LISTENERS ── */
function initUI() {
    // Theme
    const savedTheme = localStorage.getItem('vc_theme') || 'dark';
    STATE.theme = savedTheme;
    document.body.classList.toggle('light-mode', savedTheme === 'light');
    $('themeToggle').onclick = toggleTheme;

    // Lang
    const savedLang = localStorage.getItem('vc_lang') || 'ar';
    STATE.lang = LANG_CODES.includes(savedLang) ? savedLang : 'ar';
    document.documentElement.dir = LANG_DIR[STATE.lang] || 'ltr';
    document.documentElement.lang = STATE.lang;
    $('langToggle').onclick = toggleLang;

    // Category
    populateCategoryPicker();
    $('categoryPicker').onchange = () => {
        STATE.category = $('categoryPicker').value;
        renderSpecs();
    };

    // Mode
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            STATE.mode = btn.dataset.mode;
        };
    });

    // File input
    $('chooseBtn').onclick = () => $('fileInput').click();
    $('fileInput').onchange = handleFiles;
    $('changeImageBtn').onclick = () => {
        STATE.images = []; STATE.imageDataUrl = ''; STATE.compressedImages = [];
        $('previewArea').style.display = 'none';
        $('dropContent').style.display = 'block';
        $('dropZone').classList.remove('has-image');
        $('analyzeBtn').disabled = true;
        $('fileInput').value = '';
    };

    // Camera
    $('cameraBtn').onclick = () => {
        if (!STATE.features.camera) { showToast('error', STATE.lang === 'ar' ? 'الكاميرا غير مفعلة' : 'Camera disabled'); return; }
        $('cameraInput').click();
    };
    $('cameraInput').onchange = handleFiles;

    // Drag & drop
    const dropZone = $('dropZone');
    dropZone.ondragover = e => { e.preventDefault(); dropZone.classList.add('dragover'); };
    dropZone.ondragleave = () => dropZone.classList.remove('dragover');
    dropZone.ondrop = e => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFiles({ target: { files: e.dataTransfer.files } });
    };

    // Analyze
    $('analyzeBtn').onclick = startAnalysis;

    // Suggest
    $('suggestBtn').onclick = suggestProducts;

    // PDF export
    $('exportPdfBtn').onclick = exportReportPdf;

    // Specs
    renderSpecs();

    // Preloader
    setTimeout(() => $('preloader').classList.add('hidden'), 1200);
}

/* ── BOOT ── */
async function boot() {
    await detectCountry();
    initUI();
    applyI18n();
}

boot();
