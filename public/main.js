// ═══ CONFIG & STATE ═══
const CONFIG = {
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    defaultLimit: 50,
    gemini: {
        keys: [],
        models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'],
    },
};

const STATE = {
    lang: 'ar',
    theme: 'dark',
    mode: 'buy', // 'buy' or 'sell'
    category: 'phone',
    country: 'EG',
    location: {
        region: '',
        city: '',
        source: 'default'
    },
    image: null,
    imageDataUrl: '',
    images: [],
    compressedImages: [],
    isAnalyzing: false,
    lastResult: null,
    features: {
        autoCountry: true,
        ads: true,
        camera: true,
        sellMode: true,
        multiLang: true,
        pdfReport: true,
    },
    dailyScans: parseInt(localStorage.getItem('valo_scans') || '0'),
    lastScanDate: localStorage.getItem('valo_scan_date') || '',
};

// ═══ FIREBASE INIT ═══
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDvaasGECJAlGDg2-KNnasJfzok1Fs7iro",
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

// ═══ DYNAMIC CONFIG FROM ADMIN ═══
window.APP_CONFIG = {
    features: { auto_country: true, ads: true, camera: true, sell_mode: false, multi_lang: false, pdf_report: true },
    limits: { daily_limit: 50, max_file_size_mb: 10, limit_message: '' },
    api_keys: [],
    ads: [],
    adsense: '',
    ad_settings: { delay: 5000, mobile: true, ad_triggers_enabled: true },
    categories: {},
    store: { enabled: false, products: [] }
};

if (db) {
    const cfgDocs = ['features','limits','api_keys','ads','adsense','ad_settings','categories','store'];
    cfgDocs.forEach(docId => {
        db.collection('config').doc(docId).onSnapshot(snap => {
            if (snap.exists) window.APP_CONFIG[docId] = snap.data();
            if (docId === 'limits' && snap.exists) CONFIG.defaultLimit = snap.data().daily_limit || 50;
            if (docId === 'api_keys' && snap.exists) CONFIG.gemini.keys = snap.data().keys || [];
        });
    });
}

// ═══ SESSION AD TRIGGER ═══
function triggerSessionAd(action) {
    if (!window.APP_CONFIG.ad_settings.ad_triggers_enabled) return;
    if (!STATE.features.ads) return;

    const flagKey = `ad_fired_${action}`;
    if (sessionStorage.getItem(flagKey)) return;
    sessionStorage.setItem(flagKey, '1');

    const triggerAds = (window.APP_CONFIG.ads || []).filter(a => a.active && a.type === action);
    if (triggerAds.length > 0) {
        const ad = triggerAds[Math.floor(Math.random() * triggerAds.length)];
        const safeLink = getSafeUrl(ad.link);
        if (safeLink) window.open(safeLink, '_blank', 'noopener,noreferrer');
    }
}

// ═══ TRANSLATIONS ═══
const I18N = {
    ar: {
        aiEngine: 'محرك الخبير الذكي - تحليل فوري بالذكاء الاصطناعي',
        heroTitle: 'فاحص القيمة الذكي',
        heroSubtitle: 'ارفع صورة السلعة المستعملة وسنحللها بالخبير الاصطناعي لنخبرك إذا كانت صفقة جيدة أم لا',
        statAccuracy: 'دقة التحليل',
        statScans: 'فحص تم',
        statSaved: 'جنيه وفر',
        modeBuy: 'أنا أشتري',
        modeSell: 'أنا أبيع',
        selectCategory: 'اختر نوع المنتج',
        dropTitle: 'Drop your Asset Image here to Scan',
        dropDesc: 'اسحب الصورة هنا أو اضغط لاختيار من جهازك',
        btnChoose: 'اختيار صورة',
        btnCamera: 'فتح الكاميرا',
        enterPrice: 'أدخل السعر المعروض (اختياري)',
        enterNotes: 'ملاحظات إضافية (اختياري)',
        btnAnalyze: 'ابدأ الفحص بالخبير',
        quickGuideTitle: '✅ إرشادات سريعة قبل إرسال الفحص',
        quickGuidePhotos: 'ماذا تصوّر؟',
        quickGuidePhotosDesc: 'صوّر الواجهة، الخلفية، الزوايا، المنافذ، وأي ملصق موديل أو رقم سيريال. لو الجهاز يعمل، أرسل صورة له وهو شغال.',
        quickGuideInspect: 'ماذا تفحص؟',
        quickGuideInspectDesc: 'راجع الخدوش، الكسور، البطارية، الشاشة، المنافذ، والرطوبة أو الصدأ. في السيارات والأجهزة المنزلية ركز على المؤشرات والأجزاء الحساسة.',
        quickGuideActions: 'ماذا تكتب؟',
        quickGuideActionsDesc: 'أضف السعر المطلوب أو المستهدف، واذكر أي عيب تعرفه مسبقًا وهل تم فحص المنتج من فني أو لا، ثم اطلب التقرير إذا رغبت.',
        guideTitle: '📋 دليل التصوير للفحص الدقيق',
        guideSubtitle: 'اتبع هذه الخطوات للحصول على أفضل نتيجة من الفحص',
        conditionScore: 'درجة جودة المنتج',
        fairPrice: 'السعر العادل',
        listedPrice: 'السعر المعروض',
        savings: 'التوفير',
        analysisDetails: 'تفاصيل التحليل',
        detectedDefects: 'العيوب المكتشفة',
        downloadPdf: 'تنزيل تقرير PDF',
        expertSays: 'نصيحة الخبير:',
        btnNewScan: 'فحص جديد',
        whySubtitle: 'أدوات ذكية لحماية جيبك من الغش',
        featAI: 'خبير اصطناعي متطور',
        featAIDesc: 'نستخدم محرك الخبير الذكي لتحليل دقيق للصور',
        featPrice: 'تقدير القيمة العادلة',
        featPriceDesc: 'مقارنة فورية مع أسعار السوق لمعرفة السعر المناسب',
        featPrivacy: 'خصوصية تامة',
        featPrivacyDesc: 'صورك لا تُحفظ على خوادمنا. كل الفحوصات آمنة ومؤقتة',
        featFast: 'فحص فوري',
        featFastDesc: 'احصل على نتيجة مفصلة في ثوانٍ معدودة',
        featGlobal: 'تغطية عالمية',
        featGlobalDesc: 'يدعم 9 أسواق عالمية بعملاتها المحلية',
        featFree: 'مجاني بالكامل',
        featFreeDesc: 'لا رسوم خفية. استخدم الموقع بلا حدود',
        footerDesc: 'حماية المشتري من الغش بالذكاء الاصطناعي',
        linkTerms: 'شروط الاستخدام',
        linkPrivacy: 'سياسة الخصوصية',
        linkCookies: 'ملفات تعريف الارتباط',
        linkContact: 'تواصل معنا',
        linkAbout: 'من نحن',
        category: 'الفئة',
        country: 'الدولة',
        // Results
        goodDeal: 'صفقة ممتازة!',
        fairPrice: 'سعر عادل',
        overpriced: 'سعر مبالغ فيه',
        // Loading
        loadingUpload: 'يتم تحميل الصورة',
        loadingAnalyze: 'الخبير يحلل الصورة',
        loadingCompare: 'يقارن بأسعار السوق',
        loadingFinal: 'يُجهز التقرير النهائي',
        // Errors
        errFileSize: 'حجم الملف كبير جداً (الحد الأقصى 10 ميجا)',
        errFileType: 'نوع الملف غير مدعوم (JPG, PNG, WEBP فقط)',
        errNoImage: 'يرجى اختيار صورة أولاً',
        errDailyLimit: 'لقد تجاوزت الحد اليومي للفحوصات. جرب غداً!',
        errAnalyze: 'حدث خطأ أثناء التحليل. حاول مرة أخرى.',
        inspectionLabel: 'هل تم فحص المنتج مسبقًا؟',
        inspectionUnknown: 'غير معروف',
        inspectionYes: 'نعم',
        inspectionNo: 'لا',
        modeSummaryBuy: 'أنت في وضع الشراء. أرسل صور المنتج ثم أضف السعر المطلوب وأي عيوب أو ملاحظات واضحة للحصول على تقرير أدق.',
        modeSummarySell: 'أنت في وضع البيع. ارفع صورًا واضحة للمنتج وسيحاول الخبير تحديد نوعه، تقدير قيمته، واقتراح تقييم احترافي يساعدك في التسعير.',
        notesHintBuy: 'اكتب العيوب التي أخبرك بها البائع أو التي لاحظتها بنفسك، وحدد هل الجهاز مفحوص أم لا.',
        notesHintSell: 'أضف حالة البطارية، الإصلاحات السابقة، الملحقات المتوفرة، أو أي ملاحظة تساعد في تسعير المنتج بشكل أدق.',
        sellPriceLabel: 'أدخل السعر المستهدف للبيع (اختياري)',
        buyPriceLabel: 'أدخل سعر البائع (اختياري)',
        buyNotesLabel: 'العيوب والملاحظات المعروفة',
        sellNotesLabel: 'وصف المنتج وحالته',
        cameraDisabled: 'فتح الكاميرا معطل من لوحة الإدارة',
        pdfPreparing: 'تم فتح نسخة جاهزة للطباعة. اختر Save as PDF لحفظ التقرير.',
        // Assistant
        assistantTitle: 'مساعد الشراء الذكي',
        assistantDesc: 'أدخل ميزانيتك والفئة المطلوبة وسيقترح لك أفضل الخيارات المتاحة',
        assistantBudget: 'الميزانية (اختياري)',
        assistantCategory: 'الفئة المطلوبة',
        assistantBtn: 'اقتراح أفضل الخيارات',
        assistantResults: 'الخيارات المقترحة',
        // Specs Section
        specsTitle: 'المواصفات التفصيلية (اختياري)',
        specsStorage: 'السعة التخزينية',
        specsRam: 'الرام (الذاكرة العشوائية)',
        specsScreen: 'حالة الشاشة',
        specsProcessor: 'المعالج',
        specsGpu: 'كارت الشاشة',
        specsYear: 'سنة الموديل',
        specsMileage: 'الكيلومترات',
        specsEngine: 'المحرك/ناقل الحركة',
        specsNotes: 'ملاحظات إضافية',
        intentLabel: 'أنا...',
        intentBuy: 'مشتري (أشتري)',
        intentSell: 'بائع (أبيع)',
        screenGood: 'ممتاز (لا يوجد خدوش/كسور)',
        screenMinor: 'خدوش بسيطة',
        screenCracked: 'مكسور/تالف',
        screenNotVisible: 'غير ظاهر بالصورة',
        engineGood: 'ممتاز',
        engineFair: 'جيد/يحتاج صيانة بسيطة',
        enginePoor: 'يحتاج صيانة كبيرة',
        // Specs Section
        specsTitle: 'المواصفات الإضافية (اختياري)',
        specsStorage: 'السعة التخزينية',
        specsRam: 'الرام (الذاكرة العشوائية)',
        specsScreen: 'حالة الشاشة',
        specsProcessor: 'المعالج',
        specsGpu: 'كارت الشاشة',
        specsYear: 'سنة الصنع',
        specsMileage: 'عدد الكيلومترات',
        specsEngine: 'حالة المحرك/القير',
        specsNotes: 'ملاحظات إضافية',
        intentLabel: 'أنت...',
        intentBuy: 'أنا أشتري (مشتري)',
        intentSell: 'أنا أبيع (بائع)',
        screenGood: 'ممتازة (لا خدوش/لا كسر)',
        screenMinor: 'خدوش بسيطة',
        screenCracked: 'مكسورة/متضررة',
        screenNotVisible: 'غير ظاهرة بالصورة',
        engineGood: 'ممتاز',
        engineFair: 'جيد/يحتاج صيانة بسيطة',
        enginePoor: 'يحتاج صيانة كبيرة',
        // Store
        storeTitle: 'متجر VALO',
        storeDesc: 'منتجات مختارة بعناية من شركائنا',
        storeEmpty: 'المتجر قيد الإعداد — سيتم عرض المنتجات قريباً',
        // Blog
        blogTitle: 'دليل فحص الأجهزة المستعملة',
        blogSubtitle: 'نصائح وأدلة لحماية نفسك عند شراء أجهزة مستعملة',
        blogH1: 'كيف تفحص جهازك المستعمل قبل الشراء',
        blogP1: 'شراء الأجهزة المستعملة يمكن أن يكون فرصة ممتازة للادخار، لكنه يحمل مخاطر إذا لم تقم بالفحص الصحيح. في هذا الدليل، سنشاركك أهم الخطوات للتأكد من أن الجهاز الذي تشتريه يستحق سعره.',
        blogH2: '1. الفحص البصري السريع',
        blogP2: 'ابدأ دائماً بالنظر إلى الجهاز من جميع الزوايا. ابحث عن الخدوش العميقة، الكسور، والتصبغات التي قد تدل على التعرض للماء. تأكد من أن الإطارات (في السيارات) أو الحواف (في الأجهزة) في حالة جيدة.',
        blogH3: '2. فحص البطارية والشحن',
        blogP3: 'البطارية هي أحد أهم عناصر التقييم في الأجهزة الإلكترونية. تحقق من صحة البطارية (Battery Health) وتأكد من أن الجهاز يشحن بشكل طبيعي. في السيارات، تأكد من عمر البطارية وحالتها.',
        blogH4: '3. اختبار الأداء',
        blogP4: 'شغّل الجهاز واختبر الأداء الأساسي: السرعة، الاستجابة، الكاميرا، الصوت، والاتصال. في الأجهزة المنزلية مثل الثلاجات والغسالات، تأكد من عمل جميع البرامج والدوائر.',
        blogH5: '4. التحقق من الأصالة',
        blogP5: 'تأكد من أن الجهاز أصلي وليس مقلداً. تحقق من رقم المسلسل (Serial Number) وقارنه بالمعلومات على الموقع الرسمي للشركة المصنعة. هذا مهم بشكل خاص للهواتف واللابتوبات.',
        blogH6: '5. مقارنة الأسعار',
        blogP6: 'قبل اتخاذ القرار، قارن السعر المعروض مع أسعار السوق المحلي. استخدم أدلة مثل VALO Check للحصول على تقدير دقيق للسعر العادل في بلدك.',
        blogH7: '6. استخدام VALO Check',
        blogP7: 'مع VALO Check، يمكنك رفع صورة الجهاز والحصول على تحليل فوري بالذكاء الاصطناعي يشمل درجة الحالة، السعر العادل، والعيوب المكتشفة. الأداة تدعم أكثر من 8 فئات و10 أسواق عالمية.',
        blogReadMore: 'اقرأ المزيد ▼',
        blogTabGeneral: 'عام',
        countryChanged: 'تم تحديث الدولة',
    },
    en: {
        aiEngine: 'Expert AI Engine - Instant Smart Analysis',
        heroTitle: 'Smart Value Inspector',
        heroSubtitle: 'Upload a photo of the used item and our AI will analyze it to tell you if it is a good deal',
        statAccuracy: 'Analysis Accuracy',
        statScans: 'Scans Done',
        statSaved: 'EGP Saved',
        modeBuy: 'I am Buying',
        modeSell: 'I am Selling',
        selectCategory: 'Select Product Type',
        dropTitle: 'Drop your Asset Image here to Scan',
        dropDesc: 'Drag image here or click to choose from device',
        btnChoose: 'Choose Image',
        btnCamera: 'Open Camera',
        enterPrice: 'Enter Listed Price (Optional)',
        enterNotes: 'Additional Notes (Optional)',
        btnAnalyze: 'Start Expert Scan',
        quickGuideTitle: 'Quick Guidelines Before Scan',
        quickGuidePhotos: 'What to photograph?',
        quickGuidePhotosDesc: 'Capture front, back, corners, ports, and any model or serial label. If the item powers on, add a photo while running.',
        quickGuideInspect: 'What to inspect?',
        quickGuideInspectDesc: 'Check scratches, cracks, battery, screen, ports, moisture, or rust. For cars and appliances, focus on indicators and sensitive parts.',
        quickGuideActions: 'What to write?',
        quickGuideActionsDesc: 'Add the asking or target price, mention any known defect, and state whether the item was inspected manually before requesting the report.',
        guideTitle: '📋 Photo Guide for Accurate Scan',
        guideSubtitle: 'Follow these steps to get the best scan results',
        conditionScore: 'Product Condition Score',
        fairPrice: 'Fair Price',
        listedPrice: 'Listed Price',
        savings: 'Savings',
        analysisDetails: 'Analysis Details',
        detectedDefects: 'Detected Defects',
        downloadPdf: 'Download PDF Report',
        expertSays: 'Expert Tip:',
        btnNewScan: 'New Scan',
        whySubtitle: 'Smart tools to protect your wallet from scams',
        featAI: 'Advanced AI Expert',
        featAIDesc: 'We use Expert AI engine for precise image analysis',
        featPrice: 'Fair Value Estimation',
        featPriceDesc: 'Instant comparison with market prices',
        featPrivacy: 'Full Privacy',
        featPrivacyDesc: 'Your photos are not stored on our servers',
        featFast: 'Instant Scan',
        featFastDesc: 'Get detailed results in seconds',
        featGlobal: 'Global Coverage',
        featGlobalDesc: 'Supports 9 global markets with local currencies',
        featFree: 'Completely Free',
        featFreeDesc: 'No hidden fees. Use without limits',
        footerDesc: 'Buyer protection with AI technology',
        linkTerms: 'Terms of Use',
        linkPrivacy: 'Privacy Policy',
        linkCookies: 'Cookie Policy',
        linkContact: 'Contact Us',
        linkAbout: 'About Us',
        category: 'Category',
        country: 'Country',
        goodDeal: 'Great Deal!',
        fairPrice: 'Fair Price',
        overpriced: 'Overpriced',
        loadingUpload: 'Uploading image',
        loadingAnalyze: 'Expert analyzing image',
        loadingCompare: 'Comparing market prices',
        loadingFinal: 'Preparing final report',
        errFileSize: 'File too large (max 10MB)',
        errFileType: 'Unsupported file type (JPG, PNG, WEBP only)',
        errNoImage: 'Please select an image first',
        errDailyLimit: 'Daily scan limit reached. Try tomorrow!',
        errAnalyze: 'Error during analysis. Please try again.',
        inspectionLabel: 'Was the item inspected before?',
        inspectionUnknown: 'Unknown',
        inspectionYes: 'Yes',
        inspectionNo: 'No',
        modeSummaryBuy: 'Buying mode is active. Upload the item photos, enter the seller asking price, and mention any visible defects for a more accurate report.',
        modeSummarySell: 'Selling mode is active. Upload clear item photos and the expert will estimate the item type, fair value, and a professional rating.',
        notesHintBuy: 'Write the defects mentioned by the seller or noticed by you, and whether the device was professionally inspected.',
        notesHintSell: 'Add battery health, prior repairs, included accessories, or any useful notes that improve pricing accuracy.',
        sellPriceLabel: 'Enter target selling price (Optional)',
        buyPriceLabel: 'Enter seller asking price (Optional)',
        buyNotesLabel: 'Known defects and notes',
        sellNotesLabel: 'Item description and condition',
        cameraDisabled: 'Camera capture is disabled from admin settings',
        pdfPreparing: 'A printable report was opened. Choose Save as PDF to download it.',
        // Assistant
        assistantTitle: 'Smart Buyer Assistant',
        assistantDesc: 'Enter your budget and category to get the best suggestions',
        assistantBudget: 'Budget (Optional)',
        assistantCategory: 'Category',
        assistantBtn: 'Suggest Best Options',
        assistantResults: 'Suggested Options',
        // Specs Section
        specsTitle: 'Additional Specs (Optional)',
        specsStorage: 'Storage',
        specsRam: 'RAM',
        specsScreen: 'Screen Condition',
        specsProcessor: 'Processor',
        specsGpu: 'GPU',
        specsYear: 'Model Year',
        specsMileage: 'Mileage (KM)',
        specsEngine: 'Engine/Transmission',
        specsNotes: 'Additional Notes',
        intentLabel: 'I am...',
        intentBuy: 'Buying (Buyer)',
        intentSell: 'Selling (Seller)',
        screenGood: 'Excellent (No scratches/cracks)',
        screenMinor: 'Minor scratches',
        screenCracked: 'Cracked/Damaged',
        screenNotVisible: 'Not visible in photo',
        engineGood: 'Excellent',
        engineFair: 'Good/Needs minor service',
        enginePoor: 'Needs major service',
        // Store
        storeTitle: 'VALO Store',
        storeDesc: 'Curated products from our partners',
        storeEmpty: 'Store coming soon — Products will appear here',
        // Blog
        blogTitle: 'Used Device Inspection Guide',
        blogSubtitle: 'Tips and guides to protect yourself when buying used devices',
        blogH1: 'How to Inspect Your Used Device Before Buying',
        blogP1: 'Buying used devices can be an excellent opportunity to save money, but it carries risks if you don\'t inspect properly. In this guide, we\'ll share the most important steps to ensure the device you\'re buying is worth its price.',
        blogH2: '1. Quick Visual Inspection',
        blogP2: 'Always start by looking at the device from all angles. Look for deep scratches, cracks, and discoloration that may indicate water damage. Make sure tires (for cars) or edges (for devices) are in good condition.',
        blogH3: '2. Battery & Charging Check',
        blogP3: 'The battery is one of the most important evaluation factors in electronic devices. Check battery health and make sure the device charges normally. For cars, check battery age and condition.',
        blogH4: '3. Performance Test',
        blogP4: 'Turn on the device and test basic performance: speed, responsiveness, camera, audio, and connectivity. For home appliances like fridges and washers, make sure all programs and circuits work.',
        blogH5: '4. Authenticity Verification',
        blogP5: 'Make sure the device is genuine and not a counterfeit. Check the serial number and compare it with information on the manufacturer\'s official website. This is especially important for phones and laptops.',
        blogH6: '5. Price Comparison',
        blogP6: 'Before making a decision, compare the listed price with local market prices. Use tools like VALO Check to get an accurate estimate of the fair price in your country.',
        blogH7: '6. Using VALO Check',
        blogP7: 'With VALO Check, you can upload a photo of the device and get instant AI analysis including condition score, fair price, and detected defects. The tool supports 8+ categories and 10+ global markets.',
        blogReadMore: 'Read More ▼',
        blogTabGeneral: 'General',
        countryChanged: 'Country updated',
    },
    fr: {
        aiEngine: 'Moteur IA Expert - Analyse instantanée',
        heroTitle: 'Inspecteur de Valeur Intelligent',
        heroSubtitle: "Téléchargez une photo de l'article d'occasion et notre IA l'analysera",
        statAccuracy: 'Précision',
        statScans: 'Analyses',
        statSaved: 'Économisés',
        modeBuy: "J'achète",
        modeSell: 'Je vends',
        selectCategory: 'Choisir le type de produit',
        dropTitle: "Déposez votre image ici pour l'analyser",
        dropDesc: "Glissez l'image ici ou cliquez pour choisir",
        btnChoose: 'Choisir une image',
        btnCamera: 'Ouvrir la caméra',
        enterPrice: 'Prix demandé (Optionnel)',
        enterNotes: 'Notes supplémentaires (Optionnel)',
        btnAnalyze: "Démarrer l'analyse",
        goodDeal: 'Bonne affaire!',
        fairPrice: 'Prix équitable',
        overpriced: 'Surchargé',
        loadingUpload: 'Téléchargement',
        loadingAnalyze: 'Analyse en cours',
        loadingCompare: 'Comparaison des prix',
        loadingFinal: 'Préparation du rapport',
        errFileSize: 'Fichier trop volumineux (max 10 Mo)',
        errFileType: 'Type de fichier non supporté (JPG, PNG, WEBP)',
        errNoImage: "Veuillez d'abord sélectionner une image",
        errDailyLimit: 'Limite quotidienne atteinte. Réessayez demain!',
        errAnalyze: "Erreur lors de l'analyse. Réessayez.",
        inspectionLabel: "L'article a-t-il été inspecté?",
        inspectionUnknown: 'Inconnu',
        inspectionYes: 'Oui',
        inspectionNo: 'Non',
        modeSummaryBuy: "Mode achat actif. Téléchargez les photos, entrez le prix et les défauts pour un rapport précis.",
        modeSummarySell: "Mode vente actif. Téléchargez des photos claires et l'expert estimera la valeur.",
        notesHintBuy: "Écrivez les défauts mentionnés par le vendeur.",
        notesHintSell: "Ajoutez l'état de la batterie, réparations, accessoires.",
        sellPriceLabel: 'Prix de vente cible (Optionnel)',
        buyPriceLabel: 'Prix demandé par le vendeur (Optionnel)',
        buyNotesLabel: 'Défauts et notes connus',
        sellNotesLabel: 'Description et état',
        cameraDisabled: 'Caméra désactivée par l\'administrateur',
        pdfPreparing: 'Rapport ouvert. Choisissez Enregistrer en PDF.',
        assistantTitle: 'Assistant d\'Achat Intelligent',
        assistantDesc: 'Entrez votre budget et la catégorie pour des suggestions',
        assistantBudget: 'Budget (Optionnel)',
        assistantCategory: 'Catégorie',
        assistantBtn: 'Suggérer les meilleures options',
        assistantResults: 'Options suggérées',
        storeTitle: 'Boutique VALO',
        storeDesc: 'Produits sélectionnés par nos partenaires',
        storeEmpty: 'Boutique bientôt disponible',
        blogTitle: "Guide d'inspection d'appareils d'occasion",
        blogSubtitle: "Conseils pour vous protéger lors de l'achat",
        blogTabGeneral: 'Général',
        whySubtitle: 'Outils intelligents pour protéger votre portefeuille',
        featAI: 'IA Expert Avancée',
        featAIDesc: 'Analyse précise des images par moteur IA expert',
        featPrice: 'Estimation du Prix Juste',
        featPriceDesc: 'Comparaison instantanée avec les prix du marché',
        featPrivacy: 'Confidentialité Totale',
        featPrivacyDesc: "Vos photos ne sont pas stockées sur nos serveurs",
        featFast: 'Analyse Instantanée',
        featFastDesc: 'Résultats détaillés en quelques secondes',
        featGlobal: 'Couverture Mondiale',
        featGlobalDesc: '10 marchés mondiaux avec devises locales',
        featFree: 'Entièrement Gratuit',
        featFreeDesc: 'Pas de frais cachés. Utilisez sans limites',
        footerDesc: 'Protection de l\'acheteur par IA',
        linkTerms: "Conditions d'utilisation",
        linkPrivacy: 'Politique de confidentialité',
        linkCookies: 'Politique de cookies',
        linkContact: 'Contactez-nous',
        linkAbout: 'À propos',
        category: 'Catégorie',
        country: 'Pays',
        countryChanged: 'Pays mis à jour',
        quickGuideTitle: '✅ Directives rapides avant analyse',
        quickGuidePhotos: 'Que photographier?',
        quickGuidePhotosDesc: 'Photographiez le devant, l\'arrière, les coins, les ports et les étiquettes.',
        quickGuideInspect: 'Que vérifier?',
        quickGuideInspectDesc: 'Vérifiez les rayures, fissures, batterie, écran, ports.',
        quickGuideActions: 'Que noter?',
        quickGuideActionsDesc: 'Ajoutez le prix, les défauts connus, et si inspecté techniquement.',
        guideTitle: '📋 Guide photo pour une analyse précise',
        guideSubtitle: 'Suivez ces étapes pour les meilleurs résultats',
        conditionScore: 'Score d\'état du produit',
        fairPrice: 'Prix équitable',
        listedPrice: 'Prix demandé',
        savings: 'Économie',
        analysisDetails: 'Détails de l\'analyse',
        detectedDefects: 'Défauts détectés',
        downloadPdf: 'Télécharger le rapport PDF',
        expertSays: 'Conseil de l\'expert:',
        btnNewScan: 'Nouvelle analyse',
    },
    de: {
        aiEngine: 'KI-Expert Engine - Sofortige Analyse',
        heroTitle: 'Intelligenter Wert-Prüfer',
        heroSubtitle: 'Laden Sie ein Foto des gebrauchten Artikels hoch und unsere KI analysiert es',
        statAccuracy: 'Genauigkeit',
        statScans: 'Analysen',
        statSaved: 'Gespart',
        modeBuy: 'Ich kaufe',
        modeSell: 'Ich verkaufe',
        selectCategory: 'Produkttyp wählen',
        dropTitle: 'Bild hier ablegen zum Scannen',
        dropDesc: 'Bild hierher ziehen oder klicken zum Auswählen',
        btnChoose: 'Bild wählen',
        btnCamera: 'Kamera öffnen',
        enterPrice: 'Angebotspreis (Optional)',
        enterNotes: 'Zusätzliche Notizen (Optional)',
        btnAnalyze: 'Analyse starten',
        goodDeal: 'Gutes Geschäft!',
        fairPrice: 'Fairer Preis',
        overpriced: 'Überteuert',
        loadingUpload: 'Bild wird hochgeladen',
        loadingAnalyze: 'KI analysiert Bild',
        loadingCompare: 'Marktpreise vergleichen',
        loadingFinal: 'Bericht wird vorbereitet',
        errFileSize: 'Datei zu groß (max 10MB)',
        errFileType: 'Nicht unterstützter Typ (JPG, PNG, WEBP)',
        errNoImage: 'Bitte zuerst ein Bild wählen',
        errDailyLimit: 'Tageslimit erreicht. Morgen erneut versuchen!',
        errAnalyze: 'Fehler bei der Analyse. Bitte erneut versuchen.',
        inspectionLabel: 'Wurde das Gerät vorher geprüft?',
        inspectionUnknown: 'Unbekannt',
        inspectionYes: 'Ja',
        inspectionNo: 'Nein',
        modeSummaryBuy: 'Kaufmodus aktiv. Laden Sie Fotos hoch, geben Sie Preis und Mängel ein.',
        modeSummarySell: 'Verkaufsmodus aktiv. Laden Sie klare Fotos hoch für eine Werteschätzung.',
        notesHintBuy: 'Schreiben Sie die vom Verkäufer genannten Mängel.',
        notesHintSell: 'Fügen Sie Akkuzustand, Reparaturen, Zubehör hinzu.',
        sellPriceLabel: 'Zielverkaufspreis (Optional)',
        buyPriceLabel: 'Verkäuferpreis (Optional)',
        buyNotesLabel: 'Bekannte Mängel und Notizen',
        sellNotesLabel: 'Artikelbeschreibung und Zustand',
        cameraDisabled: 'Kamera vom Admin deaktiviert',
        pdfPreparing: 'Bericht geöffnet. Wählen Sie Als PDF speichern.',
        assistantTitle: 'Intelligenter Käufer-Assistent',
        assistantDesc: 'Geben Sie Ihr Budget und die Kategorie ein',
        assistantBudget: 'Budget (Optional)',
        assistantCategory: 'Kategorie',
        assistantBtn: 'Beste Optionen vorschlagen',
        assistantResults: 'Vorgeschlagene Optionen',
        storeTitle: 'VALO Shop',
        storeDesc: 'Ausgewählte Produkte unserer Partner',
        storeEmpty: 'Shop kommt bald',
        blogTitle: 'Gebraucht-Geräte-Prüfungsleitfaden',
        blogSubtitle: 'Tipps zum Schutz beim Kauf gebrauchter Geräte',
        blogTabGeneral: 'Allgemein',
        whySubtitle: 'Intelligente Tools zum Schutz Ihres Geldbeutels',
        featAI: 'Fortgeschrittene KI-Expertise',
        featAIDesc: 'Präzise Bildanalyse durch KI-Expertengine',
        featPrice: 'Faire Wertschätzung',
        featPriceDesc: 'Sofortiger Vergleich mit Marktpreisen',
        featPrivacy: 'Volle Privatsphäre',
        featPrivacyDesc: 'Ihre Fotos werden nicht auf unseren Servern gespeichert',
        featFast: 'Sofortige Analyse',
        featFastDesc: 'Detaillierte Ergebnisse in Sekunden',
        featGlobal: 'Globale Abdeckung',
        featGlobalDesc: '10 globale Märkte mit lokalen Währungen',
        featFree: 'Komplett Kostenlos',
        featFreeDesc: 'Keine versteckten Gebühren. Ohne Grenzen nutzen',
        footerDesc: 'Käuferschutz mit KI-Technologie',
        linkTerms: 'Nutzungsbedingungen',
        linkPrivacy: 'Datenschutzrichtlinie',
        linkCookies: 'Cookie-Richtlinie',
        linkContact: 'Kontakt',
        linkAbout: 'Über uns',
        category: 'Kategorie',
        country: 'Land',
        countryChanged: 'Land aktualisiert',
        quickGuideTitle: '✅ Kurzleitfaden vor dem Scan',
        quickGuidePhotos: 'Was fotografieren?',
        quickGuidePhotosDesc: 'Fotografieren Sie Vorderseite, Rückseite, Ecken, Anschlüsse und Etiketten.',
        quickGuideInspect: 'Was prüfen?',
        quickGuideInspectDesc: 'Prüfen Sie Kratzer, Risse, Akku, Bildschirm, Anschlüsse.',
        quickGuideActions: 'Was notieren?',
        quickGuideActionsDesc: 'Fügen Sie Preis, bekannte Mängel und Prüfstatus hinzu.',
        guideTitle: '📋 Fotoleitfaden für genaue Analyse',
        guideSubtitle: 'Befolgen Sie diese Schritte für beste Ergebnisse',
        conditionScore: 'Gerätezustands-Score',
        fairPrice: 'Fairer Preis',
        listedPrice: 'Angebotspreis',
        savings: 'Ersparnis',
        analysisDetails: 'Analysedetails',
        detectedDefects: 'Erkannte Mängel',
        downloadPdf: 'PDF-Bericht herunterladen',
        expertSays: 'Experten-Tipp:',
        btnNewScan: 'Neuer Scan',
    },
    zh: {
        aiEngine: 'AI专家引擎 - 即时智能分析',
        heroTitle: '智能价值检测器',
        heroSubtitle: '上传二手物品照片，AI将为您分析是否划算',
        statAccuracy: '分析准确度',
        statScans: '已完成检测',
        statSaved: '已节省',
        modeBuy: '我要买',
        modeSell: '我要卖',
        selectCategory: '选择产品类型',
        dropTitle: '将图片拖放到此处扫描',
        dropDesc: '拖拽图片到此处或点击选择',
        btnChoose: '选择图片',
        btnCamera: '打开相机',
        enterPrice: '卖家报价（可选）',
        enterNotes: '附加说明（可选）',
        btnAnalyze: '开始检测',
        goodDeal: '很划算!',
        fairPrice: '价格公道',
        overpriced: '价格过高',
        loadingUpload: '正在上传图片',
        loadingAnalyze: 'AI正在分析图片',
        loadingCompare: '正在比较市场价格',
        loadingFinal: '正在准备最终报告',
        errFileSize: '文件过大（最大10MB）',
        errFileType: '不支持的文件类型（仅限JPG、PNG、WEBP）',
        errNoImage: '请先选择一张图片',
        errDailyLimit: '已达到每日检测上限，请明天再试！',
        errAnalyze: '分析过程中出错，请重试。',
        inspectionLabel: '该产品是否被检查过？',
        inspectionUnknown: '未知',
        inspectionYes: '是',
        inspectionNo: '否',
        modeSummaryBuy: '购买模式已激活。上传产品照片，输入价格和缺陷以获得更准确的报告。',
        modeSummarySell: '销售模式已激活。上传清晰的产品照片，专家将评估其价值。',
        notesHintBuy: '写下卖家提到的缺陷。',
        notesHintSell: '添加电池健康度、维修记录、配件等。',
        sellPriceLabel: '目标售价（可选）',
        buyPriceLabel: '卖家报价（可选）',
        buyNotesLabel: '已知缺陷和备注',
        sellNotesLabel: '产品描述和状况',
        cameraDisabled: '相机已被管理员禁用',
        pdfPreparing: '报告已打开。选择"另存为PDF"下载。',
        assistantTitle: '智能购买助手',
        assistantDesc: '输入预算和类别获取最佳建议',
        assistantBudget: '预算（可选）',
        assistantCategory: '类别',
        assistantBtn: '推荐最佳选项',
        assistantResults: '推荐选项',
        storeTitle: 'VALO 商店',
        storeDesc: '合作伙伴精选产品',
        storeEmpty: '商店即将上线',
        blogTitle: '二手设备检测指南',
        blogSubtitle: '保护您购买二手设备的提示和指南',
        blogTabGeneral: '通用',
        whySubtitle: '保护您钱包的智能工具',
        featAI: '先进的AI专家',
        featAIDesc: '使用AI专家引擎进行精确图像分析',
        featPrice: '公平价格估算',
        featPriceDesc: '与市场价格即时比较',
        featPrivacy: '完全隐私',
        featPrivacyDesc: '您的照片不会保存在我们的服务器上',
        featFast: '即时检测',
        featFastDesc: '几秒钟内获得详细结果',
        featGlobal: '全球覆盖',
        featGlobalDesc: '支持10个全球市场和本地货币',
        featFree: '完全免费',
        featFreeDesc: '无隐藏费用，无限使用',
        footerDesc: 'AI技术保护买家',
        linkTerms: '使用条款',
        linkPrivacy: '隐私政策',
        linkCookies: 'Cookie政策',
        linkContact: '联系我们',
        linkAbout: '关于我们',
        category: '类别',
        country: '国家',
        countryChanged: '国家已更新',
        quickGuideTitle: '✅ 扫描前快速指南',
        quickGuidePhotos: '拍摄什么？',
        quickGuidePhotosDesc: '拍摄正面、背面、角落、端口和标签。',
        quickGuideInspect: '检查什么？',
        quickGuideInspectDesc: '检查划痕、裂缝、电池、屏幕、端口。',
        quickGuideActions: '写什么？',
        quickGuideActionsDesc: '添加价格、已知缺陷和检查状态。',
        guideTitle: '📋 精确扫描的照片指南',
        guideSubtitle: '按照这些步骤获得最佳扫描结果',
        conditionScore: '产品状况评分',
        fairPrice: '公平价格',
        listedPrice: '标价',
        savings: '节省',
        analysisDetails: '分析详情',
        detectedDefects: '检测到的缺陷',
        downloadPdf: '下载PDF报告',
        expertSays: '专家提示：',
        btnNewScan: '新扫描',
    },
    es: {
        aiEngine: 'Motor IA Experto - Análisis instantáneo',
        heroTitle: 'Inspector de Valor Inteligente',
        heroSubtitle: 'Sube una foto del artículo usado y nuestra IA lo analizará',
        statAccuracy: 'Precisión',
        statScans: 'Análisis',
        statSaved: 'Ahorrado',
        modeBuy: 'Estoy comprando',
        modeSell: 'Estoy vendiendo',
        selectCategory: 'Seleccionar tipo de producto',
        dropTitle: 'Suelta tu imagen aquí para escanear',
        dropDesc: 'Arrastra la imagen o haz clic para elegir',
        btnChoose: 'Elegir imagen',
        btnCamera: 'Abrir cámara',
        enterPrice: 'Precio solicitado (Opcional)',
        enterNotes: 'Notas adicionales (Opcional)',
        btnAnalyze: 'Iniciar análisis',
        goodDeal: '¡Buen negocio!',
        fairPrice: 'Precio justo',
        overpriced: 'Sobreprecio',
        loadingUpload: 'Subiendo imagen',
        loadingAnalyze: 'IA analizando imagen',
        loadingCompare: 'Comparando precios del mercado',
        loadingFinal: 'Preparando informe final',
        errFileSize: 'Archivo demasiado grande (máx 10MB)',
        errFileType: 'Tipo no soportado (JPG, PNG, WEBP)',
        errNoImage: 'Por favor seleccione una imagen primero',
        errDailyLimit: 'Límite diario alcanzado. ¡Intente mañana!',
        errAnalyze: 'Error durante el análisis. Intente de nuevo.',
        inspectionLabel: '¿El artículo fue inspeccionado antes?',
        inspectionUnknown: 'Desconocido',
        inspectionYes: 'Sí',
        inspectionNo: 'No',
        modeSummaryBuy: 'Modo compra activo. Suba fotos, ingrese precio y defectos.',
        modeSummarySell: 'Modo venta activo. Suba fotos claras para una estimación de valor.',
        notesHintBuy: 'Escriba los defectos mencionados por el vendedor.',
        notesHintSell: 'Agregue salud de batería, reparaciones, accesorios.',
        sellPriceLabel: 'Precio de venta objetivo (Opcional)',
        buyPriceLabel: 'Precio del vendedor (Opcional)',
        buyNotesLabel: 'Defectos y notas conocidos',
        sellNotesLabel: 'Descripción y condición del artículo',
        cameraDisabled: 'Cámara desactivada por el administrador',
        pdfPreparing: 'Informe abierto. Elija Guardar como PDF.',
        assistantTitle: 'Asistente de Compra Inteligente',
        assistantDesc: 'Ingrese su presupuesto y categoría para sugerencias',
        assistantBudget: 'Presupuesto (Opcional)',
        assistantCategory: 'Categoría',
        assistantBtn: 'Sugerir mejores opciones',
        assistantResults: 'Opciones sugeridas',
        storeTitle: 'Tienda VALO',
        storeDesc: 'Productos seleccionados de nuestros socios',
        storeEmpty: 'Tienda próximamente',
        blogTitle: 'Guía de inspección de dispositivos usados',
        blogSubtitle: 'Consejos para protegerse al comprar dispositivos usados',
        blogTabGeneral: 'General',
        whySubtitle: 'Herramientas inteligentes para proteger su billetera',
        featAI: 'IA Experta Avanzada',
        featAIDesc: 'Análisis preciso de imágenes por motor IA experto',
        featPrice: 'Estimation de Precio Justo',
        featPriceDesc: 'Comparación instantánea con precios del mercado',
        featPrivacy: 'Privacidad Total',
        featPrivacyDesc: 'Sus fotos no se almacenan en nuestros servidores',
        featFast: 'Análisis Instantáneo',
        featFastDesc: 'Resultados detallados en segundos',
        featGlobal: 'Cobertura Global',
        featGlobalDesc: '10 mercados globales con monedas locales',
        featFree: 'Completamente Gratis',
        featFreeDesc: 'Sin costos ocultos. Use sin límites',
        footerDesc: 'Protección al comprador con tecnología IA',
        linkTerms: 'Términos de uso',
        linkPrivacy: 'Política de privacidad',
        linkCookies: 'Política de cookies',
        linkContact: 'Contáctenos',
        linkAbout: 'Sobre nosotros',
        category: 'Categoría',
        country: 'País',
        countryChanged: 'País actualizado',
        quickGuideTitle: '✅ Directrices rápidas antes del escaneo',
        quickGuidePhotos: '¿Qué fotografiar?',
        quickGuidePhotosDesc: 'Fotografíe frente, atrás, esquinas, puertos y etiquetas.',
        quickGuideInspect: '¿Qué inspeccionar?',
        quickGuideInspectDesc: 'Verifique rayones, grietas, batería, pantalla, puertos.',
        quickGuideActions: '¿Qué escribir?',
        quickGuideActionsDesc: 'Agregue precio, defectos conocidos y estado de inspección.',
        guideTitle: '📋 Guía de fotos para análisis preciso',
        guideSubtitle: 'Siga estos pasos para mejores resultados',
        conditionScore: 'Puntuación de condición',
        fairPrice: 'Precio justo',
        listedPrice: 'Precio solicitado',
        savings: 'Ahorro',
        analysisDetails: 'Detalles del análisis',
        detectedDefects: 'Defectos detectados',
        downloadPdf: 'Descargar informe PDF',
        expertSays: 'Consejo del experto:',
        btnNewScan: 'Nuevo escaneo',
    }
};

// ═══ CATEGORIES DATA ═══
const CATEGORIES = {
    phone: { icon: '📱', nameAr: 'موبايل', nameEn: 'Mobile Phone', guides: [
        { icon: '📷', titleAr: 'صورة أمامية واضحة', titleEn: 'Clear Front Photo', descAr: 'صورة للواجهة الأمامية للجهاز كاملة', descEn: 'Full front view of the device' },
        { icon: '🔌', titleAr: 'منفذ الشحن', titleEn: 'Charging Ports', descAr: 'تصوير منفذ USB والشاحن عن قرب', descEn: 'Close-up of USB ports and charger' },
        { icon: '🏷️', titleAr: 'الملصقات والمواصفات', titleEn: 'Labels & Specs', descAr: 'صورة واضحة لملصق الموديل والسيريال', descEn: 'Clear photo of model label and serial' },
        { icon: '🔋', titleAr: 'حالة البطارية', titleEn: 'Battery Health', descAr: 'لقطة شاشة لصحة البطارية (لو ممكن)', descEn: 'Screenshot of battery health (if possible)' },
        { icon: '📐', titleAr: 'الحواف والزوايا', titleEn: 'Edges & Corners', descAr: 'تصوير الحواف للكشف عن الكسور', descEn: 'Photo edges to detect cracks' },
        { icon: '🖥️', titleAr: 'الشاشة مضاءة', titleEn: 'Screen On', descAr: 'تشغيل الجهاز وتصوير الشاشة شغالة', descEn: 'Turn on device and photo active screen' },
    ]},
    laptop: { icon: '💻', nameAr: 'لابتوب', nameEn: 'Laptop', guides: [
        { icon: '📷', titleAr: 'صورة أمامية', titleEn: 'Front View', descAr: 'صورة للابتوب من الأمام ومفتوح', descEn: 'Laptop front view, open' },
        { icon: '⌨️', titleAr: 'الكيبورد', titleEn: 'Keyboard', descAr: 'تصوير الكيبورد لحالة المفاتيح', descEn: 'Photo keyboard condition' },
        { icon: '🔌', titleAr: 'منافذ الشحن', titleEn: 'Ports', descAr: 'تصوير المنافذ من الجانبين', descEn: 'Photo ports from both sides' },
        { icon: '🏷️', titleAr: 'ملصق المواصفات', titleEn: 'Specs Label', descAr: 'صورة واضحة للملصق الخلفي', descEn: 'Clear photo of back label' },
        { icon: '🖥️', titleAr: 'الشاشة شغالة', titleEn: 'Screen On', descAr: 'تشغيل الجهاز وتصوير الشاشة', descEn: 'Turn on and photo screen' },
        { icon: '🔋', titleAr: 'البطارية', titleEn: 'Battery', descAr: 'لقطة شاشة لصحة البطارية', descEn: 'Screenshot battery health' },
    ]},
    car: { icon: '🚗', nameAr: 'سيارة', nameEn: 'Car', guides: [
        { icon: '📷', titleAr: 'صورة أمامية', titleEn: 'Front View', descAr: 'صورة للسيارة من الأمام', descEn: 'Car front view' },
        { icon: '📷', titleAr: 'صورة خلفية', titleEn: 'Rear View', descAr: 'صورة للسيارة من الخلف', descEn: 'Car rear view' },
        { icon: '🛞', titleAr: 'الإطارات', titleEn: 'Tires', descAr: 'تصوير الإطارات الأربعة', descEn: 'Photo all four tires' },
        { icon: '🪑', titleAr: 'الداخلية', titleEn: 'Interior', descAr: 'صورة للمقصورة الداخلية', descEn: 'Interior cabin photo' },
        { icon: '📟', titleAr: 'عداد المسافات', titleEn: 'Odometer', descAr: 'صورة واضحة لعداد الكيلومترات', descEn: 'Clear odometer photo' },
        { icon: '🔧', titleAr: 'المحرك', titleEn: 'Engine', descAr: 'فتح الكبوت وتصوير المحرك', descEn: 'Open hood and photo engine' },
    ]},
    scooter: { icon: '🛵', nameAr: 'سكوتر', nameEn: 'Scooter', guides: [
        { icon: '📷', titleAr: 'صورة كاملة', titleEn: 'Full View', descAr: 'صورة للسكوتر من الجانب', descEn: 'Scooter side view' },
        { icon: '🔋', titleAr: 'البطارية', titleEn: 'Battery', descAr: 'تصوير البطارية والموصلات', descEn: 'Photo battery and connectors' },
        { icon: '🛞', titleAr: 'الإطارات', titleEn: 'Tires', descAr: 'تصوير الإطارات', descEn: 'Photo tires' },
        { icon: '📟', titleAr: 'عداد المسافات', titleEn: 'Odometer', descAr: 'صورة واضحة للعداد', descEn: 'Clear odometer photo' },
        { icon: '🔌', titleAr: 'منفذ الشحن', titleEn: 'Charger Port', descAr: 'تصوير منفذ الشحن', descEn: 'Photo charger port' },
        { icon: '💡', titleAr: 'الإضاءة', titleEn: 'Lights', descAr: 'تشغيل الأنوار وتصويرها', descEn: 'Turn on lights and photo' },
    ]},
    fridge: { icon: '❄️', nameAr: 'ثلاجة', nameEn: 'Fridge', guides: [
        { icon: '📷', titleAr: 'صورة أمامية', titleEn: 'Front View', descAr: 'صورة للثلاجة من الأمام', descEn: 'Fridge front view' },
        { icon: '🚪', titleAr: 'الداخلية', titleEn: 'Interior', descAr: 'فتح الباب وتصوير الداخل', descEn: 'Open door and photo interior' },
        { icon: '🏷️', titleAr: 'ملصق الطاقة', titleEn: 'Energy Label', descAr: 'صورة لملصق استهلاك الطاقة', descEn: 'Photo energy consumption label' },
        { icon: '❄️', titleAr: 'التبريد', titleEn: 'Cooling', descAr: 'تصوير الثلج/التجميد لو موجود', descEn: 'Photo ice/frost if present' },
        { icon: '🔌', titleAr: 'السلك والفيش', titleEn: 'Power Cord', descAr: 'تصوير سلك الكهرباء', descEn: 'Photo power cord' },
        { icon: '📐', titleAr: 'الحواف', titleEn: 'Edges', descAr: 'تصوير الحواف للكشف عن الصدأ', descEn: 'Photo edges for rust' },
    ]},
    ac: { icon: '🌬️', nameAr: 'تكييف', nameEn: 'AC', guides: [
        { icon: '📷', titleAr: 'صورة الوحدة', titleEn: 'Unit Photo', descAr: 'صورة لوحدة التكييف', descEn: 'AC unit photo' },
        { icon: '🏷️', titleAr: 'ملصق المواصفات', titleEn: 'Specs Label', descAr: 'صورة واضحة للملصق', descEn: 'Clear label photo' },
        { icon: '🔌', titleAr: 'الأسلاك', titleEn: 'Wiring', descAr: 'تصوير الأسلاك والموصلات', descEn: 'Photo wiring' },
        { icon: '💨', titleAr: 'الفلاتر', titleEn: 'Filters', descAr: 'فتح الغطاء وتصوير الفلاتر', descEn: 'Open cover and photo filters' },
        { icon: '📐', titleAr: 'الحواف', titleEn: 'Edges', descAr: 'تصوير الحواف', descEn: 'Photo edges' },
        { icon: '🔧', titleAr: 'الموتور الخارجي', titleEn: 'Outdoor Unit', descAr: 'صورة للوحدة الخارجية لو ممكن', descEn: 'Outdoor unit photo if possible' },
    ]},
    washer: { icon: '🌀', nameAr: 'غسالة', nameEn: 'Washing Machine', guides: [
        { icon: '📷', titleAr: 'صورة أمامية', titleEn: 'Front View', descAr: 'صورة للغسالة من الأمام', descEn: 'Washer front view' },
        { icon: '🚪', titleAr: 'الباب/الحلة', titleEn: 'Door/Drum', descAr: 'فتح الباب وتصوير الحلة', descEn: 'Open door and photo drum' },
        { icon: '🏷️', titleAr: 'ملصق المواصفات', titleEn: 'Specs Label', descAr: 'صورة واضحة للملصق', descEn: 'Clear label photo' },
        { icon: '🔌', titleAr: 'السلك والفيش', titleEn: 'Power Cord', descAr: 'تصوير سلك الكهرباء', descEn: 'Photo power cord' },
        { icon: '💧', titleAr: 'مواسير المياه', titleEn: 'Water Hoses', descAr: 'تصوير مواسير الدخول والخروج', descEn: 'Photo inlet/outlet hoses' },
        { icon: '📐', titleAr: 'الحواف', titleEn: 'Edges', descAr: 'تصوير الحواف للكشف عن الصدأ', descEn: 'Photo edges for rust' },
    ]},
    pc: { icon: '🖥️', nameAr: 'كمبيوتر', nameEn: 'PC/Desktop', guides: [
        { icon: '📷', titleAr: 'صورة كاملة', titleEn: 'Full Setup', descAr: 'صورة للجهاز كامل مع الشاشة', descEn: 'Full setup with monitor' },
        { icon: '🖥️', titleAr: 'الشاشة شغالة', titleEn: 'Monitor On', descAr: 'تشغيل الجهاز وتصوير الشاشة', descEn: 'Turn on and photo monitor' },
        { icon: '🔌', titleAr: 'المنافذ الخلفية', titleEn: 'Rear Ports', descAr: 'تصوير المنافذ من الخلف', descEn: 'Photo rear ports' },
        { icon: '⚡', titleAr: 'باور سبلاي', titleEn: 'Power Supply', descAr: 'صورة لباور السبلاي', descEn: 'Photo power supply' },
        { icon: '🏷️', titleAr: 'ملصق المواصفات', titleEn: 'Specs Label', descAr: 'صورة واضحة للملصق', descEn: 'Clear label photo' },
        { icon: '🔧', titleAr: 'الداخلية', titleEn: 'Interior', descAr: 'فتح الجهاز وتصوير الداخل', descEn: 'Open case and photo interior' },
    ]},
    other: { icon: '📦', nameAr: 'أخرى', nameEn: 'Other', guides: [
        { icon: '📷', titleAr: 'صورة أمامية واضحة', titleEn: 'Clear Front Photo', descAr: 'صورة واضحة للمنتج من الأمام', descEn: 'Clear photo of product from front' },
        { icon: '📷', titleAr: 'صورة جانبية', titleEn: 'Side Photo', descAr: 'صورة للمنتج من الجانب', descEn: 'Photo from the side' },
        { icon: '📷', titleAr: 'صورة خلفية', titleEn: 'Back Photo', descAr: 'صورة للمنتج من الخلف', descEn: 'Photo from the back' },
        { icon: '🏷️', titleAr: 'الماركة والموديل', titleEn: 'Brand & Model', descAr: 'تصوير أي ملصق أو اسم ماركة', descEn: 'Photo any brand label or model name' },
        { icon: '🔍', titleAr: 'العيوب الظاهرة', titleEn: 'Visible Defects', descAr: 'تصوير أي خدوش أو كسور أو عيوب', descEn: 'Photo any scratches, cracks, or defects' },
        { icon: '💡', titleAr: 'تفاصيل إضافية', titleEn: 'Extra Details', descAr: 'أي تفاصيل تساعد في التقييم', descEn: 'Any details that help with evaluation' },
    ]},
};

// ═══ SPEC FIELDS PER CATEGORY ═══
const SPEC_FIELDS = {
    phone: [
        { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text' },
        { key: 'model', labelAr: 'الموديل', labelEn: 'Model', type: 'text' },
        { key: 'storage', labelAr: 'السعة التخزينية', labelEn: 'Storage', type: 'select', options: ['16GB','32GB','64GB','128GB','256GB','512GB','1TB'] },
        { key: 'ram', labelAr: 'الذاكرة العشوائية', labelEn: 'RAM', type: 'select', options: ['2GB','3GB','4GB','6GB','8GB','12GB','16GB'] },
        { key: 'screenCondition', labelAr: 'حالة الشاشة', labelEn: 'Screen Condition', type: 'select', options: { ar: ['ممتازة','جيدة','خدوش بسيطة','مكسورة','غير أصلية'], en: ['Excellent','Good','Minor Scratches','Cracked','Non-original'] } },
        { key: 'batteryHealth', labelAr: 'نسبة صحة البطارية', labelEn: 'Battery Health %', type: 'text' },
        { key: 'bodyCondition', labelAr: 'حالة الهيكل', labelEn: 'Body Condition', type: 'select', options: { ar: ['ممتاز','جيد','خدوش','انبعاجات',' كسور'], en: ['Excellent','Good','Scratches','Dents','Cracks'] } },
    ],
    laptop: [
        { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text' },
        { key: 'model', labelAr: 'الموديل', labelEn: 'Model', type: 'text' },
        { key: 'processor', labelAr: 'المعالج', labelEn: 'Processor', type: 'text' },
        { key: 'ram', labelAr: 'الذاكرة العشوائية', labelEn: 'RAM', type: 'select', options: ['4GB','8GB','16GB','32GB','64GB'] },
        { key: 'storage', labelAr: 'التخزين', labelEn: 'Storage', type: 'select', options: ['128GB SSD','256GB SSD','512GB SSD','1TB SSD','1TB HDD','2TB HDD'] },
        { key: 'screenCondition', labelAr: 'حالة الشاشة', labelEn: 'Screen Condition', type: 'select', options: { ar: ['ممتازة','جيدة','خدوش','بصمات','مكسورة'], en: ['Excellent','Good','Scratches','Smudges','Cracked'] } },
        { key: 'batteryHealth', labelAr: 'نسبة صحة البطارية', labelEn: 'Battery Health %', type: 'text' },
    ],
    car: [
        { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text' },
        { key: 'model', labelAr: 'الموديل', labelEn: 'Model', type: 'text' },
        { key: 'year', labelAr: 'سنة الصنع', labelEn: 'Year', type: 'text' },
        { key: 'mileage', labelAr: 'عدد الكيلومترات', labelEn: 'Mileage (km)', type: 'text' },
        { key: 'engine', labelAr: 'نوع المحرك', labelEn: 'Engine Type', type: 'select', options: { ar: ['بنزين',' ديزل',' هايبرد',' كهربائي'], en: ['Gasoline','Diesel','Hybrid','Electric'] } },
        { key: 'transmission', labelAr: 'ناقل الحركة', labelEn: 'Transmission', type: 'select', options: { ar: ['أوتوماتيك',' يدوي'], en: ['Automatic','Manual'] } },
        { key: 'bodyCondition', labelAr: 'حالة الهيكل', labelEn: 'Body Condition', type: 'select', options: { ar: ['ممتاز','جيد','خدش بسيط','صدأ',' حادث'], en: ['Excellent','Good','Minor Scratch','Rust','Accident'] } },
    ],
    scooter: [
        { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text' },
        { key: 'model', labelAr: 'الموديل', labelEn: 'Model', type: 'text' },
        { key: 'mileage', labelAr: 'عدد الكيلومترات', labelEn: 'Mileage (km)', type: 'text' },
        { key: 'batteryHealth', labelAr: 'نسبة البطارية', labelEn: 'Battery Health %', type: 'text' },
        { key: 'bodyCondition', labelAr: 'حالة الهيكل', labelEn: 'Body Condition', type: 'select', options: { ar: ['ممتاز','جيد','خدوش','انبعاجات'], en: ['Excellent','Good','Scratches','Dents'] } },
    ],
    fridge: [
        { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text' },
        { key: 'capacity', labelAr: 'السعة اللترية', labelEn: 'Capacity (L)', type: 'text' },
        { key: 'cooling', labelAr: 'حالة التبريد', labelEn: 'Cooling Performance', type: 'select', options: { ar: ['ممتاز','جيد','ضعيف','غير شغال'], en: ['Excellent','Good','Weak','Not Working'] } },
        { key: 'bodyCondition', labelAr: 'حالة الهيكل', labelEn: 'Body Condition', type: 'select', options: { ar: ['ممتاز','جيد','خدوش','صدأ'], en: ['Excellent','Good','Scratches','Rust'] } },
    ],
    ac: [
        { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text' },
        { key: 'btu', labelAr: 'قدرة التبريد (BTU)', labelEn: 'Cooling Capacity (BTU)', type: 'text' },
        { key: 'cooling', labelAr: 'حالة التبريد', labelEn: 'Cooling Performance', type: 'select', options: { ar: ['ممتاز','جيد','ضعيف','غير شغال'], en: ['Excellent','Good','Weak','Not Working'] } },
        { key: 'noiseLevel', labelAr: 'مستوى الضوضاء', labelEn: 'Noise Level', type: 'select', options: { ar: ['هادئ','عادي','عالي جداً'], en: ['Quiet','Normal','Very Loud'] } },
    ],
    washer: [
        { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text' },
        { key: 'capacity', labelAr: 'السعة الكيلو', labelEn: 'Capacity (kg)', type: 'text' },
        { key: 'spinning', labelAr: 'حالة العصر', labelEn: 'Spinning', type: 'select', options: { ar: ['ممتاز','جيد','ضعيف','غير شغال'], en: ['Excellent','Good','Weak','Not Working'] } },
        { key: 'bodyCondition', labelAr: 'حالة الهيكل', labelEn: 'Body Condition', type: 'select', options: { ar: ['ممتاز','جيد','خدوش','صدأ'], en: ['Excellent','Good','Scratches','Rust'] } },
    ],
    pc: [
        { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text' },
        { key: 'processor', labelAr: 'المعالج', labelEn: 'Processor', type: 'text' },
        { key: 'ram', labelAr: 'الذاكرة العشوائية', labelEn: 'RAM', type: 'select', options: ['4GB','8GB','16GB','32GB','64GB'] },
        { key: 'storage', labelAr: 'التخزين', labelEn: 'Storage', type: 'select', options: ['128GB SSD','256GB SSD','512GB SSD','1TB SSD','1TB HDD'] },
        { key: 'gpu', labelAr: 'كرت الشاشة', labelEn: 'GPU', type: 'text' },
    ],
    other: [
        { key: 'brand', labelAr: 'الماركة', labelEn: 'Brand', type: 'text' },
        { key: 'model', labelAr: 'الموديل', labelEn: 'Model', type: 'text' },
        { key: 'condition', labelAr: 'الحالة العامة', labelEn: 'General Condition', type: 'select', options: { ar: ['ممتاز','جيد','مقبول','سيء'], en: ['Excellent','Good','Fair','Poor'] } },
    ],
};

function renderSpecsFields() {
    const grid = document.getElementById('specsGrid');
    const section = document.getElementById('specsSection');
    if (!grid || !section) return;
    const fields = SPEC_FIELDS[STATE.category] || SPEC_FIELDS.other;
    grid.innerHTML = '';
    section.style.display = 'block';
    const isAr = STATE.lang === 'ar';
    fields.forEach(field => {
        const div = document.createElement('div');
        div.className = 'form-field';
        const label = isAr ? field.labelAr : field.labelEn;
        if (field.type === 'select') {
            const opts = Array.isArray(field.options) ? field.options : (isAr ? field.options.ar : field.options.en);
            div.innerHTML = `
                <div class="price-label">${escapeHtml(label)}</div>
                <select class="select-input" data-spec="${field.key}">
                    <option value="">${isAr ? 'غير محدد' : 'Not specified'}</option>
                    ${opts.map(o => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('')}
                </select>`;
        } else {
            div.innerHTML = `
                <div class="price-label">${escapeHtml(label)}</div>
                <input type="text" class="select-input" data-spec="${field.key}" placeholder="${escapeHtml(label)}">`;
        }
        grid.appendChild(div);
    });
}

function collectSpecs() {
    const specs = {};
    document.querySelectorAll('#specsGrid [data-spec]').forEach(el => {
        const val = el.value.trim();
        if (val) specs[el.dataset.spec] = val;
    });
    return specs;
}

// ═══ COUNTRY DATA ═══
const COUNTRIES = {
    EG: { name: 'مصر', currency: 'ج.م', currencyName: 'جنيه مصري', currencyEn: 'EGP' },
    US: { name: 'USA', currency: '$', currencyName: 'US Dollar', currencyEn: 'USD' },
    AU: { name: 'Australia', currency: 'A$', currencyName: 'AUD', currencyEn: 'AUD' },
    SA: { name: 'السعودية', currency: 'ر.س', currencyName: 'ريال سعودي', currencyEn: 'SAR' },
    AE: { name: 'الإمارات', currency: 'د.إ', currencyName: 'درهم إماراتي', currencyEn: 'AED' },
    GB: { name: 'UK', currency: '£', currencyName: 'Pound', currencyEn: 'GBP' },
    DE: { name: 'Deutschland', currency: '€', currencyName: 'Euro', currencyEn: 'EUR' },
    FR: { name: 'France', currency: '€', currencyName: 'Euro', currencyEn: 'EUR' },
    CN: { name: '中国', currency: '¥', currencyName: 'Yuan', currencyEn: 'CNY' },
    ES: { name: 'España', currency: '€', currencyName: 'Euro', currencyEn: 'EUR' },
};

// ═══ INIT ═══
document.addEventListener('DOMContentLoaded', async () => {
    loadFeatureSettings();
    if (STATE.features.autoCountry) {
        await detectCountry();
    }
    initTheme();
    initLang();
    renderCategories();
    renderGuide();
    renderSpecsFields();
    updateCurrency();
    setupEventListeners();
    checkDailyLimit();
    loadAds();
    loadAd3();
    loadAdSense();
    renderStore();
    syncModeFields();
    initBlogTabs();
    logVisitor();
});

function logVisitor() {
    if (!db) return;
    try {
        const deviceInfo = /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
        const browserInfo = (navigator.userAgent.match(/(Firefox|Chrome|Safari|Edg|OPR)\/[\d.]+/) || [])[1] || 'Unknown';
        const sid = sessionStorage.getItem('valo_sid') || (sessionStorage.setItem('valo_sid', 's' + Date.now() + Math.random().toString(36).substr(2, 6)), sessionStorage.getItem('valo_sid'));
        db.collection('analytics').doc('visitors').collection('logs').add({
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            device: deviceInfo,
            browser: browserInfo,
            country: STATE.country || 'Unknown',
            page: window.location.pathname,
            sessionId: sid
        });
        db.collection('analytics').doc('stats').set({
            totalVisits: firebase.firestore.FieldValue.increment(1),
            todayVisits: firebase.firestore.FieldValue.increment(1),
        }, { merge: true });
    } catch (e) { /* silent */ }
}

function loadFeatureSettings() {
    STATE.features.autoCountry = localStorage.getItem('valo_feat_auto_country') !== 'false';
    STATE.features.ads = localStorage.getItem('valo_feat_ads') !== 'false';
    STATE.features.camera = localStorage.getItem('valo_feat_camera') !== 'false';
    STATE.features.sellMode = localStorage.getItem('valo_feat_sell_mode') !== 'false';
    STATE.features.multiLang = localStorage.getItem('valo_feat_multi_lang') !== 'false';
    STATE.features.pdfReport = localStorage.getItem('valo_feat_pdf_report') !== 'false';

    const storedLimitMessage = localStorage.getItem('valo_limit_message');
    if (storedLimitMessage) {
        I18N.ar.errDailyLimit = storedLimitMessage;
    }

    const storedMaxSize = parseInt(localStorage.getItem('valo_max_file_size') || '', 10);
    if (!Number.isNaN(storedMaxSize) && storedMaxSize > 0) {
        CONFIG.maxFileSize = storedMaxSize;
    }
}

async function detectCountry() {
    const detectedByApi = await detectCountryByIp();
    if (detectedByApi) {
        STATE.country = detectedByApi.country;
        STATE.location.region = detectedByApi.region || '';
        STATE.location.city = detectedByApi.city || '';
        STATE.location.source = detectedByApi.source || 'api';
        document.getElementById('countrySelect').value = detectedByApi.country;
        return;
    }

    // Fallback: detect from timezone/language
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const lang = navigator.language;

    let detected = 'EG';
    if (tz.includes('America') || lang.startsWith('en-US')) detected = 'US';
    else if (tz.includes('Australia') || tz.includes('Sydney')) detected = 'AU';
    else if (tz.includes('Riyadh') || lang.startsWith('ar-SA')) detected = 'SA';
    else if (tz.includes('Dubai') || tz.includes('Abu_Dhabi')) detected = 'AE';
    else if (tz.includes('London') || tz.includes('Europe/London')) detected = 'GB';
    else if (tz.includes('Berlin') || tz.includes('Europe/Berlin')) detected = 'DE';
    else if (tz.includes('Paris') || tz.includes('Europe/Paris')) detected = 'FR';
    else if (tz.includes('Shanghai') || lang.startsWith('zh')) detected = 'CN';
    else if (tz.includes('Madrid') || lang.startsWith('es')) detected = 'ES';

    STATE.country = detected;
    STATE.location.source = 'browser-fallback';
    document.getElementById('countrySelect').value = detected;
}

async function detectCountryByIp() {
    try {
        const response = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(5000) });
        const data = await response.json();
        if (data.success && data.country_code) {
            return {
                country: data.country_code,
                region: data.region || '',
                city: data.city || '',
                source: 'ipwho.is',
            };
        }
        return null;
    } catch (error) {
        return null;
    }
}

const LANG_LABELS = { ar: 'عربي', en: 'EN', fr: 'FR', de: 'DE', zh: '中文', es: 'ES' };
const LANG_FLAGS = { ar: '🇪🇬', en: '🇺🇸', fr: '🇫🇷', de: '🇩🇪', zh: '🇨🇳', es: '🇪🇸' };

function initTheme() {
    const saved = localStorage.getItem('valo_theme');
    if (saved) {
        STATE.theme = saved;
    }
    document.getElementById('themeToggle').textContent = STATE.theme === 'dark' ? '🌙' : '☀️';
}

function initLang() {
    const saved = localStorage.getItem('valo_lang');
    if (saved) {
        STATE.lang = saved;
    }
    document.documentElement.setAttribute('dir', STATE.lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', STATE.lang);
    document.getElementById('langToggle').textContent = LANG_LABELS[STATE.lang] || 'EN';
    applyTranslations();
    applyFeatureVisibility();
}

// ═══ EVENT LISTENERS ═══
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Lang toggle
    document.getElementById('langToggle').addEventListener('click', toggleLang);

    // Category select
    document.getElementById('categorySelect').addEventListener('change', (e) => {
        STATE.category = e.target.value;
        renderCategories();
        renderGuide();
        renderSpecsFields();
    });

    // Country select
    document.getElementById('countrySelect').addEventListener('change', (e) => {
        STATE.country = e.target.value;
        updateCurrency();
        showToast('info', `🌍 ${getText('countryChanged') || 'Country updated'}`);
    });

    // Drop zone
    const dz = document.getElementById('dropZone');
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', (e) => {
        e.preventDefault();
        dz.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFiles({ target: { files: e.dataTransfer.files } });
    });

    // Scroll navbar
    window.addEventListener('scroll', () => {
        document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
    });
}

// ═══ THEME & LANG ═══
function toggleTheme() {
    STATE.theme = STATE.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', STATE.theme);
    document.getElementById('themeToggle').textContent = STATE.theme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('valo_theme', STATE.theme);
}

function toggleLang() {
    const langs = getEnabledLanguages();
    const currentIdx = langs.indexOf(STATE.lang);
    STATE.lang = langs[(currentIdx + 1) % langs.length];

    document.documentElement.setAttribute('dir', STATE.lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', STATE.lang);
    document.getElementById('langToggle').textContent = LANG_LABELS[STATE.lang] || 'EN';

    localStorage.setItem('valo_lang', STATE.lang);
    applyTranslations();
    renderCategories();
    renderGuide();
    renderSpecsFields();
    updateCurrency();
    syncModeFields();
    initBlogTabs();

    showToast('info', `${LANG_FLAGS[STATE.lang] || '🌐'} ${STATE.lang === 'ar' ? 'تم تغيير اللغة' : 'Language changed to ' + STATE.lang.toUpperCase()}`);
}

function getEnabledLanguages() {
    return STATE.features.multiLang ? ['ar', 'en', 'fr', 'de', 'zh', 'es'] : ['ar', 'en'];
}

function getText(key) {
    const t = I18N[STATE.lang] || I18N['en'];
    return t[key] || I18N['en'][key] || key;
}

function applyTranslations() {
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.getAttribute('data-key');
        const text = getText(key);
        if (text) el.textContent = text;
    });
    syncModeFields();
}

function applyFeatureVisibility() {
    const sellModeButton = document.querySelector('.mode-btn[data-mode="sell"]');
    if (sellModeButton) {
        sellModeButton.style.display = STATE.features.sellMode ? 'inline-flex' : 'none';
        if (!STATE.features.sellMode && STATE.mode === 'sell') STATE.mode = 'buy';
    }

    const pdfBtn = document.getElementById('pdfBtn');
    if (pdfBtn) {
        pdfBtn.style.display = STATE.features.pdfReport && STATE.lastResult ? 'inline-flex' : 'none';
    }
}

// ═══ MODE ═══
function setMode(mode) {
    if (mode === 'sell' && !STATE.features.sellMode) return;
    STATE.mode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    syncModeFields();
}

function syncModeFields() {
    const priceLabel = document.getElementById('priceLabel');
    const notesLabel = document.getElementById('notesLabel');
    const notesInput = document.getElementById('notesInput');
    const notesHint = document.getElementById('notesHint');
    const modeSummary = document.getElementById('modeSummary');
    const inspectionField = document.getElementById('inspectionField');
    const inspectionLabel = document.getElementById('inspectionLabel');
    const inspectionStatus = document.getElementById('inspectionStatus');
    if (!priceLabel || !notesLabel || !notesInput || !notesHint || !modeSummary || !inspectionField || !inspectionLabel || !inspectionStatus) return;

    priceLabel.textContent = STATE.mode === 'buy' ? getText('buyPriceLabel') : getText('sellPriceLabel');
    notesLabel.textContent = STATE.mode === 'buy' ? getText('buyNotesLabel') : getText('sellNotesLabel');
    notesHint.textContent = STATE.mode === 'buy' ? getText('notesHintBuy') : getText('notesHintSell');
    modeSummary.textContent = STATE.mode === 'buy' ? getText('modeSummaryBuy') : getText('modeSummarySell');

    const placeholders = {
        buy: {
            ar: 'مثال: البائع قال إن البطارية متغيرة ويوجد خدش بسيط أعلى الشاشة...',
            en: 'Example: Seller mentioned battery replacement and a light scratch on the top corner...',
            fr: "Exemple: Le vendeur a mentionné le remplacement de la batterie et une légère rayure sur le coin supérieur...",
            de: 'Beispiel: Verkäufer erwähnte Batteriewechsel und einen leichten Kratzer an der oberen Ecke...',
            zh: '示例：卖家提到电池已更换，顶部角落有轻微划痕...',
            es: 'Ejemplo: El vendedor mencionó reemplazo de batería y un ligero raspón en la esquina superior...'
        },
        sell: {
            ar: 'مثال: بطارية 87%، مع الشاحن الأصلي، تم تغيير الشاشة مرة واحدة...',
            en: 'Example: Battery health 87%, original charger included, screen replaced once...',
            fr: "Exemple: Batterie à 87%, chargeur d'origine inclus, écran remplacé une fois...",
            de: 'Beispiel: Batterie bei 87%, Original-Ladegerät dabei, Display einmal getauscht...',
            zh: '示例：电池健康度87%，附带原装充电器，屏幕更换过一次...',
            es: 'Ejemplo: Batería al 87%, cargador original incluido, pantalla reemplazada una vez...'
        }
    };
    notesInput.placeholder = placeholders[STATE.mode]?.[STATE.lang] || placeholders[STATE.mode]?.en || '';

    inspectionField.style.display = STATE.mode === 'buy' ? 'block' : 'none';
    inspectionLabel.textContent = getText('inspectionLabel');

    inspectionStatus.innerHTML = `
        <option value="unknown">${getText('inspectionUnknown')}</option>
        <option value="yes">${getText('inspectionYes')}</option>
        <option value="no">${getText('inspectionNo')}</option>
    `;
}

// ═══ CATEGORIES ═══
function renderCategories() {
    const grid = document.getElementById('categoryGrid');
    const disabledCategories = JSON.parse(localStorage.getItem('valo_disabled_categories') || '[]');
    const availableCategories = Object.entries(CATEGORIES).filter(([key]) => !disabledCategories.includes(key));
    grid.innerHTML = '';
    if (!availableCategories.length) return;
    if (disabledCategories.includes(STATE.category)) {
        STATE.category = availableCategories[0][0];
        document.getElementById('categorySelect').value = STATE.category;
    }
    availableCategories.forEach(([key, cat]) => {
        const div = document.createElement('div');
        div.className = `category-card ${key === STATE.category ? 'active' : ''}`;
        div.onclick = () => {
            STATE.category = key;
            document.getElementById('categorySelect').value = key;
            renderCategories();
            renderGuide();
            renderSpecsFields();
        };
        div.innerHTML = `
            <div class="category-icon">${cat.icon}</div>
            <div class="category-name">${STATE.lang === 'ar' ? cat.nameAr : cat.nameEn}</div>
        `;
        grid.appendChild(div);
    });
}

// ═══ GUIDE ═══
function renderGuide() {
    const grid = document.getElementById('guideGrid');
    const cat = CATEGORIES[STATE.category];
    if (!cat) return;

    grid.innerHTML = '';
    cat.guides.forEach(guide => {
        const div = document.createElement('div');
        div.className = 'guide-card';
        div.innerHTML = `
            <div class="guide-icon">${guide.icon}</div>
            <h3>${STATE.lang === 'ar' ? guide.titleAr : guide.titleEn}</h3>
            <p>${STATE.lang === 'ar' ? guide.descAr : guide.descEn}</p>
        `;
        grid.appendChild(div);
    });
}

// ═══ CURRENCY ═══
function updateCurrency() {
    const c = COUNTRIES[STATE.country];
    document.getElementById('currencySymbol').textContent = c.currency;
    document.getElementById('currencyName').textContent = STATE.lang === 'ar' ? c.currencyName : c.currencyEn;
}

// ═══ FILE HANDLING ═══
function openCamera() {
    if (!STATE.features.camera) {
        showToast('info', getText('cameraDisabled'));
        return;
    }
    document.getElementById('cameraInput').click();
}

function handleFiles(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    triggerSessionAd('upload');

    const maxSize = CONFIG.maxFileSize;
    const allowed = CONFIG.allowedTypes;
    const validFiles = files.filter(f => {
        if (f.size > maxSize) { showToast('error', getText('errFileSize')); return false; }
        if (!allowed.includes(f.type)) { showToast('error', getText('errFileType')); return false; }
        return true;
    }).slice(0, 5);

    if (!validFiles.length) return;

    STATE.images = [];
    const previewSection = document.getElementById('previewSection');
    const previewWrapper = previewSection.querySelector('.preview-wrapper')?.parentElement;
    if (previewWrapper) previewWrapper.innerHTML = '';

    let loaded = 0;
    validFiles.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = { file, dataUrl: e.target.result, compressed: null };
            STATE.images.push(imageData);

            compressAndPrepareImage(e.target.result).then(compressed => {
                imageData.compressed = compressed;
            }).catch(() => { imageData.compressed = e.target.result; });

            const wrapper = document.createElement('div');
            wrapper.className = 'preview-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.style.margin = '4px';
            wrapper.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${idx + 1}" style="max-width:160px;max-height:160px;border-radius:12px;border:2px solid var(--border-glass);object-fit:cover;">
                <button onclick="removeImage(${idx})" style="position:absolute;top:-6px;${STATE.lang === 'ar' ? 'left' : 'right'}:-6px;width:22px;height:22px;border-radius:50%;background:var(--accent-red);color:#fff;border:none;font-size:14px;cursor:pointer;line-height:22px;text-align:center;">×</button>
            `;
            if (previewWrapper) previewWrapper.appendChild(wrapper);

            loaded++;
            if (loaded === validFiles.length) {
                STATE.image = validFiles[0];
                STATE.imageDataUrl = STATE.images[0].dataUrl;
                previewSection.classList.add('active');
                document.getElementById('priceSection').classList.add('active');
                document.getElementById('scannerCard').classList.add('active');
                showToast('success', STATE.lang === 'ar' ? `✅ تم رفع ${validFiles.length} صور بنجاح` : `✅ ${validFiles.length} images uploaded`);
            }
        };
        reader.readAsDataURL(file);
    });
}

function removeImage(idx) {
    if (typeof idx === 'number' && STATE.images[idx]) {
        STATE.images.splice(idx, 1);
    } else {
        STATE.images = [];
    }
    STATE.image = STATE.images.length ? STATE.images[0].file : null;
    STATE.imageDataUrl = STATE.images.length ? STATE.images[0].dataUrl : '';

    if (!STATE.images.length) {
        STATE.image = null;
        STATE.imageDataUrl = '';
        document.getElementById('previewSection').classList.remove('active');
        document.getElementById('priceSection').classList.remove('active');
        document.getElementById('scannerCard').classList.remove('active');
    }
    document.getElementById('fileInput').value = '';
    document.getElementById('cameraInput').value = '';

    if (STATE.images.length) {
        const previewWrapper = document.getElementById('previewSection').querySelector('[style*="text-align:center"]') || document.getElementById('previewSection');
        const container = previewWrapper.querySelector('div') || previewWrapper;
        container.innerHTML = '';
        STATE.images.forEach((img, i) => {
            const div = document.createElement('div');
            div.className = 'preview-wrapper';
            div.style.cssText = 'position:relative;display:inline-block;margin:4px;';
            div.innerHTML = `
                <img src="${img.dataUrl}" alt="Preview ${i + 1}" style="max-width:160px;max-height:160px;border-radius:12px;border:2px solid var(--border-glass);object-fit:cover;">
                <button onclick="removeImage(${i})" style="position:absolute;top:-6px;${STATE.lang === 'ar' ? 'left' : 'right'}:-6px;width:22px;height:22px;border-radius:50%;background:var(--accent-red);color:#fff;border:none;font-size:14px;cursor:pointer;line-height:22px;text-align:center;">×</button>
            `;
            container.appendChild(div);
        });
    }
}

// ═══ DAILY LIMIT ═══
function checkDailyLimit() {
    const today = new Date().toDateString();
    if (STATE.lastScanDate !== today) {
        STATE.dailyScans = 0;
        STATE.lastScanDate = today;
        localStorage.setItem('valo_scan_date', today);
        localStorage.setItem('valo_scans', '0');
    }
}

function incrementScan() {
    STATE.dailyScans++;
    localStorage.setItem('valo_scans', STATE.dailyScans.toString());
}

// ═══ ANALYSIS ═══
async function startAnalysis() {
    if (!STATE.images.length && (!STATE.image || !STATE.imageDataUrl)) {
        showToast('error', getText('errNoImage'));
        return;
    }
    if (STATE.isAnalyzing) return;

    triggerSessionAd('scan');

    const dailyLimit = window.APP_CONFIG.limits.daily_limit || CONFIG.defaultLimit || 50;
    if (STATE.dailyScans >= dailyLimit) {
        showToast('error', getText('errDailyLimit'));
        return;
    }

    STATE.isAnalyzing = true;
    const analyzeBtn = document.getElementById('analyzeBtn');
    analyzeBtn.disabled = true;

    const overlay = document.getElementById('loadingOverlay');
    const statuses = [
        STATE.lang === 'ar' ? 'يتم ضغط وتحميل الصور' : 'Compressing & uploading images',
        STATE.lang === 'ar' ? 'الخبير يحلل الصور' : 'Expert analyzing images',
        STATE.lang === 'ar' ? 'يقارن بأسعار السوق' : 'Comparing market prices',
        STATE.lang === 'ar' ? 'يُجهز التقرير النهائي' : 'Preparing final report',
    ];

    overlay.classList.add('active');

    try {
        document.getElementById('loadingText').textContent = getText('loadingUpload');
        document.getElementById('loadingStatus').textContent = statuses[0];
        document.getElementById('loadingBar').style.width = '15%';

        const imagesToCompress = STATE.images.length ? STATE.images.map(i => i.compressed || i.dataUrl) : [STATE.imageDataUrl];
        STATE.compressedImages = await Promise.all(imagesToCompress.map(url => url.startsWith('data:') && !url.includes('compressed') ? compressAndPrepareImage(url) : Promise.resolve(url)));

        const analysisPromise = requestAnalysis();

        for (let i = 1; i < 4; i++) {
            document.getElementById('loadingText').textContent = getText(['loadingAnalyze', 'loadingCompare', 'loadingFinal'][i - 1]);
            document.getElementById('loadingStatus').textContent = statuses[i];
            document.getElementById('loadingBar').style.width = `${15 + i * 28}%`;
            await sleep(400);
        }

        const result = await analysisPromise;
        displayResults(result);
        incrementScan();
    } catch (error) {
        console.error(error);
        const msg = error.message || getText('errAnalyze');
        showToast('error', msg);
    } finally {
        overlay.classList.remove('active');
        STATE.isAnalyzing = false;
        analyzeBtn.disabled = false;
    }
}

async function requestAnalysis() {
    const images = STATE.compressedImages.length ? STATE.compressedImages : [STATE.imageDataUrl];
    const imageDataUrl = images[0] || STATE.imageDataUrl;
    const mimeType = imageDataUrl.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
    const base64 = (imageDataUrl.split(',')[1] || '').trim();
    if (!base64) throw new Error('No image data');

    const categoryName = (CATEGORIES[STATE.category] || {}).nameEn || STATE.category;
    const notes = document.getElementById('notesInput')?.value.trim() || '';
    const price = parseFloat(document.getElementById('priceInput')?.value) || 0;
    const specs = collectSpecs();

    const analysisText = await callGeminiAPI({ base64, mimeType }, STATE.category, categoryName, { notes, price, specs, country: STATE.country });

    const parsed = parseGeminiResponse(analysisText);
    parsed.currency = (COUNTRIES[STATE.country] || {}).currency || 'EGP';
    return parsed;
}

// ═══ GEMINI API DIRECT INTEGRATION ═══
function buildPrompt(category, categoryName, extras) {
    const base = `You are an expert used-item evaluator. Analyze the attached image and return a SINGLE valid JSON object (no markdown, no code fences, no extra text) with EXACTLY this structure:

{
  "overall_condition_score": <number 0-100>,
  "condition_label": "<Excellent|Good|Fair|Poor>",
  "fair_price": <number>,
  "market_min_price": <number>,
  "market_max_price": <number>,
  "total_estimated_repair_cost": <number>,
  "total_recommended_deduction": <number>,
  "fair_price_after_deductions": <number>,
  "device_title": "<detected item name/model>",
  "summary": "<2-3 sentence Arabic summary>",
  "defects_analysis": [
    {
      "defect_name": "<Arabic name>",
      "severity": "<high|medium|low>",
      "details": "<Arabic description>",
      "estimated_repair_cost": <number>,
      "recommended_price_deduction": <number>
    }
  ],
  "pros": ["<Arabic pro 1>", "<Arabic pro 2>"],
  "cons": ["<Arabic con 1>", "<Arabic con 2>"],
  "checked_visually": ["<Arabic item checked>"],
  "unchecked_requires_manual": ["<Arabic item needing manual check>"],
  "recommendation": "<Arabic final recommendation>",
  "red_flags": ["<Arabic red flag if any>"]
}

RULES:
- All text fields MUST be in Arabic.
- Return ONLY the JSON object. No markdown fences, no explanation.
- If the image is unclear, still provide your best estimate with lower confidence scores.
- base64_encode the image data inline in the request.`;

    const categoryHints = {
        phone: 'Focus on: screen condition, body scratches, battery health, camera, ports, buttons, water damage signs.',
        laptop: 'Focus on: screen, keyboard, trackpad, ports, hinges, battery, CPU/GPU specs visible, chassis condition.',
        car: 'Focus on: body panels, paint, tires, interior, odometer, engine bay, lights, glass, rust.',
        scooter: 'Focus on: body, tires, battery, motor, display, lights, brakes, charging port.',
        fridge: 'Focus on: exterior dents, interior cleanliness, seal condition, compressor noise, frost, energy label.',
        ac: 'Focus on: unit condition, filters, refrigerant, wiring, outdoor unit, noise level.',
        washer: 'Focus on: drum condition, door seal, controls, hoses, vibration, noise.',
        pc: 'Focus on: case condition, monitor, ports, PSU, cable management, component condition.',
        other: 'Focus on: overall condition, visible wear, any defects, brand/model identification.',
    };

    const specHint = extras.specs ? `\nUser-provided specs: ${JSON.stringify(extras.specs)}` : '';
    const notesHint = extras.notes ? `\nUser notes: ${extras.notes}` : '';
    const priceHint = extras.price > 0 ? `\nListed price: ${extras.price} (evaluate if it's a fair deal)` : '';
    const catHint = categoryHints[category] || categoryHints.other;

    return `${base}\n\nCategory: ${categoryName}\nCategory-specific focus: ${catHint}${specHint}${notesHint}${priceHint}`;
}

function sanitizeResponse(text) {
    if (!text) return '';
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/m, '');
    text = text.replace(/\*\*/g, '').replace(/\n{3,}/g, '\n\n');
    return text.trim();
}

async function callGeminiAPI(imageData, category, categoryName, extras) {
    if (!navigator.onLine) throw new Error('لا يوجد اتصال بالإنترنت. تحقق من شبكتة وحاول مرة أخرى.');

    const apiKeys = CONFIG.gemini.keys.filter(k => k.active !== false).map(k => k.key);
    if (apiKeys.length === 0) {
        throw new Error('لا توجد مفاتيح API نشطة. يرجى الإعداد في لوحة التحكم.');
    }

    const prompt = buildPrompt(category, categoryName, extras);
    const parts = [
        { text: prompt },
        { inline_data: { mime_type: imageData.mimeType, data: imageData.base64 } }
    ];

    const models = CONFIG.gemini.models;
    let lastError;

    for (const model of models) {
        for (const apiKey of apiKeys) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 60000);
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts }],
                        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
                    }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    if (response.status === 429 || response.status === 403) continue;
                    throw new Error(err.error?.message || `API error: ${response.status}`);
                }

                const result = await response.json();
                const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) throw new Error('No response text from Gemini');
                return text;
            } catch (e) {
                lastError = e;
                if (e.name === 'AbortError') {
                    lastError = new Error('انتهت مهلة الاتصال. حاول مرة أخرى.');
                }
                continue;
            }
        }
    }
    throw lastError || new Error('جميع مفاتيح API غير نشطة أو غير متاحة');
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
    } catch (e) {
        const fallbackScore = 50;
        const priceMatch = cleaned.match(/(\d[\d,\.]*)/);
        return {
            overall_condition_score: fallbackScore,
            condition_label: 'Fair',
            fair_price: priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0,
            market_min_price: 0,
            market_max_price: 0,
            total_estimated_repair_cost: 0,
            total_recommended_deduction: 0,
            fair_price_after_deductions: 0,
            device_title: '',
            summary: cleaned.substring(0, 500),
            defects_analysis: [],
            pros: [],
            cons: [],
            checked_visually: [],
            unchecked_requires_manual: [],
            recommendation: cleaned.substring(0, 500),
            red_flags: [],
            _rawText: cleaned,
        };
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══ DISPLAY RESULTS ═══
function displayResults(data) {
    const section = document.getElementById('resultsSection');
    const isAr = STATE.lang === 'ar';
    const c = COUNTRIES[STATE.country];
    const price = parseFloat(document.getElementById('priceInput').value) || 0;
    STATE.lastResult = data;

    let existingFallback = section.querySelector('.fallback-banner');
    if (existingFallback) existingFallback.remove();
    if (data._fallback) {
        const banner = document.createElement('div');
        banner.className = 'fallback-banner';
        banner.style.cssText = 'background:#fff3cd;border:1px solid #ffc107;border-radius:10px;padding:12px 18px;margin-bottom:16px;display:flex;align-items:center;gap:10px;';
        banner.innerHTML = '<span style="font-size:20px;">⚠️</span><div><strong style="color:#856404;">' + (isAr ? 'نتائج تقديرية مؤقتة' : 'Fallback Estimation') + '</strong><div style="font-size:12px;color:#856404;margin-top:2px;">' + (data._message || (isAr ? 'تم توليد هذه النتائج بشكل تقديري — أعد المحاولة للحصول على تحليل AI كامل.' : 'Generated as a fallback — retry for a full AI analysis.')) + '</div></div>';
        section.insertBefore(banner, section.firstChild);
    }

    const score = Math.min(100, Math.max(0, Number(data.overall_condition_score || data.condition_score || 0)));
    const fairPrice = Number(data.fair_price || data.pricing?.fair_price || 0);
    const minPrice = Number(data.market_min_price || data.pricing?.market_min_price || 0);
    const maxPrice = Number(data.market_max_price || data.pricing?.market_max_price || 0);
    const currency = data.currency || c.currency;
    const diff = price > 0 ? price - fairPrice : 0;
    const totalRepair = Number(data.total_estimated_repair_cost || 0);
    const totalDeduction = Number(data.total_recommended_deduction || 0);
    const fairAfterDeductions = Number(data.fair_price_after_deductions || 0);

    let statusText, statusClass, statusIcon, gaugeClass;
    if (score >= 75) {
        statusText = isAr ? 'صفقة ممتازة!' : 'Great Deal!';
        statusClass = 'good'; statusIcon = '✅'; gaugeClass = 'good';
    } else if (score >= 50) {
        statusText = isAr ? 'حالة جيدة' : 'Fair Condition';
        statusClass = 'fair'; statusIcon = '⚖️'; gaugeClass = 'fair';
    } else {
        statusText = isAr ? 'احذر من هذا المنتج' : 'Be Careful';
        statusClass = 'bad'; statusIcon = '⚠️'; gaugeClass = 'bad';
    }

    const statusEl = document.getElementById('resultStatus');
    statusEl.className = `result-status ${statusClass}`;
    document.getElementById('resultIcon').textContent = statusIcon;
    document.getElementById('resultText').textContent = statusText;

    document.getElementById('gaugeValue').textContent = `${score}%`;
    const fill = document.getElementById('gaugeFill');
    fill.className = `gauge-fill ${gaugeClass}`;
    fill.style.width = '0%';
    setTimeout(() => fill.style.width = `${score}%`, 100);

    document.getElementById('fairPrice').innerHTML = `${fairPrice.toLocaleString()} ${currency}`;
    document.getElementById('listedPrice').textContent = price > 0 ? `${price.toLocaleString()} ${currency}` : `--- ${currency}`;
    const savingsEl = document.getElementById('savingsPrice');
    if (diff > 0) {
        savingsEl.textContent = `+${diff.toLocaleString()} ${currency}`;
        savingsEl.style.color = 'var(--accent-red)';
    } else if (diff < 0) {
        savingsEl.textContent = `${diff.toLocaleString()} ${currency}`;
        savingsEl.style.color = 'var(--accent-green)';
    } else {
        savingsEl.textContent = `--- ${currency}`;
        savingsEl.style.color = 'var(--text-secondary)';
    }

    // Price spectrum bar
    const existingSpectrum = section.querySelector('.spectrum-bar-container');
    if (existingSpectrum) existingSpectrum.remove();
    if (minPrice > 0 && maxPrice > 0) {
        const range = maxPrice - minPrice || 1;
        const fairPct = Math.max(0, Math.min(100, ((fairPrice - minPrice) / range) * 100));
        const pricePct = price > 0 ? Math.max(0, Math.min(100, ((price - minPrice) / range) * 100)) : -1;
        const spectrumHTML = `
            <div class="spectrum-bar-container">
                <div class="spectrum-bar-header">
                    <div class="spectrum-bar-title">${isAr ? 'مدى الأسعار في السوق' : 'Market Price Range'}</div>
                </div>
                <div class="spectrum-bar-track">
                    <div class="spectrum-marker fair" style="left:${fairPct}%">
                        <div class="spectrum-marker-label fair">${isAr ? 'العادل' : 'Fair'}: ${fairPrice.toLocaleString()}</div>
                    </div>
                    ${pricePct >= 0 ? `<div class="spectrum-marker price" style="left:${pricePct}%">
                        <div class="spectrum-marker-label price">${isAr ? 'المعروض' : 'Listed'}: ${price.toLocaleString()}</div>
                    </div>` : ''}
                </div>
                <div class="spectrum-minmax">
                    <span class="min">${minPrice.toLocaleString()} ${currency}</span>
                    <span class="max">${maxPrice.toLocaleString()} ${currency}</span>
                </div>
            </div>`;
        const priceComparison = section.querySelector('.price-comparison');
        if (priceComparison) priceComparison.insertAdjacentHTML('afterend', spectrumHTML);
    }

    // Detected model
    const detailsContainer = document.getElementById('analysisDetails');
    const existingH3 = detailsContainer.querySelector('h3');
    detailsContainer.innerHTML = '';
    if (existingH3) detailsContainer.appendChild(existingH3);
    if (data.device_title || data.detected_model) {
        const item = document.createElement('div');
        item.className = 'detail-item';
        item.innerHTML = `<span class="detail-icon">🏷️</span><div class="detail-text"><strong>${isAr ? 'الجهاز المكتشف' : 'Detected Model'}:</strong> ${escapeHtml(data.device_title || data.detected_model)}</div>`;
        detailsContainer.appendChild(item);
    }

    if (fairAfterDeductions > 0) {
        const afterItem = document.createElement('div');
        afterItem.className = 'detail-item';
        afterItem.innerHTML = `<span class="detail-icon">💰</span><div class="detail-text"><strong>${isAr ? 'السعر بعد خصم الإصلاح' : 'Price After Deductions'}:</strong> <span style="color:var(--accent-green);font-weight:700;">${fairAfterDeductions.toLocaleString()} ${currency}</span></div>`;
        detailsContainer.appendChild(afterItem);
    }

    // Checked / Unchecked panels
    let splitPanels = section.querySelector('.split-panels');
    if (!splitPanels) {
        splitPanels = document.createElement('div');
        splitPanels.className = 'split-panels';
        const priceComp = section.querySelector('.price-comparison');
        if (priceComp && priceComp.nextSibling) priceComp.parentNode.insertBefore(splitPanels, priceComp.nextSibling);
        else detailsContainer.parentNode.insertBefore(splitPanels, detailsContainer);
    }
    const checked = data.checked_visually || [];
    const unchecked = data.unchecked_requires_manual || [];
    splitPanels.innerHTML = `
        <div class="split-panel checked">
            <h4>✅ ${isAr ? 'تم فحصه بالصور' : 'Checked Visually'}</h4>
            <ul>${checked.length ? checked.map(i => `<li>${escapeHtml(i)}</li>`).join('') : `<li>${isAr ? '—' : '—'}</li>`}</ul>
        </div>
        <div class="split-panel unchecked">
            <h4>🔍 ${isAr ? 'يتطلب فحص يدوي' : 'Requires Manual Check'}</h4>
            <ul>${unchecked.length ? unchecked.map(i => `<li>${escapeHtml(i)}</li>`).join('') : `<li>${isAr ? '—' : '—'}</li>`}</ul>
        </div>`;

    // Pros / Cons
    let prosCons = section.querySelector('.pros-cons');
    if (!prosCons) {
        prosCons = document.createElement('div');
        prosCons.className = 'pros-cons';
        splitPanels.parentNode.insertBefore(prosCons, splitPanels.nextSibling);
    }
    const pros = data.pros || [];
    const cons = data.cons || [];
    prosCons.innerHTML = `
        <div class="pros-box"><h4>👍 ${isAr ? 'نقاط القوة' : 'Pros'}</h4><ul>${pros.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul></div>
        <div class="cons-box"><h4>👎 ${isAr ? 'نقاط الضعف' : 'Cons'}</h4><ul>${cons.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul></div>`;

    // Verdict
    let verdictBox = section.querySelector('.verdict-box');
    if (!verdictBox) {
        verdictBox = document.createElement('div');
        verdictBox.className = 'verdict-box';
        prosCons.parentNode.insertBefore(verdictBox, prosCons.nextSibling);
    }
    verdictBox.innerHTML = `<p>${escapeHtml(data.verdict || (isAr ? 'راجع التفاصيل أعلاه.' : 'Review details above.'))}</p>`;

    // Actionable advice (replaces expert tip)
    document.getElementById('expertTipContent').textContent = data.actionable_advice || (isAr ? 'راجع النتيجة وتحقق يدويًا.' : 'Review and verify manually.');

    // Defects Analysis
    const defectsPanel = document.getElementById('defectsPanel');
    const defectsList = document.getElementById('defectsList');
    defectsList.innerHTML = '';
    const defectsAnalysis = Array.isArray(data.defects_analysis) ? data.defects_analysis : [];
    if (defectsAnalysis.length) {
        if (totalRepair > 0 || totalDeduction > 0) {
            const summary = document.createElement('div');
            summary.style.cssText = 'display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap;';
            summary.innerHTML = '<div style="flex:1;min-width:140px;background:rgba(213,0,0,0.06);border-radius:8px;padding:10px 14px;"><div style="font-size:11px;color:var(--text-secondary);">' + (isAr ? 'إجمالي تكلفة الإصلاح' : 'Total Repair Cost') + '</div><div style="font-size:18px;font-weight:800;color:var(--accent-red);">' + totalRepair.toLocaleString() + ' ' + currency + '</div></div>' + '<div style="flex:1;min-width:140px;background:rgba(230,81,0,0.06);border-radius:8px;padding:10px 14px;"><div style="font-size:11px;color:var(--text-secondary);">' + (isAr ? 'الخصم الموصى به' : 'Recommended Deduction') + '</div><div style="font-size:18px;font-weight:800;color:#e65100;">' + totalDeduction.toLocaleString() + ' ' + currency + '</div></div>';
            defectsList.appendChild(summary);
        }
        defectsAnalysis.forEach(d => {
            const name = String(d?.defect_name || '—').trim();
            const sev = String(d?.severity || 'متوسط').trim();
            const cost = Number(d?.estimated_repair_cost || 0);
            const deduction = Number(d?.recommended_price_deduction || 0);
            const details = String(d?.details || '').trim();
            const sevColor = sev.includes('عالي') || sev.includes('high') || sev.includes('جسيم') ? 'var(--accent-red)' : sev.includes('متوسط') || sev.includes('medium') ? '#e65100' : 'var(--accent-green)';
            const item = document.createElement('div');
            item.className = 'defect-item';
            item.style.cssText = 'padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;flex-direction:column;gap:4px;';
            item.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;"><span style="font-weight:600;">⚠️ ' + escapeHtml(name) + '</span><span style="font-size:11px;font-weight:700;color:' + sevColor + ';background:' + sevColor + '15;padding:2px 8px;border-radius:4px;">' + escapeHtml(sev) + '</span></div>' + '<div style="display:flex;gap:16px;font-size:12px;color:var(--text-secondary);flex-wrap:wrap;"><span>' + (isAr ? 'تكلفة الإصلاح' : 'Repair') + ': <strong style="color:var(--accent-red);">' + cost.toLocaleString() + ' ' + currency + '</strong></span><span>' + (isAr ? 'الخصم الموصى به' : 'Deduction') + ': <strong style="color:#e65100;">' + deduction.toLocaleString() + ' ' + currency + '</strong></span></div>' + (details ? '<div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">' + escapeHtml(details) + '</div>' : '');
            defectsList.appendChild(item);
        });
        defectsPanel.style.display = 'block';
    } else {
        defectsPanel.style.display = 'none';
    }

    applyFeatureVisibility();
    section.classList.add('active');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    updateStats();
}

function updateStats() {
    // Update scan count display
    const scans = 50000 + STATE.dailyScans * 100;
    document.getElementById('statScans').textContent = scans >= 1000000 
        ? (scans / 1000000).toFixed(1) + 'M+' 
        : (scans / 1000).toFixed(0) + 'K+';
}

function resetApp() {
    STATE.images = [];
    STATE.compressedImages = [];
    removeImage();
    document.getElementById('priceInput').value = '';
    document.getElementById('notesInput').value = '';
    document.getElementById('inspectionStatus').value = 'unknown';
    const section = document.getElementById('resultsSection');
    section.classList.remove('active');
    document.getElementById('defectsPanel').style.display = 'none';
    const fb = section.querySelector('.fallback-banner');
    if (fb) fb.remove();
    STATE.lastResult = null;
    applyFeatureVisibility();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══ TOAST ═══
function showToast(type, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-text">${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ═══ ADS ═══
function loadAds() {
    try {
        const ads = window.APP_CONFIG.ads || [];
        const staticAds = ads.filter(a => a.active && a.type !== 'upload' && a.type !== 'scan');
        ['ad0', 'ad1', 'ad2'].forEach((key, i) => {
            const el = document.getElementById(`adBox${i}`);
            if (!el) return;
            if (staticAds[i]) {
                const ad = staticAds[i];
                const safeLink = getSafeUrl(ad.link);
                el.innerHTML = `
                    <a href="${safeLink}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none;">
                        <div style="font-size:16px;font-weight:700;margin-bottom:4px;">${escapeHtml(ad.title)}</div>
                        <div style="font-size:12px;">${escapeHtml(ad.desc || '')}</div>
                    </a>
                `;
                el.style.border = '1px solid var(--accent-green)';
            } else {
                const legacyData = localStorage.getItem(`valo_${key}`);
                if (legacyData) {
                    const ad = JSON.parse(legacyData);
                    const safeLink = getSafeUrl(ad.link);
                    el.innerHTML = `
                        <a href="${safeLink}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none;">
                            <div style="font-size:16px;font-weight:700;margin-bottom:4px;">${escapeHtml(ad.title)}</div>
                            <div style="font-size:12px;">${escapeHtml(ad.desc || '')}</div>
                        </a>
                    `;
                    el.style.border = '1px solid var(--accent-green)';
                }
            }
        });

        const adsEnabled = STATE.features.ads;
        ['adSpace0', 'adSpace1', 'adSpace2', 'adSpace3'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = adsEnabled ? 'block' : 'none';
        });
    } catch (e) { /* silent */ }
}

function buildPdfReportHTML(data) {
    const isAr = STATE.lang === 'ar';
    const c = COUNTRIES[STATE.country];
    const price = parseFloat(document.getElementById('priceInput').value) || 0;
    const score = Number(data.overall_condition_score || data.condition_score || 0);
    const fairPrice = Number(data.fair_price || 0);
    const minPrice = Number(data.market_min_price || 0);
    const maxPrice = Number(data.market_max_price || 0);
    const currency = data.currency || c.currency;
    const totalRepair = Number(data.total_estimated_repair_cost || 0);
    const totalDeduction = Number(data.total_recommended_deduction || 0);
    const fairAfterDeductions = Number(data.fair_price_after_deductions || 0);
    const diff = price > 0 ? price - fairPrice : 0;
    const deviceTitle = data.device_title || data.detected_model || '—';
    const dateStr = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const catName = isAr ? (CATEGORIES[STATE.category] || {}).nameAr : (CATEGORIES[STATE.category] || {}).nameEn;
    const modeLabel = STATE.mode === 'buy' ? (isAr ? 'شراء' : 'Buy') : (isAr ? 'بيع' : 'Sell');
    const pad = isAr ? 'right' : 'left';

    const defects = Array.isArray(data.defects_analysis) ? data.defects_analysis : [];
    const defectsTableRows = defects.length > 0
        ? defects.map(d => {
            const name = escapeHtml(String(d?.defect_name || '—').trim());
            const sev = String(d?.severity || 'متوسط').trim();
            const cost = Number(d?.estimated_repair_cost || 0);
            const deduction = Number(d?.recommended_price_deduction || 0);
            const details = escapeHtml(String(d?.details || '').trim());
            const sevColor = (sev.includes('عالي') || sev.includes('high') || sev.includes('جسيم')) ? '#e53e3e' : (sev.includes('متوسط') || sev.includes('medium')) ? '#dd6b20' : '#38a169';
            const sevLabel = (sev.includes('عالي') || sev.includes('high') || sev.includes('جسيم')) ? 'شديد' : (sev.includes('متوسط') || sev.includes('medium')) ? 'متوسط' : (sev.includes('بسيط') || sev.includes('low')) ? 'طفيف' : sev;
            return '<tr style="border-bottom:1px solid #e2e8f0;">' +
                '<td style="padding:10px;font-weight:bold;color:#2d3748;">' + name + (details ? '<div style="font-weight:normal;font-size:11px;color:#718096;margin-top:2px;">' + details + '</div>' : '') + '</td>' +
                '<td style="padding:10px;"><span style="color:' + sevColor + ';font-weight:bold;">' + escapeHtml(sevLabel) + '</span></td>' +
                '<td style="padding:10px;color:#e53e3e;font-weight:bold;text-align:center;">' + cost.toLocaleString() + ' ' + currency + '</td>' +
                '<td style="padding:10px;color:#2b6cb0;font-weight:bold;text-align:center;">' + deduction.toLocaleString() + ' ' + currency + '</td>' +
                '</tr>';
        }).join('')
        : '<tr><td colspan="4" style="padding:15px;text-align:center;color:#38a169;">✅ ' + (isAr ? 'لا توجد عيوب جوهرية مسجلة في الفحص الظاهري' : 'No major defects recorded') + '</td></tr>';

    const manualChecks = data.unchecked_requires_manual || [];
    const manualChecksList = manualChecks.length > 0
        ? manualChecks.map(pt => '<li style="margin-bottom:5px;">' + escapeHtml(pt) + '</li>').join('')
        : '<li>' + (isAr ? 'فحص شامل للأجزاء الداخلية يدويًا.' : 'Full manual internal inspection.') + '</li>';

    const checkedItems = data.checked_visually || [];
    const checkedList = checkedItems.length > 0
        ? checkedItems.map(pt => '<li style="margin-bottom:5px;color:#276749;">✅ ' + escapeHtml(pt) + '</li>').join('')
        : '<li style="color:#718096;">—</li>';

    const prosItems = data.pros || [];
    const prosList = prosItems.length > 0
        ? prosItems.map(p => '<li style="margin-bottom:5px;color:#276749;">👍 ' + escapeHtml(p) + '</li>').join('')
        : '<li style="color:#718096;">—</li>';

    const consItems = data.cons || [];
    const consList = consItems.length > 0
        ? consItems.map(p => '<li style="margin-bottom:5px;color:#c53030;">👎 ' + escapeHtml(p) + '</li>').join('')
        : '<li style="color:#718096;">—</li>';

    const scoreColor = score >= 75 ? '#22543d' : score >= 50 ? '#c05621' : '#c53030';

    return '<div style="font-family:Cairo,Segoe UI,sans-serif;direction:' + (isAr ? 'rtl' : 'ltr') + ';padding:20px;color:#1a202c;background:#ffffff;">' +

        // ── الهيدر ──
        '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #00c853;padding-bottom:12px;margin-bottom:20px;">' +
            '<div>' +
                '<h1 style="margin:0;color:#00c853;font-size:26px;font-weight:800;">VALO Check</h1>' +
                '<p style="margin:3px 0 0;color:#718096;font-size:12px;">' + (isAr ? 'تقرير تقييم وفحص منتج مستعمل' : 'Used Item Inspection Report') + '</p>' +
            '</div>' +
            '<div style="text-align:' + (isAr ? 'left' : 'right') + ';">' +
                '<div style="background:#f7fafc;border:1px solid #e2e8f0;padding:6px 12px;border-radius:6px;font-size:12px;color:#4a5568;">📅 ' + dateStr + '</div>' +
                '<div style="font-size:11px;color:#718096;margin-top:4px;">' + escapeHtml(c.name) + ' · ' + escapeHtml(catName) + ' · ' + modeLabel + '</div>' +
            '</div>' +
        '</div>' +

        // ── الجهاز المكتشف ──
        '<div style="margin-bottom:16px;">' +
            '<div style="font-size:12px;color:#718096;margin-bottom:2px;">🏷️ ' + (isAr ? 'الجهاز المكتشف' : 'Detected Device') + '</div>' +
            '<div style="font-size:16px;font-weight:700;color:#1a202c;">' + escapeHtml(deviceTitle) + '</div>' +
        '</div>' +

        // ── تنبيه Fallback ──
        (data._fallback ? '<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#856404;">⚠️ ' + escapeHtml(data._message || (isAr ? 'النتائج تقديرية — تحقق يدويًا' : 'Fallback results — verify manually')) + '</div>' : '') +

        // ── كروت KPIs ──
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px;">' +
            '<div style="background:#f0fff4;border:1px solid #c6f6d5;padding:12px;border-radius:8px;text-align:center;">' +
                '<span style="font-size:11px;color:#276749;display:block;margin-bottom:4px;">' + (isAr ? 'درجة الجودة' : 'Condition') + '</span>' +
                '<strong style="font-size:20px;color:' + scoreColor + ';">' + score + '%</strong>' +
            '</div>' +
            '<div style="background:#ebf8ff;border:1px solid #bee3f8;padding:12px;border-radius:8px;text-align:center;">' +
                '<span style="font-size:11px;color:#2c5282;display:block;margin-bottom:4px;">' + (isAr ? 'السعر العادل' : 'Fair Price') + '</span>' +
                '<strong style="font-size:20px;color:#2b6cb0;">' + fairPrice.toLocaleString() + ' ' + currency + '</strong>' +
            '</div>' +
            '<div style="background:#edf2f7;border:1px solid #e2e8f0;padding:12px;border-radius:8px;text-align:center;">' +
                '<span style="font-size:11px;color:#4a5568;display:block;margin-bottom:4px;">' + (isAr ? 'السعر المعروض' : 'Listed Price') + '</span>' +
                '<strong style="font-size:20px;color:#1a202c;">' + (price > 0 ? price.toLocaleString() + ' ' + currency : '—') + '</strong>' +
            '</div>' +
            '<div style="background:#fff5f5;border:1px solid #fed7d7;padding:12px;border-radius:8px;text-align:center;">' +
                '<span style="font-size:11px;color:#9b2c2c;display:block;margin-bottom:4px;">' + (isAr ? 'التوفير/الفرق' : 'Savings/Diff') + '</span>' +
                '<strong style="font-size:20px;color:' + (diff > 0 ? '#276749' : diff < 0 ? '#c53030' : '#718096') + ';">' + (diff > 0 ? '+' + diff.toLocaleString() : diff < 0 ? diff.toLocaleString() : '—') + ' ' + currency + '</strong>' +
            '</div>' +
        '</div>' +

        // ── نطاق الأسعار ──
        (minPrice > 0 || maxPrice > 0 ? '<div style="margin-bottom:20px;">' +
            '<h3 style="font-size:14px;margin-bottom:10px;color:#2d3748;border-right:4px solid #00c853;padding-right:8px;">📊 ' + (isAr ? 'نطاق الأسعار في السوق' : 'Market Price Range') + '</h3>' +
            '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
                '<tr style="background:#edf2f7;color:#2d3748;font-weight:bold;">' +
                    '<th style="padding:8px;border-bottom:2px solid #cbd5e0;text-align:center;">' + (isAr ? 'الحد الأدنى' : 'Min') + '</th>' +
                    '<th style="padding:8px;border-bottom:2px solid #cbd5e0;text-align:center;">' + (isAr ? 'العادل' : 'Fair') + '</th>' +
                    '<th style="padding:8px;border-bottom:2px solid #cbd5e0;text-align:center;">' + (isAr ? 'الحد الأعلى' : 'Max') + '</th>' +
                    '<th style="padding:8px;border-bottom:2px solid #cbd5e0;text-align:center;">' + (isAr ? 'بعد الخصم' : 'After Deductions') + '</th>' +
                '</tr>' +
                '<tr>' +
                    '<td style="padding:10px;text-align:center;font-weight:bold;color:#e53e3e;">' + minPrice.toLocaleString() + ' ' + currency + '</td>' +
                    '<td style="padding:10px;text-align:center;font-weight:bold;color:#2b6cb0;">' + fairPrice.toLocaleString() + ' ' + currency + '</td>' +
                    '<td style="padding:10px;text-align:center;font-weight:bold;color:#276749;">' + maxPrice.toLocaleString() + ' ' + currency + '</td>' +
                    '<td style="padding:10px;text-align:center;font-weight:bold;color:#c05621;">' + (fairAfterDeductions > 0 ? fairAfterDeductions.toLocaleString() + ' ' + currency : '—') + '</td>' +
                '</tr>' +
            '</table>' +
        '</div>' : '') +

        // ── جدول العيوب ──
        '<div style="margin-bottom:20px;">' +
            '<h3 style="font-size:14px;margin-bottom:10px;color:#2d3748;border-right:4px solid #e53e3e;padding-right:8px;">⚠️ ' + (isAr ? 'تحليل العيوب وتكلفة الإصلاح' : 'Defect Analysis & Repair Costs') + '</h3>' +
            '<table style="width:100%;border-collapse:collapse;font-size:12px;text-align:' + (isAr ? 'right' : 'left') + ';">' +
                '<thead><tr style="background:#edf2f7;color:#2d3748;font-weight:bold;">' +
                    '<th style="padding:8px;border-bottom:2px solid #cbd5e0;">' + (isAr ? 'العيب / الحالة' : 'Defect') + '</th>' +
                    '<th style="padding:8px;border-bottom:2px solid #cbd5e0;text-align:center;">' + (isAr ? 'الخطورة' : 'Severity') + '</th>' +
                    '<th style="padding:8px;border-bottom:2px solid #cbd5e0;text-align:center;">' + (isAr ? 'تكلفة الإصلاح' : 'Repair Cost') + '</th>' +
                    '<th style="padding:8px;border-bottom:2px solid #cbd5e0;text-align:center;">' + (isAr ? 'الخصم الموصى به' : 'Deduction') + '</th>' +
                '</tr></thead>' +
                '<tbody>' + defectsTableRows + '</tbody>' +
            '</table>' +
            (defects.length > 0 ? '<div style="display:flex;gap:12px;margin-top:10px;flex-wrap:wrap;">' +
                '<div style="flex:1;min-width:140px;background:#fff5f5;border:1px solid #fed7d7;border-radius:6px;padding:10px;text-align:center;">' +
                    '<div style="font-size:10px;color:#9b2c2c;">' + (isAr ? 'إجمالي تكلفة الإصلاح' : 'Total Repair') + '</div>' +
                    '<div style="font-size:18px;font-weight:800;color:#e53e3e;">' + totalRepair.toLocaleString() + ' ' + currency + '</div>' +
                '</div>' +
                '<div style="flex:1;min-width:140px;background:#fff5f5;border:1px solid #fed7d7;border-radius:6px;padding:10px;text-align:center;">' +
                    '<div style="font-size:10px;color:#9b2c2c;">' + (isAr ? 'إجمالي الخصم الموصى به' : 'Total Deduction') + '</div>' +
                    '<div style="font-size:18px;font-weight:800;color:#c53030;">' + totalDeduction.toLocaleString() + ' ' + currency + '</div>' +
                '</div>' +
            '</div>' : '') +
        '</div>' +

        // ── تم فحصه بالصور ──
        '<div style="margin-bottom:16px;">' +
            '<h4 style="font-size:13px;margin-bottom:8px;color:#276749;">✅ ' + (isAr ? 'تم فحصه بالصور' : 'Checked Visually') + '</h4>' +
            '<ul style="margin:0;padding-' + pad + ':18px;font-size:12px;color:#2d3748;">' + checkedList + '</ul>' +
        '</div>' +

        // ── الفحص اليدوي ──
        '<div style="background:#fffaf0;border:1px solid #fbd38d;padding:12px;border-radius:8px;margin-bottom:16px;">' +
            '<h4 style="margin:0 0 6px 0;font-size:13px;color:#c05621;">🔍 ' + (isAr ? 'نقاط يجب فحصها يدوياً قبل الشراء' : 'Manual Check Required Before Purchase') + '</h4>' +
            '<ul style="margin:0;padding-' + pad + ':18px;font-size:12px;color:#9c4221;">' + manualChecksList + '</ul>' +
        '</div>' +

        // ── الإيجابيات والسلبيات ──
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
            '<div style="background:#f0fff4;border:1px solid #c6f6d5;padding:12px;border-radius:8px;">' +
                '<h4 style="margin:0 0 6px 0;font-size:13px;color:#276749;">👍 ' + (isAr ? 'نقاط القوة' : 'Pros') + '</h4>' +
                '<ul style="margin:0;padding-' + pad + ':18px;font-size:12px;color:#2d3748;">' + prosList + '</ul>' +
            '</div>' +
            '<div style="background:#fff5f5;border:1px solid #fed7d7;padding:12px;border-radius:8px;">' +
                '<h4 style="margin:0 0 6px 0;font-size:13px;color:#c53030;">👎 ' + (isAr ? 'نقاط الضعف' : 'Cons') + '</h4>' +
                '<ul style="margin:0;padding-' + pad + ':18px;font-size:12px;color:#2d3748;">' + consList + '</ul>' +
            '</div>' +
        '</div>' +

        // ── النصيحة ──
        '<div style="background:#ebf8ff;border:1px solid #bee3f8;padding:12px;border-radius:8px;margin-bottom:16px;">' +
            '<h4 style="margin:0 0 6px 0;font-size:13px;color:#2c5282;">💡 ' + (isAr ? 'النصيحة التنفيذية للتفاوض' : 'Negotiation Advice') + '</h4>' +
            '<p style="margin:0;font-size:12px;line-height:1.7;color:#2d3748;">' + escapeHtml(data.actionable_advice || (isAr ? 'راجع النتيجة وتحقق يدويًا من النقاط الحساسة قبل إتمام العملية.' : 'Review and verify manually before closing the deal.')) + '</p>' +
        '</div>' +

        // ── النتيجة النهائية ──
        '<div style="background:#f0fff4;border:2px solid #00c853;border-radius:8px;padding:16px;text-align:center;margin-bottom:20px;">' +
            '<div style="font-size:14px;font-weight:700;color:#2d3748;margin-bottom:6px;">📋 ' + (isAr ? 'النتيجة النهائية' : 'Final Verdict') + '</div>' +
            '<div style="font-size:16px;font-weight:900;color:#22543d;">' + escapeHtml(data.verdict || '—') + '</div>' +
        '</div>' +

        // ── الفوتر ──
        '<div style="margin-top:30px;border-top:1px solid #e2e8f0;padding-top:10px;text-align:center;font-size:10px;color:#a0aec0;">' +
            'VALO Check — ' + (isAr ? 'فاحص القيمة الذكي' : 'Smart Value Inspector') + ' · ' + dateStr +
        '</div>' +
    '</div>';
}

function exportReportPdf() {
    if (!STATE.features.pdfReport) return;
    const data = STATE.lastResult;
    const isAr = STATE.lang === 'ar';

    if (!data || Object.keys(data).length === 0) {
        alert(isAr ? 'تنبيه: لا توجد بيانات فحص — يرجى إجراء الفحص أولاً.' : 'Warning: No scan data. Run a scan first.');
        return;
    }

    const reportContent = typeof buildPdfReportHTML === 'function' ? buildPdfReportHTML(data) : '';

    let printIframe = document.getElementById('print-pdf-iframe');
    if (!printIframe) {
        printIframe = document.createElement('iframe');
        printIframe.id = 'print-pdf-iframe';
        printIframe.style.display = 'none';
        document.body.appendChild(printIframe);
    }

    const doc = printIframe.contentWindow.document;
    doc.open();
    doc.write('<!DOCTYPE html><html dir="' + (isAr ? 'rtl' : 'ltr') + '" lang="' + (isAr ? 'ar' : 'en') + '"><head>' +
        '<meta charset="UTF-8">' +
        '<title>VALO Check Report</title>' +
        '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">' +
        '<style>' +
            '*{-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;}' +
            'body{font-family:Cairo,sans-serif !important;background:#fff;color:#000;padding:0;margin:0;direction:' + (isAr ? 'rtl' : 'ltr') + ';}' +
            '@page{size:A4;margin:15mm 10mm;}' +
            'table{width:100%;border-collapse:collapse;margin-bottom:20px;}' +
            'th,td{border:1px solid #cbd5e0;padding:12px;text-align:' + (isAr ? 'right' : 'left') + ';}' +
            'th{background:#f7fafc !important;font-weight:bold;color:#2d3748;}' +
            'td{color:#1a202c;}' +
            '.no-print{display:none !important;}' +
        '</style></head><body>' +
        reportContent +
        '</body></html>');
    doc.close();

    setTimeout(function() {
        printIframe.contentWindow.focus();
        printIframe.contentWindow.print();
    }, 500);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function stripHtml(value) {
    return String(value).replace(/<[^>]*>/g, '').trim();
}

function getSafeUrl(url) {
    try {
        const parsed = new URL(url, window.location.origin);
        return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '#';
    } catch (error) {
        return '#';
    }
}

// ═══ IMAGE COMPRESSION (M2) ═══
function compressImage(dataUrl, maxWidth, maxHeight, quality) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                let w = img.width;
                let h = img.height;
                if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
                if (h > maxHeight) { w = Math.round(w * maxHeight / h); h = maxHeight; }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const compressed = canvas.toDataURL('image/jpeg', quality);
                resolve(compressed);
            } catch (e) {
                resolve(dataUrl);
            }
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

async function compressAndPrepareImage(dataUrl) {
    try {
        let compressed = await compressImage(dataUrl, 1024, 1024, 0.82);
        const byteLength = Math.ceil((compressed.split(',')[1] || '').length * 3 / 4);
        if (byteLength > 300 * 1024) {
            compressed = await compressImage(dataUrl, 800, 800, 0.65);
        }
        const finalBytes = Math.ceil((compressed.split(',')[1] || '').length * 3 / 4);
        if (finalBytes > 300 * 1024) {
            compressed = await compressImage(dataUrl, 600, 600, 0.5);
        }
        return compressed;
    } catch (e) {
        return dataUrl;
    }
}

// ═══ BUYER ASSISTANT (M4) ═══
function runAssistant() {
    try {
        const budget = parseFloat(document.getElementById('assistantBudget').value) || 0;
        const category = document.getElementById('assistantCategory').value;
        const c = COUNTRIES[STATE.country];
        const cat = CATEGORIES[category];
        const resultDiv = document.getElementById('assistantResult');
        const listDiv = document.getElementById('assistantResultsList');

        const suggestions = generateAssistantSuggestions(category, budget, c);
        listDiv.innerHTML = '';
        suggestions.forEach(item => {
            const div = document.createElement('div');
            div.className = 'assistant-result-item';
            div.innerHTML = `
                <div>
                    <div class="assistant-result-name">${escapeHtml(item.name)}</div>
                    <div class="assistant-result-score">${escapeHtml(item.specs)}</div>
                </div>
                <div style="text-align:left;">
                    <div class="assistant-result-price">${item.price.toLocaleString()} ${c.currency}</div>
                    <div class="price-usd">${item.usd > 0 ? `≈ $${item.usd.toLocaleString()} USD` : ''}</div>
                </div>
            `;
            listDiv.appendChild(div);
        });
        resultDiv.classList.add('active');
    } catch (e) {
        showToast('error', STATE.lang === 'ar' ? 'حدث خطأ في المساعد' : 'Assistant error');
    }
}

function generateAssistantSuggestions(category, budget, currency) {
    const suggestions = {
        phone: [
            { name: 'iPhone 13 / 14', specs: '128GB - A15 Chip - Excellent', price: 12000, usd: 240 },
            { name: 'Samsung Galaxy S23', specs: '128GB - Snapdragon 8 Gen 2', price: 14000, usd: 280 },
            { name: 'Xiaomi 13T', specs: '256GB - Dimensity 8200', price: 9500, usd: 190 },
            { name: 'iPhone 12', specs: '64GB - A14 - Budget Pick', price: 8000, usd: 160 },
            { name: 'Samsung A54', specs: '128GB - Great Value', price: 7000, usd: 140 },
        ],
        laptop: [
            { name: 'MacBook Air M2', specs: '8GB RAM - 256GB SSD', price: 28000, usd: 560 },
            { name: 'Dell XPS 13', specs: 'i7 - 16GB RAM - 512GB', price: 25000, usd: 500 },
            { name: 'Lenovo ThinkPad T14', specs: 'i5 - 8GB RAM - 256GB', price: 15000, usd: 300 },
            { name: 'HP Pavilion', specs: 'i5 - 8GB - Budget', price: 12000, usd: 240 },
        ],
        car: [
            { name: 'Toyota Corolla 2020', specs: 'Auto - Low Mileage', price: 350000, usd: 7000 },
            { name: 'Hyundai Elantra 2021', specs: 'Auto - Good Condition', price: 280000, usd: 5600 },
            { name: 'Kia Rio 2019', specs: 'Manual - Economy', price: 180000, usd: 3600 },
        ],
        scooter: [
            { name: 'Xiaomi Mi Electric', specs: '30km Range - Lightweight', price: 8000, usd: 160 },
            { name: 'Segway Ninebot', specs: '45km Range - Premium', price: 12000, usd: 240 },
            { name: 'Generic E-Scooter', specs: '25km Range - Budget', price: 4500, usd: 90 },
        ],
        fridge: [
            { name: 'Samsung Double Door', specs: '360L - Inverter', price: 18000, usd: 360 },
            { name: 'LG Single Door', specs: '200L - Energy Star', price: 10000, usd: 200 },
            { name: 'Toshiba Chest', specs: '200L - Deep Freeze', price: 12000, usd: 240 },
        ],
        ac: [
            { name: 'Carrier 1.5 Ton', specs: 'Inverter - Quiet', price: 15000, usd: 300 },
            { name: 'Samsung WindFree', specs: '1.5 Ton - Premium', price: 20000, usd: 400 },
            { name: 'General 1 Ton', specs: 'Non-Inverter - Budget', price: 8000, usd: 160 },
        ],
        washer: [
            { name: 'Samsung Front Load', specs: '8KG - Digital Inverter', price: 16000, usd: 320 },
            { name: 'LG Top Load', specs: '7KG - TurboWash', price: 12000, usd: 240 },
            { name: 'Bosch Front Load', specs: '6KG - EcoSilence', price: 14000, usd: 280 },
        ],
        pc: [
            { name: 'Custom Gaming PC', specs: 'RTX 3060 - i5 12th', price: 22000, usd: 440 },
            { name: 'Office Desktop', specs: 'i5 - 8GB - SSD', price: 8000, usd: 160 },
            { name: 'Mac Mini M2', specs: '8GB - 256GB', price: 18000, usd: 360 },
        ],
        other: [
            { name: 'Generic Item - Low', specs: 'Basic condition - Budget', price: 3000, usd: 60 },
            { name: 'Generic Item - Mid', specs: 'Good condition - Mid range', price: 8000, usd: 160 },
            { name: 'Generic Item - High', specs: 'Excellent condition - Premium', price: 20000, usd: 400 },
        ],
    };

    let items = suggestions[category] || suggestions.phone;
    if (budget > 0) {
        items = items.filter(i => i.price <= budget * 1.1);
        if (!items.length) items = [suggestions[category][suggestions[category].length - 1]];
    }
    return items;
}

// ═══ STORE (M4) ═══
function renderStore() {
    try {
        const storeEnabled = localStorage.getItem('valo_store_enabled') !== 'false';
        const section = document.getElementById('storeSection');
        if (!storeEnabled) { section.style.display = 'none'; return; }
        section.style.display = 'block';

        const products = JSON.parse(localStorage.getItem('valo_store_products') || '[]');
        const grid = document.getElementById('storeGrid');
        if (!products.length) {
            grid.innerHTML = `<div class="store-empty" data-key="storeEmpty">${getText('storeEmpty')}</div>`;
            return;
        }

        grid.innerHTML = '';
        products.forEach(p => {
            if (!p.active) return;
            const card = document.createElement('div');
            card.className = 'store-card';
            card.innerHTML = `
                <div class="store-card-img">${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" style="width:100%;height:100%;object-fit:cover;">` : '📦'}</div>
                <div class="store-card-body">
                    <div class="store-card-name">${escapeHtml(p.name)}</div>
                    <div class="store-card-desc">${escapeHtml(p.desc || '')}</div>
                    <div class="store-card-price">${escapeHtml(p.price || '')} <small>${escapeHtml(COUNTRIES[STATE.country].currency)}</small></div>
                    ${p.whatsapp ? `<a href="https://wa.me/${escapeHtml(p.whatsapp)}" target="_blank" class="btn-whatsapp">💬 ${STATE.lang === 'ar' ? 'تواصل واتساب' : 'WhatsApp'}</a>` : ''}
                </div>
            `;
            grid.appendChild(card);
        });
    } catch (e) { /* silent */ }
}

// ═══ BLOG ARTICLES (T7) ═══
const BLOG_ARTICLES = {
    general: {
        ar: {
            title: 'كيف تفحص جهازك المستعمل قبل الشراء',
            sections: [
                { h: '1. الفحص البصري السريع', p: 'ابدأ دائماً بالنظر إلى الجهاز من جميع الزوايا. ابحث عن الخدوش العميقة، الكسور، والتصبغات التي قد تدل على التعرض للماء. تأكد من أن الحواف والإطارات في حالة جيدة.' },
                { h: '2. فحص البطارية والشحن', p: 'البطارية هي أحد أهم عناصر التقييم. تحقق من صحة البطارية (Battery Health) وتأكد من أن الجهاز يشحن بشكل طبيعي. في السيارات، تأكد من عمر البطارية وحالتها.' },
                { h: '3. اختبار الأداء', p: 'شغّل الجهاز واختبر الأداء الأساسي: السرعة، الاستجابة، الكاميرا، الصوت، والاتصال. في الأجهزة المنزلية تأكد من عمل جميع البرامج والدوائر.' },
                { h: '4. التحقق من الأصالة', p: 'تأكد من أن الجهاز أصلي. تحقق من رقم المسلسل (Serial Number) وقارنه بالموقع الرسمي للشركة المصنعة.' },
                { h: '5. مقارنة الأسعار', p: 'قارن السعر المعروض مع أسعار السوق المحلي. استخدم VALO Check للحصول على تقدير دقيق للسعر العادل في بلدك.' },
                { h: '6. استخدام VALO Check', p: 'ارفع صورة الجهاز واحصل على تحليل فوري بالذكاء الاصطناعي يشمل درجة الحالة، السعر العادل، والعيوب المكتشفة. الأداة تدعم أكثر من 9 فئات و10 أسواق عالمية.' },
            ]
        },
        en: {
            title: 'How to Inspect a Used Device Before Buying',
            sections: [
                { h: '1. Quick Visual Inspection', p: 'Always start by looking at the device from all angles. Look for deep scratches, cracks, and discoloration that may indicate water damage.' },
                { h: '2. Battery & Charging Check', p: 'The battery is one of the most important evaluation factors. Check battery health and make sure the device charges normally.' },
                { h: '3. Performance Test', p: 'Turn on the device and test basic performance: speed, responsiveness, camera, audio, and connectivity.' },
                { h: '4. Authenticity Verification', p: 'Make sure the device is genuine. Check the serial number and compare it with the manufacturer\'s official website.' },
                { h: '5. Price Comparison', p: 'Compare the listed price with local market prices. Use VALO Check to get an accurate fair price estimate in your country.' },
                { h: '6. Using VALO Check', p: 'Upload a photo and get instant AI analysis including condition score, fair price, and detected defects across 9+ categories.' },
            ]
        },
        fr: {
            title: 'Comment inspecter un appareil d\'occasion avant l\'achat',
            sections: [
                { h: '1. Inspection visuelle rapide', p: 'Commencez toujours par examiner l\'appareil sous tous les angles. Recherchez les rayures profondes, fissures et décolorations.' },
                { h: '2. Vérification de la batterie', p: 'La batterie est un facteur d\'évaluation crucial. Vérifiez l\'état de la batterie et assurez-vous que l\'appareil se charge normalement.' },
                { h: '3. Test de performance', p: 'Allumez l\'appareil et testez les performances de base : vitesse, réactivité, caméra, audio et connectivité.' },
                { h: '4. Vérification de l\'authenticité', p: 'Assurez-vous que l\'appareil est authentique. Vérifiez le numéro de série et comparez-le au site officiel du fabricant.' },
                { h: '5. Comparaison des prix', p: 'Comparez le prix affiché avec les prix du marché local. Utilisez VALO Check pour obtenir une estimation précise.' },
                { h: '6. Utiliser VALO Check', p: 'Téléchargez une photo et obtenez une analyse IA instantanée avec le score d\'état, le prix juste et les défauts détectés.' },
            ]
        },
        de: {
            title: 'So prüfen Sie ein gebrauchtes Gerät vor dem Kauf',
            sections: [
                { h: '1. Schnelle visuelle Inspektion', p: 'Schauen Sie sich das Gerät immer aus allen Winkeln an. Suchen Sie nach tiefen Kratzern, Rissen und Verfärbungen.' },
                { h: '2. Akku- und Ladeprüfung', p: 'Der Akku ist einer der wichtigsten Bewertungsfaktoren. Prüfen Sie den Akkuzustand und stellen Sie sicher, dass das Gerät normal lädt.' },
                { h: '3. Leistungstest', p: 'Schalten Sie das Gerät ein und testen Sie die Grundleistung: Geschwindigkeit, Reaktionszeit, Kamera, Audio und Konnektivität.' },
                { h: '4. Authentizitätsprüfung', p: 'Stellen Sie sicher, dass das Gerät echt ist. Überprüfen Sie die Seriennummer und vergleichen Sie sie mit der offiziellen Website des Herstellers.' },
                { h: '5. Preisvergleich', p: 'Vergleichen Sie den Angebotspreis mit den lokalen Marktpreisen. Verwenden Sie VALO Check für eine genaue Schätzung.' },
                { h: '6. VALO Check nutzen', p: 'Laden Sie ein Foto hoch und erhalten Sie eine sofortige KI-Analyse mit Zustandsbewertung, fairem Preis und erkannten Mängeln.' },
            ]
        },
        zh: {
            title: '如何在购买前检查二手设备',
            sections: [
                { h: '1. 快速目视检查', p: '始终从所有角度观察设备。寻找可能表明进水的深划痕、裂缝和变色。' },
                { h: '2. 电池和充电检查', p: '电池是最重要的评估因素之一。检查电池健康度并确保设备正常充电。' },
                { h: '3. 性能测试', p: '打开设备并测试基本性能：速度、响应性、摄像头、音频和连接性。' },
                { h: '4. 真伪验证', p: '确保设备是正品。检查序列号并将其与制造商官方网站进行比较。' },
                { h: '5. 价格比较', p: '将标价与当地市场价格进行比较。使用VALO Check获取您所在国家/地区的准确公平价格估计。' },
                { h: '6. 使用VALO Check', p: '上传照片即可获得即时AI分析，包括状况评分、公平价格和检测到的缺陷，支持9+类别。' },
            ]
        },
        es: {
            title: 'Cómo inspeccionar un dispositivo usado antes de comprarlo',
            sections: [
                { h: '1. Inspección visual rápida', p: 'Siempre comienza mirando el dispositivo desde todos los ángulos. Busca rayones profundos, grietas y decoloraciones.' },
                { h: '2. Verificación de batería', p: 'La batería es uno de los factores de evaluación más importantes. Verifica la salud de la batería y asegúrate de que se carga normalmente.' },
                { h: '3. Prueba de rendimiento', p: 'Enciende el dispositivo y prueba el rendimiento básico: velocidad, capacidad de respuesta, cámara, audio y conectividad.' },
                { h: '4. Verificación de autenticidad', p: 'Asegúrate de que el dispositivo sea genuino. Verifica el número de série y compáralo con el sitio web oficial del fabricante.' },
                { h: '5. Comparación de precios', p: 'Compara el precio publicado con los precios del mercado local. Usa VALO Check para obtener una estimación precisa.' },
                { h: '6. Usar VALO Check', p: 'Sube una foto y obtén un análisis IA instantánea con puntuación de condición, precio justo y defectos detectados.' },
            ]
        },
    },
    phone: {
        ar: { title: 'دليل فحص الموبايل المستعمل', sections: [
            { h: '1. فحص الشاشة', p: 'افتح صورة بيضاء وتأكد من عدم وجود بقع داكنة (Dead Pixels) أو اصفرار. اضغط على الشاشة بلطف للتأكد من عمل اللمس في جميع المناطق.' },
            { h: '2. الكاميرا والصوت', p: 'اختبر الكاميرا الأمامية والخلفية. سجّل فيديو قصير للتأكد من عمل الميكروفون والسماعات.' },
            { h: '3. المنافذ والاتصال', p: 'تأكد من عمل منفذ الشحن، البلوتوث، الواي فاي، وشريحة الاتصال. جرّب الشحن السريع إن أمكن.' },
            { h: '4. الصحة العامة', p: 'تحقق من رقم IMEI并与 المعلّمات على الجهاز مطابقة. تأكد من عدم وجود تاريخ إصلاح غير معروف أو تغيير قطع.' },
            { h: '5. السعر والقيمة', p: 'ارفع صورة الموبايل على VALO Check واحصل على تقدير فوري للسعر العادل في بلدك مقارنة بالسوق المحلي.' },
        ]},
        en: { title: 'Used Phone Inspection Guide', sections: [
            { h: '1. Screen Check', p: 'Open a white image and check for dead pixels or yellowing. Gently press the screen to verify touch works in all areas.' },
            { h: '2. Camera & Audio', p: 'Test front and back cameras. Record a short video to verify microphone and speakers work properly.' },
            { h: '3. Ports & Connectivity', p: 'Verify charging port, Bluetooth, Wi-Fi, and SIM slot work. Try fast charging if possible.' },
            { h: '4. Health Check', p: 'Check IMEI number matches the device markings. Ensure no unknown repair history or part replacements.' },
            { h: '5. Price & Value', p: 'Upload the phone photo to VALO Check for an instant fair price estimate in your country vs local market.' },
        ]},
        fr: { title: 'Guide d\'inspection de téléphone d\'occasion', sections: [
            { h: '1. Vérification de l\'écran', p: 'Ouvrez une image blanche et vérifiez l\'absence de pixels morts ou de jaunissement. Appuyez doucement sur l\'écran pour vérifier le tactile.' },
            { h: '2. Caméra et audio', p: 'Testez les caméras avant et arrière. Enregistrez une courte vidéo pour vérifier le microphone et les haut-parleurs.' },
            { h: '3. Ports et connectivité', p: 'Vérifiez que le port de charge, le Bluetooth, le Wi-Fi et le slot SIM fonctionnent.' },
            { h: '4. Vérification de santé', p: 'Vérifiez que le numéro IMEI correspond aux marquages de l\'appareil.' },
            { h: '5. Prix et valeur', p: 'Téléchargez la photo sur VALO Check pour une estimation instantanée du prix équitable.' },
        ]},
        de: { title: 'Gebrauchtes Handy-Prüfungsleitfaden', sections: [
            { h: '1. Bildschirmprüfung', p: 'Öffnen Sie ein weißes Bild und prüfen Sie auf tote Pixel oder Vergilbung.' },
            { h: '2. Kamera & Audio', p: 'Testen Sie die Front- und Rückkamera. Nehmen Sie ein kurzes Video auf.' },
            { h: '3. Anschlüsse & Konnektivität', p: 'Überprüfen Sie Laden port, Bluetooth, WLAN und SIM-Steckplatz.' },
            { h: '4. Gesundheitscheck', p: 'Stellen Sie sicher, dass die IMEI-Nummer mit den Gerätebeschriftungen übereinstimmt.' },
            { h: '5. Preis & Wert', p: 'Laden Sie das Handy-Foto auf VALO Check für eine sofortige Preisschätzung hoch.' },
        ]},
        zh: { title: '二手手机检查指南', sections: [
            { h: '1. 屏幕检查', p: '打开白色图片，检查是否有坏点或发黄。轻轻按压屏幕以验证所有区域的触摸功能。' },
            { h: '2. 摄像头和音频', p: '测试前后摄像头。录制短视频以验证麦克风和扬声器正常工作。' },
            { h: '3. 接口和连接', p: '验证充电口、蓝牙、Wi-Fi和SIM卡槽正常工作。' },
            { h: '4. 健康检查', p: '确保IMEI号码与设备标记一致。确认没有未知的维修历史。' },
            { h: '5. 价格和价值', p: '将手机照片上传到VALO Check，获取您所在国家/地区的即时公平价格估计。' },
        ]},
        es: { title: 'Guía de inspección de teléfono usado', sections: [
            { h: '1. Verificación de pantalla', p: 'Abre una imagen blanca y verifica que no haya píxeles muertos o amarillamiento.' },
            { h: '2. Cámara y audio', p: 'Prueba las cámaras frontal y trasera. Graba un video corto para verificar el micrófono y altavoces.' },
            { h: '3. Puertos y conectividad', p: 'Verifica que el puerto de carga, Bluetooth, Wi-Fi y ranura SIM funcionen.' },
            { h: '4. Verificación de salud', p: 'Asegúrate de que el número IMEI coincida con las marcas del dispositivo.' },
            { h: '5. Precio y valor', p: 'Sube la foto del teléfono a VALO Check para una estimación instantánea del precio justo.' },
        ]},
    },
    laptop: {
        ar: { title: 'دليل فحص الابتوب المستعمل', sections: [
            { h: '1. فحص الشاشة والمفصل', p: 'افتح وأغلق الابتوب عدة مرات للتأكد من عمل المفصل بشكل سليم. افحص الشاشة من بقع وخدوش.' },
            { h: '2. الكيبورد واللمس', p: 'اضغط على جميع المفاتيح للتأكد من عملها. تحقق من إضاءة الكيبورد الخلفية إن وُجدت.' },
            { h: '3. الأداء والحرارة', p: 'شغّل برنامج اختبار أداء وراقب درجة الحرارة. إذا كانت عالية جداً قد يحتاج إلى تنظيف المروحة.' },
            { h: '4. المنافذ والبطارية', p: 'اختبر جميع المنافذ USB والـ HDMI والشحن. تحقق من صحة البطارية ونسبة الشحن.' },
            { h: '5. السعر والقيمة', p: 'ارفع صورة الابتوب على VALO Check للحصول على تقدير السعر العادل مقارنة بالسوق المحلي.' },
        ]},
        en: { title: 'Used Laptop Inspection Guide', sections: [
            { h: '1. Screen & Hinge Check', p: 'Open and close the laptop several times to verify the hinge works smoothly. Check the screen for spots and scratches.' },
            { h: '2. Keyboard & Touch', p: 'Press all keys to verify they work. Check keyboard backlight if available.' },
            { h: '3. Performance & Heat', p: 'Run a performance test and monitor temperature. High heat may need fan cleaning.' },
            { h: '4. Ports & Battery', p: 'Test all USB, HDMI ports, and charging. Check battery health and charge percentage.' },
            { h: '5. Price & Value', p: 'Upload the laptop photo to VALO Check for a fair price estimate vs local market.' },
        ]},
        fr: { title: 'Guide d\'inspection de laptop d\'occasion', sections: [
            { h: '1. Vérification de l\'écran et de la charnière', p: 'Ouvrez et fermez le laptop plusieurs fois pour vérifier la charnière. Vérifiez l\'écran.' },
            { h: '2. Clavier et tactile', p: 'Appuyez sur toutes les touches pour vérifier leur fonctionnement.' },
            { h: '3. Performance et chaleur', p: 'Lancez un test de performance et surveillez la température.' },
            { h: '4. Ports et batterie', p: 'Testez tous les ports USB, HDMI et la charge. Vérifiez la batterie.' },
            { h: '5. Prix et valeur', p: 'Téléchargez la photo sur VALO Check pour une estimation du prix équitable.' },
        ]},
        de: { title: 'Gebrauchter Laptop-Prüfungsleitfaden', sections: [
            { h: '1. Bildschirm- & Scharnierprüfung', p: 'Öffnen und schließen Sie den Laptop mehrmals, um das Scharnier zu prüfen.' },
            { h: '2. Tastatur & Touch', p: 'Drücken Sie alle Tasten, um ihre Funktion zu überprüfen.' },
            { h: '3. Leistung & Wärme', p: 'Führen Sie einen Leistungstest durch und überwachen Sie die Temperatur.' },
            { h: '4. Anschlüsse & Akku', p: 'Testen Sie alle USB-, HDMI-Anschlüsse und das Laden. Überprüfen Sie den Akku.' },
            { h: '5. Preis & Wert', p: 'Laden Sie das Laptop-Foto auf VALO Check für eine Preisschätzung hoch.' },
        ]},
        zh: { title: '二手笔记本检查指南', sections: [
            { h: '1. 屏幕和铰链检查', p: '多次打开和关闭笔记本电脑以验证铰链正常工作。检查屏幕是否有斑点和划痕。' },
            { h: '2. 键盘和触摸', p: '按所有按键以验证其正常工作。' },
            { h: '3. 性能和温度', p: '运行性能测试并监控温度。高温可能需要清洁风扇。' },
            { h: '4. 接口和电池', p: '测试所有USB、HDMI端口和充电。检查电池健康状况。' },
            { h: '5. 价格和价值', p: '将笔记本照片上传到VALO Check获取公平价格估计。' },
        ]},
        es: { title: 'Guía de inspección de laptop usada', sections: [
            { h: '1. Verificación de pantalla y bisagra', p: 'Abre y cierra la laptop varias veces para verificar la bisagra.' },
            { h: '2. Teclado y táctil', p: 'Presiona todas las teclas para verificar su funcionamiento.' },
            { h: '3. Rendimiento y calor', p: 'Ejecuta una prueba de rendimiento y monitorea la temperatura.' },
            { h: '4. Puertos y batería', p: 'Prueba todos los puertos USB, HDMI y la carga. Verifica la batería.' },
            { h: '5. Precio y valor', p: 'Sube la foto de la laptop a VALO Check para una estimación del precio justo.' },
        ]},
    },
    car: {
        ar: { title: 'دليل فحص السيارة المستعملة', sections: [
            { h: '1. الفحص البصري الخارجي', p: 'تفقد الطلاء والبويتش من جميع الزوايا. ابحث عن صدأ أو طبقة غير أصلية قد تدل على حادث سابف.' },
            { h: '2. المحرك وزيت', p: 'افتح الكبوت وتأكد من نظافة المحرك و檢查 مستوى الزيت ولونه. رائحة حرق قد تدل على مشكلة.' },
            { h: '3. العداد وال记录', p: 'تأكد من مطابقة عداد الكيلومترات لحالة السيارة العامة. عداد أقل من المتوقع قد يكون معدّلاً.' },
            { h: '4. الإطارات والفرامل', p: 'تفقد عمق إطارات الأربعة. تأكد من عدم وجود اهتزاز عند الفرملة.' },
            { h: '5. السعر والقيمة', p: 'ارفع صورة السيارة على VALO Check للحصول على تقدير السعر العادل في سوق بلدك المحلي.' },
        ]},
        en: { title: 'Used Car Inspection Guide', sections: [
            { h: '1. Exterior Visual Check', p: 'Inspect the paint from all angles. Look for rust or non-original paint that may indicate a past accident.' },
            { h: '2. Engine & Oil', p: 'Open the hood, check engine cleanliness, oil level and color. Burning smell may indicate a problem.' },
            { h: '3. Odometer & Records', p: 'Verify the odometer matches the car\'s overall condition. Lower-than-expected may be tampered.' },
            { h: '4. Tires & Brakes', p: 'Check tread depth on all four tires. Ensure no vibration during braking.' },
            { h: '5. Price & Value', p: 'Upload the car photo to VALO Check for a fair price estimate in your local market.' },
        ]},
        fr: { title: 'Guide d\'inspection de voiture d\'occasion', sections: [
            { h: '1. Vérification extérieure', p: 'Inspectez la peinture sous tous les angles. Recherchez la rouille ou une peinture non originale.' },
            { h: '2. Moteur et huile', p: 'Ouvrez le capot, vérifiez la propreté du moteur, le niveau et la couleur de l\'huile.' },
            { h: '3. Compteur et antécédents', p: 'Vérifiez que le compteur kilométrique correspond à l\'état général de la voiture.' },
            { h: '4. Pneus et freins', p: 'Vérifiez la profondeur de la bande de roulement des quatre pneus.' },
            { h: '5. Prix et valeur', p: 'Téléchargez la photo de la voiture sur VALO Check pour une estimation du prix équitable.' },
        ]},
        de: { title: 'Gebrauchtwagen-Prüfungsleitfaden', sections: [
            { h: '1. Außensichtprüfung', p: 'Untersuchen Sie die Lackierung aus allen Winkeln. Suchen Sie nach Rost oder nicht-originaler Lackierung.' },
            { h: '2. Motor & Öl', p: 'Öffnen Sie die Motorhaube, prüfen Sie Motor sauberkeit, Ölstand und Farbe.' },
            { h: '3. Kilometerstand & Historie', p: 'Stellen Sie sicher, dass der Kilometerstand dem Gesamtzustand des Autos entspricht.' },
            { h: '4. Reifen & Bremsen', p: 'Prüfen Sie die Profiltiefe aller vier Reifen.' },
            { h: '5. Preis & Wert', p: 'Laden Sie das Autofoto auf VALO Check für eine Preisschätzung hoch.' },
        ]},
        zh: { title: '二手车检查指南', sections: [
            { h: '1. 外观目视检查', p: '从所有角度检查油漆。寻找可能表明过去事故的锈迹或非原漆。' },
            { h: '2. 发动机和机油', p: '打开发动机盖，检查发动机清洁度、机油液位和颜色。' },
            { h: '3. 里程表和记录', p: '验证里程表是否与汽车整体状况匹配。' },
            { h: '4. 轮胎和刹车', p: '检查四个轮胎的胎面深度。确保刹车时没有振动。' },
            { h: '5. 价格和价值', p: '将汽车照片上传到VALO Check获取当地市场的公平价格估计。' },
        ]},
        es: { title: 'Guía de inspección de carro usado', sections: [
            { h: '1. Verificación exterior', p: 'Inspecciona la pintura desde todos los ángulos. Busca óxido o pintura no original.' },
            { h: '2. Motor y aceite', p: 'Abre el capó, verifica la limpieza del motor, nivel y color del aceite.' },
            { h: '3. Odómetro y registros', p: 'Verifica que el odómetro coincida con el estado general del carro.' },
            { h: '4. Neumáticos y frenos', p: 'Verifica la profundidad del dibujo de los cuatro neumáticos.' },
            { h: '5. Precio y valor', p: 'Sube la foto del carro a VALO Check para una estimación del precio justo.' },
        ]},
    },
};
const BLOG_EXTRA_CATS = ['scooter','fridge','ac','washer','pc','other'];
BLOG_EXTRA_CATS.forEach(cat => {
    if (!BLOG_ARTICLES[cat]) {
        BLOG_ARTICLES[cat] = {
            ar: { title: `دليل فحص ${CATEGORIES[cat]?.nameAr || 'المنتج'} المستعمل`, sections: [
                { h: '1. الفحص البصري', p: 'تفقد المنتج من جميع الزوايا. ابحث عن الخدوش والصدأ والكسور.' },
                { h: '2. اختبار التشغيل', p: 'تأكد من تشغيل المنتج بشكل سليم والتأكد من عمل جميع الوظائف.' },
                { h: '3. الفحص الفني', p: 'تأكد من سلامة الأسلاك والموصلات والمنافذ الكهربائية.' },
                { h: '4. الملصقات والمواصفات', p: 'تحقق من ملصق المواصفات وتأكد من مطابقتها للمنتج الفعلي.' },
                { h: '5. السعر والقيمة', p: 'ارفع صورة المنتج على VALO Check للحصول على تقدير السعر العادل في سوق بلدك.' },
            ]},
            en: { title: `Used ${CATEGORIES[cat]?.nameEn || 'Item'} Inspection Guide`, sections: [
                { h: '1. Visual Inspection', p: 'Examine the item from all angles. Look for scratches, rust, and cracks.' },
                { h: '2. Operation Test', p: 'Make sure the item works properly and all functions are operational.' },
                { h: '3. Technical Check', p: 'Verify wires, connectors, and electrical ports are safe.' },
                { h: '4. Labels & Specs', p: 'Check the specs label and ensure it matches the actual item.' },
                { h: '5. Price & Value', p: 'Upload the item photo to VALO Check for a fair price estimate in your market.' },
            ]},
            fr: { title: `Guide d'inspection de ${CATEGORIES[cat]?.nameEn || 'produit'} d'occasion`, sections: [
                { h: '1. Inspection visuelle', p: 'Examinez l\'article sous tous les angles. Recherchez rayures, rouille et fissures.' },
                { h: '2. Test de fonctionnement', p: 'Assurez-vous que l\'article fonctionne correctement.' },
                { h: '3. Vérification technique', p: 'Vérifiez les fils, connecteurs et ports électriques.' },
                { h: '4. Étiquettes et spécifications', p: 'Vérifiez l\'étiquette des spécifications.' },
                { h: '5. Prix et valeur', p: 'Téléchargez la photo sur VALO Check pour une estimation du prix équitable.' },
            ]},
            de: { title: `Gebrauchter ${CATEGORIES[cat]?.nameEn || 'Artikel'}-Prüfungsleitfaden`, sections: [
                { h: '1. Visuelle Inspektion', p: 'Untersuchen Sie den Artikel aus allen Winkeln. Suchen Sie nach Kratzern, Rost und Rissen.' },
                { h: '2. Betriebstest', p: 'Stellen Sie sicher, dass der Artikel ordnungsgemäß funktioniert.' },
                { h: '3. Technische Prüfung', p: 'Überprüfen Sie Drähte, Stecker und Anschlüsse.' },
                { h: '4. Etiketten & Spezifikationen', p: 'Überprüfen Sie das Spezifikationsetikett.' },
                { h: '5. Preis & Wert', p: 'Laden Sie das Foto auf VALO Check für eine Preisschätzung hoch.' },
            ]},
            zh: { title: `二手${CATEGORIES[cat]?.nameEn || '物品'}检查指南`, sections: [
                { h: '1. 目视检查', p: '从所有角度检查物品。寻找划痕、锈迹和裂缝。' },
                { h: '2. 操作测试', p: '确保物品正常工作，所有功能正常运行。' },
                { h: '3. 技术检查', p: '检查电线、连接器和电气端口。' },
                { h: '4. 标签和规格', p: '检查规格标签，确保与实际物品匹配。' },
                { h: '5. 价格和价值', p: '将物品照片上传到VALO Check获取公平价格估计。' },
            ]},
            es: { title: `Guía de inspección de ${CATEGORIES[cat]?.nameEn || 'artículo'} usado`, sections: [
                { h: '1. Inspección visual', p: 'Examina el artículo desde todos los ángulos. Busca rayones, óxido y grietas.' },
                { h: '2. Prueba de funcionamiento', p: 'Asegúrate de que el artículo funcione correctamente.' },
                { h: '3. Verificación técnica', p: 'Verifica cables, conectores y puertos eléctricos.' },
                { h: '4. Etiquetas y especificaciones', p: 'Verifica la etiqueta de especificaciones.' },
                { h: '5. Precio y valor', p: 'Sube la foto a VALO Check para una estimación del precio justo.' },
            ]},
        };
    }
});

let currentBlogTab = 'general';

function initBlogTabs() {
    const tabs = document.getElementById('blogTabs');
    tabs.innerHTML = '';
    const categories = Object.keys(BLOG_ARTICLES);
    const tabLabels = {
        general: STATE.lang === 'ar' ? 'عام' : 'General',
        phone: STATE.lang === 'ar' ? '📱 موبايل' : '📱 Phone',
        laptop: STATE.lang === 'ar' ? '💻 لابتوب' : '💻 Laptop',
        car: STATE.lang === 'ar' ? '🚗 سيارة' : '🚗 Car',
        scooter: STATE.lang === 'ar' ? '🛵 سكوتر' : '🛵 Scooter',
        fridge: STATE.lang === 'ar' ? '❄️ ثلاجة' : '❄️ Fridge',
        ac: STATE.lang === 'ar' ? '🌬️ تكييف' : '🌬️ AC',
        washer: STATE.lang === 'ar' ? '🌀 غسالة' : '🌀 Washer',
        pc: STATE.lang === 'ar' ? '🖥️ كمبيوتر' : '🖥️ PC',
        other: STATE.lang === 'ar' ? '📦 أخرى' : '📦 Other',
    };
    categories.forEach(cat => {
        const div = document.createElement('div');
        div.className = `blog-tab ${cat === currentBlogTab ? 'active' : ''}`;
        div.textContent = tabLabels[cat] || cat;
        div.onclick = () => switchBlogTab(cat);
        tabs.appendChild(div);
    });
    renderBlogArticle();
}

function switchBlogTab(cat) {
    currentBlogTab = cat;
    document.querySelectorAll('.blog-tab').forEach((tab, i) => {
        const cats = Object.keys(BLOG_ARTICLES);
        tab.classList.toggle('active', cats[i] === cat);
    });
    renderBlogArticle();
}

function renderBlogArticle() {
    const container = document.getElementById('blogContent');
    const article = BLOG_ARTICLES[currentBlogTab];
    if (!article) { container.innerHTML = ''; return; }
    const data = article[STATE.lang] || article.en;
    let html = `<h2>${escapeHtml(data.title)}</h2>`;
    data.sections.forEach(s => {
        html += `<h3>${escapeHtml(s.h)}</h3><p>${escapeHtml(s.p)}</p>`;
    });
    html += `<p style="margin-top:20px;font-size:13px;color:var(--text-muted);">💡 ${STATE.lang === 'ar' ? 'استخدم VALO Check لفحص المنتج قبل الشراء — فقط ارفع صورة واحصل على تحليل فوري.' : 'Use VALO Check to inspect the item before buying — just upload a photo for instant analysis.'}</p>`;
    container.innerHTML = html;
}

// ═══ ADSENSE INJECTION (M5) ═══
function loadAdSense() {
    try {
        const code = window.APP_CONFIG.adsense || localStorage.getItem('valo_adsense_code') || '';
        if (!code) return;
        const slots = ['adsenseHeader', 'adsenseFooter'];
        slots.forEach(id => {
            const el = document.getElementById(id);
            if (el && !el.dataset.loaded) {
                el.innerHTML = code;
                el.dataset.loaded = '1';
            }
        });
    } catch (e) { /* silent */ }
}

// ═══ ADMIN AD SLOT 3 ═══
function loadAd3() {
    try {
        const ads = window.APP_CONFIG.ads || [];
        const extraAds = ads.filter(a => a.active && a.position === 'mid');
        const ad3 = extraAds[0];
        if (ad3) {
            const safeLink = getSafeUrl(ad3.link);
            const el = document.getElementById('adBox3');
            if (el) {
                el.innerHTML = `
                    <a href="${safeLink}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none;">
                        <div style="font-size:16px;font-weight:700;margin-bottom:4px;">${escapeHtml(ad3.title)}</div>
                        <div style="font-size:12px;">${escapeHtml(ad3.desc || '')}</div>
                    </a>
                `;
                el.style.border = '1px solid var(--accent-green)';
            }
        } else {
            const legacy = localStorage.getItem('valo_ad3');
            if (legacy) {
                const ad = JSON.parse(legacy);
                const safeLink = getSafeUrl(ad.link);
                const el = document.getElementById('adBox3');
                if (el) {
                    el.innerHTML = `
                        <a href="${safeLink}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none;">
                            <div style="font-size:16px;font-weight:700;margin-bottom:4px;">${escapeHtml(ad.title)}</div>
                            <div style="font-size:12px;">${escapeHtml(ad.desc || '')}</div>
                        </a>
                    `;
                    el.style.border = '1px solid var(--accent-green)';
                }
            }
        }
    } catch (e) { /* silent */ }
}
