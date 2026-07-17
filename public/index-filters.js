
(function () {
  'use strict';

  const THEME = '#06b6d4';
  const THEME_DARK = '#0891b2';
  const MOBILE_QUERY = '(max-width: 767px)';

  const VEHICLE_FINANCE_DEFAULTS = { downPaymentPercent: 40, annualRatePercent: 15, months: 48, companyPhone: '+94 77 000 0000' };
  const LOCAL_SETTING_PREFIX = 'ehemeheSiteSetting:';
  let financeSettings = { ...VEHICLE_FINANCE_DEFAULTS };
  let financeSettingsLoaded = false;

  function readLocalFinanceSetting(key) {
    try { return localStorage.getItem(LOCAL_SETTING_PREFIX + key); } catch(e) { return null; }
  }
  async function loadFinanceSettings() {
    if (financeSettingsLoaded) return financeSettings;
    financeSettingsLoaded = true;
    const values = {
      vehicle_downpayment_percent: VEHICLE_FINANCE_DEFAULTS.downPaymentPercent,
      vehicle_annual_rate_percent: VEHICLE_FINANCE_DEFAULTS.annualRatePercent,
      vehicle_finance_months: VEHICLE_FINANCE_DEFAULTS.months,
      vehicle_finance_company_phone: VEHICLE_FINANCE_DEFAULTS.companyPhone
    };
    Object.keys(values).forEach((key) => {
      const local = readLocalFinanceSetting(key);
      if (local !== null && local !== '') values[key] = local;
    });
    try {
      if (window.supabaseClient) {
        const { data, error } = await window.supabaseClient.from('site_settings').select('key,value').in('key', Object.keys(values));
        if (!error && Array.isArray(data)) data.forEach((row) => { values[row.key] = row.value; });
      }
    } catch(e) {}
    financeSettings = {
      downPaymentPercent: Number(values.vehicle_downpayment_percent) || VEHICLE_FINANCE_DEFAULTS.downPaymentPercent,
      annualRatePercent: Number(values.vehicle_annual_rate_percent) || VEHICLE_FINANCE_DEFAULTS.annualRatePercent,
      months: Math.max(1, Math.round(Number(values.vehicle_finance_months) || VEHICLE_FINANCE_DEFAULTS.months)),
      companyPhone: String(values.vehicle_finance_company_phone || VEHICLE_FINANCE_DEFAULTS.companyPhone)
    };
    return financeSettings;
  }


  const STATIC_ADS = [{"id":"1","title":"2020 Toyota Prius Hybrid - Low Mileage","description":"Well-maintained Toyota Prius Hybrid with only 35,000km on the odometer. Full service history available. Air conditioning, power windows, ABS brakes, and hybrid battery in excellent condition. Recently serviced with new tires.","price":8500000,"currency":"LKR","categoryId":"vehicles","subcategoryId":"cars","images":["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s1","name":"Kamal Perera","phone":"+94 77 123 4567","email":"kamal@email.com","memberSince":"2024-01-15","totalAds":12,"verified":true},"condition":"used","postedAt":"2026-06-19","isFeatured":true,"isPromoted":true,"viewCount":342,"contactPhone":"+94 77 123 4567"},{"id":"2","title":"Modern 3-Bedroom House in Kandy","description":"Beautiful modern house in a prime location in Kandy. 3 bedrooms, 2 bathrooms, open-plan kitchen, large garden, and parking for 2 cars. Close to schools, hospitals, and shopping centers.","price":45000000,"currency":"LKR","categoryId":"property","subcategoryId":"houses","images":["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop"],"location":"Kandy","seller":{"id":"s2","name":"Nadeesha Silva","phone":"+94 71 234 5678","email":"nadeesha@email.com","memberSince":"2024-03-22","totalAds":5,"verified":true},"condition":"new","postedAt":"2026-06-20","isFeatured":true,"isPromoted":false,"viewCount":189,"contactPhone":"+94 71 234 5678"},{"id":"3","title":"iPhone 15 Pro Max 256GB - Space Black","description":"Brand new iPhone 15 Pro Max 256GB in Space Black. Sealed box with full Apple warranty. Includes case and screen protector.","price":520000,"currency":"LKR","categoryId":"mobile-phones","subcategoryId":"phones","images":["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s3","name":"Ravindu Fernando","phone":"+94 76 345 6789","email":"ravindu@email.com","memberSince":"2024-06-10","totalAds":8,"verified":false},"condition":"new","postedAt":"2026-06-21","isFeatured":true,"isPromoted":true,"viewCount":567,"contactPhone":"+94 76 345 6789"},{"id":"4","title":"Samsung 65\" QLED 4K Smart TV","description":"Samsung 65-inch QLED 4K Smart TV with Quantum Dot technology. Stunning picture quality, built-in voice assistant, and all major streaming apps. Wall mount included.","price":485000,"currency":"LKR","categoryId":"electronics","subcategoryId":"tvs","images":["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=600&fit=crop"],"location":"Gampaha","seller":{"id":"s4","name":"Ishara Jayawardena","phone":"+94 70 456 7890","email":"ishara@email.com","memberSince":"2023-11-05","totalAds":22,"verified":true},"condition":"new","postedAt":"2026-06-18","isFeatured":true,"isPromoted":false,"viewCount":231,"contactPhone":"+94 70 456 7890"},{"id":"5","title":"Professional Guitar - Fender Stratocaster","description":"Fender American Professional II Stratocaster in 3-Color Sunburst. Rosewood fretboard, V-Mod II pickups. Comes with original hardshell case and all documentation.","price":650000,"currency":"LKR","categoryId":"sports-hobbies-kids","subcategoryId":"musical-instruments","images":["https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s5","name":"Dilini Ratnayake","phone":"+94 78 567 8901","email":"dilini@email.com","memberSince":"2024-08-18","totalAds":3,"verified":false},"condition":"used","postedAt":"2026-06-17","isFeatured":false,"isPromoted":false,"viewCount":156,"contactPhone":"+94 78 567 8901"},{"id":"6","title":"Honda CB150R - Excellent Condition","description":"Honda CB150R ExMotion in Matte Black. Low mileage, single owner. Regular servicing at Honda center. Comes with full documentation and insurance.","price":1250000,"currency":"LKR","categoryId":"vehicles","subcategoryId":"motorbikes","images":["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop"],"location":"Galle","seller":{"id":"s1","name":"Kamal Perera","phone":"+94 77 123 4567","email":"kamal@email.com","memberSince":"2024-01-15","totalAds":12,"verified":true},"condition":"used","postedAt":"2026-06-16","isFeatured":false,"isPromoted":true,"viewCount":423,"contactPhone":"+94 77 123 4567"},{"id":"7","title":"MacBook Pro M3 14-inch 16GB/512GB","description":"Apple MacBook Pro 14-inch with M3 chip, 16GB RAM, 512GB SSD. Space Gray. Battery cycle count: 45. AppleCare+ until 2027. Perfect for professionals and developers.","price":890000,"currency":"LKR","categoryId":"electronics","subcategoryId":"computers-tablets","images":["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s3","name":"Ravindu Fernando","phone":"+94 76 345 6789","email":"ravindu@email.com","memberSince":"2024-06-10","totalAds":8,"verified":false},"condition":"used","postedAt":"2026-06-20","isFeatured":true,"isPromoted":false,"viewCount":312,"contactPhone":"+94 76 345 6789"},{"id":"8","title":"Golden Retriever Puppies - 3 Months","description":"Adorable Golden Retriever puppies, 3 months old. First vaccination done. Both parents are KC registered. Puppies are playful and well-socialized.","price":85000,"currency":"LKR","categoryId":"animals-pets","subcategoryId":"dogs","images":["https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s5","name":"Dilini Ratnayake","phone":"+94 78 567 8901","email":"dilini@email.com","memberSince":"2024-08-18","totalAds":3,"verified":false},"condition":"new","postedAt":"2026-06-21","isFeatured":true,"isPromoted":false,"viewCount":891,"contactPhone":"+94 78 567 8901"},{"id":"9","title":"Modern Sofa Set - 7 Piece","description":"Elegant 7-piece sofa set in premium fabric. Includes 3-seater, 2-seater, 2 single chairs, and center table. Brand new, direct from manufacturer.","price":285000,"currency":"LKR","categoryId":"home-garden","subcategoryId":"furniture","images":["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop"],"location":"Kurunegala","seller":{"id":"s2","name":"Nadeesha Silva","phone":"+94 71 234 5678","email":"nadeesha@email.com","memberSince":"2024-03-22","totalAds":5,"verified":true},"condition":"new","postedAt":"2026-06-19","isFeatured":false,"isPromoted":false,"viewCount":167,"contactPhone":"+94 71 234 5678"},{"id":"10","title":"Software Engineer - Remote Position","description":"Leading tech company seeking experienced software engineers. React/Node.js preferred. Competitive salary + benefits. Full remote flexibility.","price":350000,"currency":"LKR","categoryId":"jobs","subcategoryId":"vacancies","images":["https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s4","name":"Ishara Jayawardena","phone":"+94 70 456 7890","email":"ishara@email.com","memberSince":"2023-11-05","totalAds":22,"verified":true},"condition":"new","postedAt":"2026-06-21","isFeatured":true,"isPromoted":true,"viewCount":1245,"contactEmail":"careers@techcompany.lk"},{"id":"11","title":"Land for Sale - 10 Perches in Kadawatha","description":"Prime land for sale in Kadawatha. 10 perches, flat terrain, road access from both sides. Ideal for residential construction. Close to Colombo-Kandy highway.","price":12000000,"currency":"LKR","categoryId":"property","subcategoryId":"land","images":["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop"],"location":"Gampaha","seller":{"id":"s1","name":"Kamal Perera","phone":"+94 77 123 4567","email":"kamal@email.com","memberSince":"2024-01-15","totalAds":12,"verified":true},"condition":"new","postedAt":"2026-06-18","isFeatured":false,"isPromoted":false,"viewCount":289,"contactPhone":"+94 77 123 4567"},{"id":"12","title":"Professional Photography Services","description":"Event, portrait, product, and commercial photography. 10+ years experience. Portfolio available on request. Competitive rates for weddings and corporate events.","price":50000,"currency":"LKR","categoryId":"services","subcategoryId":"event","images":["https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s3","name":"Ravindu Fernando","phone":"+94 76 345 6789","email":"ravindu@email.com","memberSince":"2024-06-10","totalAds":8,"verified":false},"condition":"new","postedAt":"2026-06-17","isFeatured":false,"isPromoted":false,"viewCount":98,"contactPhone":"+94 76 345 6789"},{"id":"13","title":"Nike Air Max 270 - White/Black","description":"Authentic Nike Air Max 270 in White/Black colorway. Size 10 UK. Never worn, still in original box. Bought from official Nike store.","price":32000,"currency":"LKR","categoryId":"fashion","subcategoryId":"shoes","images":["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s5","name":"Dilini Ratnayake","phone":"+94 78 567 8901","email":"dilini@email.com","memberSince":"2024-08-18","totalAds":3,"verified":false},"condition":"new","postedAt":"2026-06-20","isFeatured":false,"isPromoted":false,"viewCount":234,"contactPhone":"+94 78 567 8901"},{"id":"14","title":"Three Wheeler - Bajaj RE 205","description":"Bajaj RE 205 three-wheeler in excellent running condition. Recently serviced. Good for taxi or small business. Registration up to date.","price":680000,"currency":"LKR","categoryId":"vehicles","subcategoryId":"three-wheelers","images":["https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&h=600&fit=crop"],"location":"Galle","seller":{"id":"s2","name":"Nadeesha Silva","phone":"+94 71 234 5678","email":"nadeesha@email.com","memberSince":"2024-03-22","totalAds":5,"verified":true},"condition":"used","postedAt":"2026-06-15","isFeatured":false,"isPromoted":false,"viewCount":156,"contactPhone":"+94 71 234 5678"},{"id":"15","title":"A-Level Physics Tuition - Online","description":"Qualified teacher with 15 years experience offering online A-Level Physics tuition. Small batch sizes (max 10 students). Proven track record of A/L results.","price":5000,"currency":"LKR","categoryId":"education","subcategoryId":"tuition-classes","images":["https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s4","name":"Ishara Jayawardena","phone":"+94 70 456 7890","email":"ishara@email.com","memberSince":"2023-11-05","totalAds":22,"verified":true},"condition":"new","postedAt":"2026-06-21","isFeatured":false,"isPromoted":false,"viewCount":78,"contactPhone":"+94 70 456 7890"},{"id":"16","title":"Industrial Sewing Machine - Juki","description":"Juki DDL-8100E industrial sewing machine with table and motor. Heavy-duty, perfect for garment manufacturing. Barely used, looks brand new.","price":185000,"currency":"LKR","categoryId":"business-industry-agriculture","subcategoryId":"industrial-machinery","images":["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop"],"location":"Gampaha","seller":{"id":"s1","name":"Kamal Perera","phone":"+94 77 123 4567","email":"kamal@email.com","memberSince":"2024-01-15","totalAds":12,"verified":true},"condition":"used","postedAt":"2026-06-16","isFeatured":false,"isPromoted":false,"viewCount":67,"contactPhone":"+94 77 123 4567"}];

  const FALLBACK_DISTRICTS = [
    'Colombo','Gampaha','Kalutara','Kandy','Matale','Nuwara Eliya','Galle','Matara','Hambantota','Jaffna','Kilinochchi','Mullaitivu','Vavuniya','Mannar','Trincomalee','Batticaloa','Ampara','Kurunegala','Puttalam','Anuradhapura','Polonnaruwa','Badulla','Monaragala','Ratnapura','Kegalle'
  ].map((name) => ({ id: slugify(name), name, slug: slugify(name), source: 'fallback' }));

  const FALLBACK_CITIES = {
    colombo: ['Colombo City','Nugegoda','Dehiwala','Mount Lavinia','Maharagama','Piliyandala','Homagama','Kottawa','Malabe','Athurugiriya','Battaramulla','Rajagiriya','Moratuwa','Nawala'],
    gampaha: ['Gampaha City','Negombo','Wattala','Ja-Ela','Ragama','Kadawatha','Kiribathgoda','Kelaniya','Minuwangoda','Divulapitiya','Nittambuwa'],
    kalutara: ['Kalutara City','Panadura','Bandaragama','Horana','Beruwala','Aluthgama','Matugama'],
    kandy: ['Kandy City','Gampola','Katugastota','Akurana','Peradeniya','Pilimatalawa','Digana','Gelioya','Nawalapitiya','Kundasale','Galagedara'],
    matale: ['Matale City','Dambulla','Galewela'],
    'nuwara-eliya': ['Nuwara Eliya City','Hatton','Talawakele','Ginigathena'],
    galle: ['Galle City','Ambalangoda','Hikkaduwa','Elpitiya','Karapitiya'],
    matara: ['Matara City','Weligama','Akuressa','Dikwella','Hakmana'],
    hambantota: ['Hambantota City','Tangalle','Tissamaharama','Beliatta','Ambalantota'],
    jaffna: ['Jaffna City','Chavakachcheri','Nallur','Point Pedro'],
    kurunegala: ['Kurunegala City','Kuliyapitiya','Pannala','Narammala','Wariyapola','Mawathagama'],
    puttalam: ['Puttalam City','Chilaw','Wennappuwa','Nattandiya','Dankotuwa'],
    anuradhapura: ['Anuradhapura City','Kekirawa','Medawachchiya','Thambuttegama'],
    polonnaruwa: ['Polonnaruwa City','Hingurakgoda','Kaduruwela','Medirigiriya'],
    badulla: ['Badulla City','Bandarawela','Ella','Welimada','Mahiyanganaya','Hali Ela'],
    monaragala: ['Monaragala City','Wellawaya','Bibile','Buttala'],
    ratnapura: ['Ratnapura City','Embilipitiya','Balangoda','Pelmadulla','Eheliyagoda'],
    kegalle: ['Kegalle City','Mawanella','Warakapola','Rambukkana'],
    trincomalee: ['Trincomalee City','Kinniya','Kantale'],
    batticaloa: ['Batticaloa City','Eravur','Kattankudy'],
    ampara: ['Ampara City','Kalmunai','Akkaraipattu','Sainthamaruthu'],
    mannar: ['Mannar City'],
    vavuniya: ['Vavuniya City'],
    kilinochchi: ['Kilinochchi City'],
    mullaitivu: ['Mullaitivu City']
  };

  const CATEGORY_TREE = [
    { id: 'vehicles', name: 'Vehicles', children: [
      { id: 'cars', name: 'Cars' }, { id: 'motorbikes', name: 'Motorbikes' }, { id: 'vans', name: 'Vans' }, { id: 'trucks', name: 'Trucks' }, { id: 'buses', name: 'Buses' }, { id: 'three-wheelers', name: 'Three Wheelers' }, { id: 'auto-parts-accessories', name: 'Auto Parts & Accessories' }
    ]},
    { id: 'property', name: 'Property', children: [
      { id: 'houses', name: 'Houses' }, { id: 'land', name: 'Land' }, { id: 'apartments', name: 'Apartments' }, { id: 'commercial-properties', name: 'Commercial Properties' }, { id: 'rooms-annexes', name: 'Rooms & Annexes' }
    ]},
    { id: 'electronics', name: 'Electronics', children: [
      { id: 'computers-tablets', name: 'Computers & Tablets' }, { id: 'laptops', name: 'Laptops' }, { id: 'tvs', name: 'TVs' }, { id: 'cameras', name: 'Cameras' }, { id: 'audio-mp3', name: 'Audio & MP3' }, { id: 'electronic-home-appliances', name: 'Electronic Home Appliances' }
    ]},
    { id: 'mobile-phones', name: 'Mobile Phones & Tablets', children: [
      { id: 'phones', name: 'Phones' }, { id: 'tablets', name: 'Tablets' }, { id: 'mobile-phone-accessories', name: 'Mobile Phone Accessories' }
    ]},
    { id: 'services', name: 'Services', children: [
      { id: 'domestic-services', name: 'Domestic Services' }, { id: 'repair-services', name: 'Repair Services' }, { id: 'event', name: 'Event Services' }, { id: 'travel-tourism-services', name: 'Travel & Tourism Services' }
    ]},
    { id: 'home-garden', name: 'Home & Garden', children: [
      { id: 'furniture', name: 'Furniture' }, { id: 'garden', name: 'Garden' }, { id: 'home-appliances', name: 'Home Appliances' }, { id: 'kitchen-items', name: 'Kitchen Items' }
    ]},
    { id: 'business-industry-agriculture', name: 'Business, Industry & Agriculture', children: [
      { id: 'industrial-machinery', name: 'Industrial Machinery' }, { id: 'office-equipment', name: 'Office Equipment' }, { id: 'restaurant-hotel-equipment', name: 'Restaurant & Hotel Equipment' }, { id: 'agriculture-equipment', name: 'Agriculture Equipment' }
    ]},
    { id: 'jobs', name: 'Jobs', children: [
      { id: 'vacancies', name: 'Vacancies' }, { id: 'driver-jobs', name: 'Driver Jobs' }, { id: 'sales-jobs', name: 'Sales Jobs' }, { id: 'it-telecom-jobs', name: 'IT & Telecom Jobs' }
    ]},
    { id: 'animals-pets', name: 'Animals & Pets', children: [
      { id: 'dogs', name: 'Dogs' }, { id: 'cats', name: 'Cats' }, { id: 'farm-animals', name: 'Farm Animals' }, { id: 'pet-food-accessories', name: 'Pet Food & Accessories' }
    ]},
    { id: 'sports-hobbies-kids', name: 'Sports, Hobbies & Kids', children: [
      { id: 'musical-instruments', name: 'Musical Instruments' }, { id: 'sports-equipment', name: 'Sports Equipment' }, { id: 'toys', name: 'Toys' }, { id: 'books', name: 'Books' }
    ]},
    { id: 'fashion', name: 'Fashion', children: [
      { id: 'clothing', name: 'Clothing' }, { id: 'shoes', name: 'Shoes' }, { id: 'watches', name: 'Watches' }, { id: 'jewellery', name: 'Jewellery' }, { id: 'bags', name: 'Bags' }
    ]},
    { id: 'education', name: 'Education', children: [
      { id: 'tuition-classes', name: 'Tuition Classes' }, { id: 'courses', name: 'Courses' }, { id: 'textbooks', name: 'Textbooks' }
    ]}
  ];

  const state = {
    district: null,
    city: null,
    category: null,
    view: 'grid',
    query: ''
  };

  let lookups = {
    districts: FALLBACK_DISTRICTS,
    cities: [],
    categories: CATEGORY_TREE
  };
  let lookupsLoaded = false;
  let adsLoaded = false;
  let adsLoadPromise = null;
  let supabaseAds = [];
  const detailAdCache = new Map();
  const DETAIL_ROUTE_CACHE_PREFIX = 'ehemehe:publicAdDetail:v2:';
  const DETAIL_ROUTE_CACHE_TTL_MS = 2 * 60 * 1000;
  let detailPendingRoute = '';
  let adPromotions = [];
  let bannerAds = [];
  let promotionsLoaded = false;
  const AD_PROMOTIONS_KEY = 'ehemeheAdPromotions';
  const BANNER_ADS_KEY = 'ehemeheBannerAds';
  const FAVORITES_STORAGE_KEY = 'ehemehe:favorites:v2';
  const REPORT_REASON_LABELS = {
    scam: 'Scam or fraud', spam: 'Spam or misleading', duplicate: 'Duplicate listing',
    sold: 'Already sold or unavailable', category: 'Wrong category', inappropriate: 'Inappropriate content', other: 'Other'
  };
  function readLocalArray(key) { try { return JSON.parse(localStorage.getItem(key) || '[]') || []; } catch (e) { return []; } }
  function isActivePromo(row) { if (!row) return false; if (row.is_active === false || row.is_enabled === false || String(row.status || 'active').toLowerCase() === 'disabled') return false; const end = row.end_at || row.expires_at; if (!end) return true; const t = new Date(end).getTime(); return !Number.isFinite(t) || t >= Date.now(); }
  let syncing = false;
  let desktopShellMutating = false;
  let desktopDataPromise = null;
  let lastPath = window.location.pathname;

  function slugify(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function isMobile() {
    return window.matchMedia && window.matchMedia(MOBILE_QUERY).matches;
  }

  function isHomeRoute() {
    const path = window.location.pathname.replace(/\/index\.html$/i, '/');
    return path === '/' || path === '';
  }

  function isAdRoute() {
    return /^\/ad\//.test(window.location.pathname);
  }

  function isDatabaseAdRoute() {
    if (!isAdRoute()) return false;
    const id = currentRouteAdId().replace(/^static-/, '');
    return !!id && !/^\d+$/.test(id);
  }

  function detailRouteCacheKey(id) {
    return `${DETAIL_ROUTE_CACHE_PREFIX}${encodeURIComponent(String(id || '').replace(/^static-/, ''))}`;
  }

  function cachePublicDetailAd(ad) {
    if (!ad || ad.source !== 'supabase' || !ad.id) return false;
    const id = String(ad.id).replace(/^static-/, '');
    detailAdCache.set(id, ad);
    window.__ehmSelectedPublicAd = ad;

    try {
      if (!window.sessionStorage) return true;
      let cachedAd = ad;
      let json = JSON.stringify({ savedAt: Date.now(), ad: cachedAd });
      // Avoid exceeding mobile-browser sessionStorage when a legacy listing
      // contains large Base64 photos. The first image is enough for an instant
      // first render; the normal Supabase request refreshes the complete ad.
      if (json.length > 700000) {
        cachedAd = { ...ad, images: (ad.images || []).slice(0, 1), image: ad.image || ad.images?.[0] || '' };
        json = JSON.stringify({ savedAt: Date.now(), ad: cachedAd });
      }
      window.sessionStorage.setItem(detailRouteCacheKey(id), json);
      return true;
    } catch (_) {
      return true;
    }
  }

  function readPublicDetailAd(id) {
    const cleanId = String(id || '').replace(/^static-/, '');
    if (!cleanId) return null;

    const inMemory = detailAdCache.get(cleanId);
    if (inMemory) return inMemory;

    const selected = window.__ehmSelectedPublicAd;
    if (selected && String(selected.id).replace(/^static-/, '') === cleanId) {
      detailAdCache.set(cleanId, selected);
      return selected;
    }

    try {
      if (!window.sessionStorage) return null;
      const raw = window.sessionStorage.getItem(detailRouteCacheKey(cleanId));
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.ad || Date.now() - Number(parsed.savedAt || 0) > DETAIL_ROUTE_CACHE_TTL_MS) {
        window.sessionStorage.removeItem(detailRouteCacheKey(cleanId));
        return null;
      }
      const normalized = parsed.ad.source === 'supabase' ? parsed.ad : normalizeAd(parsed.ad, 'supabase');
      if (String(normalized.id).replace(/^static-/, '') !== cleanId) return null;
      detailAdCache.set(cleanId, normalized);
      return normalized;
    } catch (_) {
      return null;
    }
  }

  function installAdDetailPendingStyles() {
    if (document.getElementById('ehmAdDetailPendingStyles')) return;
    const style = document.createElement('style');
    style.id = 'ehmAdDetailPendingStyles';
    style.textContent = `
      body.ehm-ad-detail-pending #root main{opacity:0!important;visibility:hidden!important;pointer-events:none!important}
      #ehmAdDetailPendingShell{display:none;position:fixed;z-index:25;left:50%;top:52%;transform:translate(-50%,-50%);width:min(520px,calc(100vw - 40px));padding:28px 24px;border:1px solid #e6edf2;border-radius:20px;background:#fff;box-shadow:0 18px 55px rgba(15,23,42,.10);text-align:center;color:#64748b}
      body.ehm-ad-detail-pending #ehmAdDetailPendingShell{display:block}
      #ehmAdDetailPendingShell .ehm-pending-spinner{width:42px;height:42px;margin:0 auto 15px;border:4px solid #dff6ee;border-top-color:#22b98b;border-radius:50%;animation:ehm-detail-spin .7s linear infinite}
      #ehmAdDetailPendingShell strong{display:block;font-size:18px;color:#0f172a;margin-bottom:5px}
      #ehmAdDetailPendingShell span{font-size:14px}
      @keyframes ehm-detail-spin{to{transform:rotate(360deg)}}
      @media(max-width:767px){#ehmAdDetailPendingShell{top:48%;width:calc(100vw - 32px);padding:24px 18px;border-radius:16px}}
    `;
    document.head?.appendChild?.(style);
  }

  function beginDynamicDetailPending() {
    if (!isDatabaseAdRoute()) return false;
    const route = `${window.location.pathname}${window.location.search || ''}`;
    detailPendingRoute = route;
    installAdDetailPendingStyles();
    document.documentElement?.classList?.add('ehm-ad-detail-pending');
    document.body?.classList?.add('ehm-ad-detail-pending');

    if (!document.getElementById('ehmAdDetailPendingShell') && document.body?.appendChild) {
      const shell = document.createElement('div');
      shell.id = 'ehmAdDetailPendingShell';
      shell.setAttribute?.('role', 'status');
      shell.setAttribute?.('aria-live', 'polite');
      shell.innerHTML = '<div class="ehm-pending-spinner"></div><strong>Loading ad</strong><span>Please wait a moment…</span>';
      document.body.appendChild(shell);
    }
    return true;
  }

  function finishDynamicDetailPending() {
    detailPendingRoute = '';
    document.documentElement?.classList?.remove('ehm-ad-detail-pending');
    document.body?.classList?.remove('ehm-ad-detail-pending');
    document.getElementById('ehmAdDetailPendingShell')?.remove?.();
  }

  function isSameId(a, b) {
    return String(a || '').toLowerCase() === String(b || '').toLowerCase();
  }

  function formatPrice(value, currency = 'LKR') {
    if (value === null || value === undefined || value === '') return '';
    const n = Number(String(value).replace(/[^\d.-]/g, ''));
    if (Number.isFinite(n)) return `${currency} ${n.toLocaleString('en-LK')}`;
    return `${currency} ${String(value)}`;
  }


  function isVehicleAd(ad) {
    const keys = [ad.categoryId, ad.category_id, ad.categoryName, ad.category, ad.subcategoryId, ad.subcategory_id, ad.subcategoryName, ad.subcategory]
      .map(slugify);
    const vehicleKeys = ['vehicles','vehicle','cars','car','motorbikes','motorbike','bikes','vans','trucks','buses','three-wheelers','three-wheeler'];
    return keys.some((key) => vehicleKeys.includes(key));
  }

  function calcVehicleFinance(price) {
    const amount = Number(String(price ?? '').replace(/[^\d.]/g, ''));
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const downPayment = Math.round(amount * financeSettings.downPaymentPercent / 100);
    const principal = Math.max(0, amount - downPayment);
    const monthlyRate = financeSettings.annualRatePercent / 100 / 12;
    const months = Math.max(1, financeSettings.months);
    const monthlyPayment = monthlyRate <= 0
      ? principal / months
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return { downPayment, financeAmount: Math.round(principal), monthlyPayment: Math.round(monthlyPayment), ...financeSettings };
  }

  function financeCardHtml(ad) {
    if (!isVehicleAd(ad)) return '';
    const f = calcVehicleFinance(ad.price);
    if (!f) return '';
    return `<div class="ehm-finance-line"><b>Finance</b> Down ${esc(formatPrice(f.downPayment, ad.currency || 'LKR'))} • Monthly ${esc(formatPrice(f.monthlyPayment, ad.currency || 'LKR'))}<br><span>Call ${esc(f.companyPhone)}</span></div>`;
  }

  function relativeDate(dateText) {
    if (!dateText) return 'Today';
    const today = new Date('2026-06-21T00:00:00');
    const posted = new Date(dateText);
    if (Number.isNaN(posted.getTime())) return String(dateText);
    const days = Math.max(0, Math.floor((today - posted) / 86400000));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  }

  function normalizeAd(raw, source = 'static') {
    const image = raw.image_url || raw.image || (Array.isArray(raw.images) ? raw.images[0] : '');
    let customFields = raw.custom_fields || raw.customFields || {};
    if (typeof customFields === 'string') { try { customFields = JSON.parse(customFields); } catch (_) { customFields = {}; } }
    const categoryName = raw.categoryName || raw.categories?.name || raw.category || customFields.subcategory_name || customFields.category_name || '';
    const cityName = raw.cityName || raw.cities?.name || raw.city || raw.location || customFields.city || '';
    const districtId = raw.district_id || raw.districtId || raw.cities?.district_id || raw.district || raw.location || customFields.district || '';
    const seller = raw.seller && typeof raw.seller === 'object' ? { ...raw.seller } : {};
    const rawPhones = raw.contactPhones || raw.contact_phones || customFields.contact_phones || customFields.verified_contact_phones || [];
    const phoneArray = Array.isArray(rawPhones) ? rawPhones : (rawPhones ? [rawPhones] : []);
    const primaryPhone = String(
      raw.contactPhone || raw.contact_phone || raw.phone || raw.phone_number || raw.mobile || seller.phone || seller.mobile || ''
    ).trim();
    const contactPhones = Array.from(new Set([primaryPhone, ...phoneArray].map(value=>String(value||'').trim()).filter(Boolean)));
    const contactPhone = contactPhones[0] || '';

    if (contactPhone && !seller.phone) seller.phone = contactPhone;

    return {
      id: raw.id || raw.ad_id || raw.uuid || slugify(`${raw.title || 'ad'}-${source}`),
      title: raw.title || 'Untitled Ad',
      description: raw.description || '',
      price: raw.price,
      currency: raw.currency || 'LKR',
      categoryId: raw.category_id || raw.categoryId || slugify(categoryName),
      subcategoryId: raw.subcategory_id || raw.subcategoryId || '',
      categoryName,
      location: raw.location || cityName || raw.district || '',
      cityId: raw.city_id || raw.cityId || raw.cities?.id || '',
      cityName,
      districtId,
      image,
      images: Array.isArray(raw.images) ? raw.images : (image ? [image] : []),
      condition: raw.condition || '',
      postedAt: raw.created_at || raw.postedAt || raw.updated_at || '',
      isFeatured: !!raw.isFeatured || !!raw.featured,
      isPromoted: !!raw.isPromoted || !!raw.promoted,
      viewCount: raw.viewCount ?? raw.view_count ?? 0,
      seller,
      contactPhone,
      contactPhones,
      customFields,
      source
    };
  }

  function getStaticAdOverrides() {
    try {
      return JSON.parse(localStorage.getItem('ehemeheStaticAdOverrides') || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function mergeStaticAdOverride(ad) {
    const overrides = getStaticAdOverrides();
    const override = overrides[String(ad.id)] || {};
    if (override.deleted) return null;
    const merged = { ...ad, ...override };
    if (override.image_url) merged.images = [override.image_url];
    if (override.contactPhone) merged.contactPhone = override.contactPhone;
    if (!merged.status) merged.status = 'approved';
    return merged;
  }

  function allStaticAds() {
    return STATIC_ADS
      .map(mergeStaticAdOverride)
      .filter(Boolean)
      .filter((ad) => (ad.status || 'approved') === 'approved')
      .map((ad) => normalizeAd(ad, 'static'));
  }

  function allAds() {
    const combined = [...supabaseAds, ...allStaticAds()];
    const seen = new Set();
    return combined.filter((ad) => {
      const key = `${slugify(ad.title)}|${slugify(ad.location)}|${ad.price}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async function loadLookups() {
    if (lookupsLoaded) return lookups;
    lookupsLoaded = true;

    const fallbackCities = FALLBACK_DISTRICTS.flatMap((district) => {
      const names = FALLBACK_CITIES[district.slug] || [];
      return names.map((name) => ({
        id: `${district.id}__${slugify(name)}`,
        name,
        district_id: district.id,
        districtName: district.name,
        source: 'fallback'
      }));
    });

    let districts = [...FALLBACK_DISTRICTS];
    let cities = [...fallbackCities];
    let categories = JSON.parse(JSON.stringify(CATEGORY_TREE));

    try {
      if (!window.supabaseClient) throw new Error('No Supabase client');
      const [dRes, cRes, cityRes] = await Promise.all([
        window.supabaseClient.from('districts').select('id,name,slug,is_active').eq('is_active', true).order('name'),
        window.supabaseClient.from('categories').select('id,name,slug,is_active').eq('is_active', true).order('name'),
        window.supabaseClient.from('cities').select('id,name,district_id,is_active').eq('is_active', true).order('name')
      ]);

      if (Array.isArray(dRes.data) && dRes.data.length) {
        const bySlug = new Map(districts.map((d) => [slugify(d.slug || d.name), d]));
        dRes.data.forEach((d) => {
          const slug = slugify(d.slug || d.name);
          bySlug.set(slug, { id: d.id, name: d.name, slug, source: 'supabase' });
        });
        districts = Array.from(bySlug.values()).sort((a, b) => a.name.localeCompare(b.name));
      }

      if (Array.isArray(cityRes.data) && cityRes.data.length) {
        const cityKey = (c) => `${String(c.district_id).toLowerCase()}|${slugify(c.name)}`;
        const map = new Map(cities.map((c) => [cityKey(c), c]));
        cityRes.data.forEach((c) => map.set(cityKey(c), { ...c, source: 'supabase' }));
        cities = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
      }

      if (Array.isArray(cRes.data) && cRes.data.length) {
        const known = new Map(categories.map((c) => [slugify(c.id || c.slug || c.name), c]));
        cRes.data.forEach((c) => {
          const slug = slugify(c.slug || c.name);
          if (!known.has(slug)) known.set(slug, { id: c.id, slug, name: c.name, children: [], source: 'supabase' });
        });
        categories = Array.from(known.values());
      }
    } catch (e) {
      // Fallback data is enough for the current static site.
    }

    lookups = { districts, cities, categories };
    return lookups;
  }

  async function loadAds() {
    if (adsLoaded) return supabaseAds;
    if (adsLoadPromise) return adsLoadPromise;
    if (!window.supabaseClient) return supabaseAds;

    adsLoadPromise = (async () => {
      try {
        let result = await window.supabaseClient
          .from('ads')
          .select('*, categories(name,slug), cities(id,name,district_id)')
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        // Some existing projects do not yet have relationship metadata in the
        // PostgREST schema cache. The ads themselves are still public, so fall
        // back to a plain table query instead of hiding every live listing.
        if (result.error) {
          result = await window.supabaseClient
            .from('ads')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });
        }

        if (result.error) throw result.error;
        supabaseAds = (result.data || []).map((ad) => normalizeAd(ad, 'supabase'));
        supabaseAds.forEach((ad) => detailAdCache.set(String(ad.id), ad));
        adsLoaded = true;
      } catch (e) {
        supabaseAds = [];
        // Mark this pass complete to avoid a network-error retry loop from the
        // route observer. A normal page reload can attempt the query again.
        adsLoaded = true;
      } finally {
        adsLoadPromise = null;
      }
      return supabaseAds;
    })();

    return adsLoadPromise;
  }

  async function loadPromotions() {
    if (promotionsLoaded) return { adPromotions, bannerAds };
    promotionsLoaded = true;
    const localPromos = readLocalArray(AD_PROMOTIONS_KEY);
    const localBanners = readLocalArray(BANNER_ADS_KEY);
    let remotePromos = [];
    let remoteBanners = [];
    try {
      if (window.supabaseClient) {
        const [pRes, bRes] = await Promise.all([
          window.supabaseClient.from('ad_promotions').select('*').eq('promotion_type','top').order('created_at', { ascending:false }),
          window.supabaseClient.from('banner_ads').select('*').order('created_at', { ascending:false })
        ]);
        if (Array.isArray(pRes.data)) remotePromos = pRes.data;
        if (Array.isArray(bRes.data)) remoteBanners = bRes.data;
      }
    } catch (e) {}
    const promoMap = new Map();
    [...remotePromos, ...localPromos].forEach((p) => promoMap.set(String(p.id || `${p.ad_id}|${p.end_at}`), p));
    const bannerMap = new Map();
    [...remoteBanners, ...localBanners].forEach((b) => bannerMap.set(String(b.id || `${b.image_url}|${b.end_at}`), b));
    adPromotions = Array.from(promoMap.values()).filter(isActivePromo);
    bannerAds = Array.from(bannerMap.values()).filter(isActivePromo);
    return { adPromotions, bannerAds };
  }


  function favoriteIds() {
    const stored = readLocalArray(FAVORITES_STORAGE_KEY);
    const ids = new Set((Array.isArray(stored) ? stored : []).map((id) => String(id)));
    try {
      const storeIds = window.__EHM_STORE?.getState?.().favorites || [];
      if (Array.isArray(storeIds)) storeIds.forEach((id) => ids.add(String(id)));
    } catch (_) {}
    return ids;
  }

  function isFavoriteId(id) {
    return favoriteIds().has(String(id));
  }

  function saveFavoriteIds(ids) {
    try { localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(ids))); } catch (_) {}
  }

  function showUiToast(message, type = 'success') {
    let toast = document.getElementById('ehmUiToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ehmUiToast';
      toast.className = 'ehm-ui-toast';
      document.body.appendChild(toast);
    }
    toast.className = `ehm-ui-toast ${type === 'error' ? 'error' : 'success'} show`;
    toast.textContent = message;
    clearTimeout(toast.__ehmTimer);
    toast.__ehmTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function selectorEscape(value) {
    const text = String(value || '');
    if (window.CSS?.escape) return window.CSS.escape(text);
    return text.replace(/([\"'])/g, '\\$1');
  }

  function updateFavoriteButtons(id) {
    const active = isFavoriteId(id);
    document.querySelectorAll(`[data-ehm-favorite-id="${selectorEscape(id)}"]`).forEach((button) => {
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      const icon = button.querySelector('[data-ehm-heart-icon]') || button;
      if (icon) icon.textContent = active ? '♥' : '♡';
    });
  }

  function toggleFavoriteId(id) {
    const cleanId = String(id || '').trim();
    if (!cleanId) return false;
    const ids = favoriteIds();
    const wasActive = ids.has(cleanId);
    if (wasActive) ids.delete(cleanId); else ids.add(cleanId);
    saveFavoriteIds(ids);

    try {
      const store = window.__EHM_STORE;
      const storeState = store?.getState?.();
      if (storeState?.toggleFavorite) {
        const inStore = (storeState.favorites || []).map(String).includes(cleanId);
        if (inStore === wasActive) storeState.toggleFavorite(cleanId);
      }
    } catch (_) {}

    updateFavoriteButtons(cleanId);
    showUiToast(wasActive ? 'Removed from favourites' : 'Added to favourites');
    return !wasActive;
  }

  function currentReportAdId() {
    return decodeURIComponent(window.location.pathname.replace(/^\/ad\//, '').replace(/\/$/, '')).replace(/^static-/, '');
  }

  function closeReportModal() {
    document.getElementById('ehmReportModal')?.remove();
    document.body.classList.remove('ehm-modal-open');
  }

  function openReportModal(adId = currentReportAdId()) {
    closeReportModal();
    const modal = document.createElement('div');
    modal.id = 'ehmReportModal';
    modal.className = 'ehm-report-modal';
    modal.innerHTML = `
      <div class="ehm-report-backdrop" data-ehm-report-close></div>
      <section class="ehm-report-dialog" role="dialog" aria-modal="true" aria-labelledby="ehmReportTitle">
        <button type="button" class="ehm-report-close" data-ehm-report-close aria-label="Close">×</button>
        <h2 id="ehmReportTitle">Report this ad</h2>
        <p>Tell us why this listing should be reviewed. Reports are sent to the EheMehe admin team.</p>
        <form id="ehmReportForm">
          <input type="hidden" name="adId" value="${esc(adId)}">
          <label>Reason
            <select name="reason" required>
              <option value="">Select a reason</option>
              ${Object.entries(REPORT_REASON_LABELS).map(([value,label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join('')}
            </select>
          </label>
          <label>Additional details <span>(optional)</span>
            <textarea name="message" rows="4" maxlength="800" placeholder="Add any useful details for the review team"></textarea>
          </label>
          <label>Email <span>(optional)</span>
            <input type="email" name="reporterEmail" maxlength="180" placeholder="For follow-up only" value="${esc(window.__EHM_STORE?.getState?.().currentUser?.email || '')}">
          </label>
          <div class="ehm-report-actions">
            <button type="button" class="ehm-report-cancel" data-ehm-report-close>Cancel</button>
            <button type="submit" class="ehm-report-submit">Submit Report</button>
          </div>
          <div class="ehm-report-status" aria-live="polite"></div>
        </form>
      </section>`;
    document.body.appendChild(modal);
    document.body.classList.add('ehm-modal-open');
    modal.querySelector('select')?.focus();
  }

  async function submitAdReport(form) {
    const submit = form.querySelector('.ehm-report-submit');
    const status = form.querySelector('.ehm-report-status');
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.reason) {
      status.textContent = 'Select a reason.';
      status.className = 'ehm-report-status error';
      return;
    }
    submit.disabled = true;
    submit.textContent = 'Submitting…';
    status.textContent = '';
    try {
      const response = await fetch('/api/report-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId: String(data.adId || currentReportAdId()),
          reason: String(data.reason || ''),
          message: String(data.message || ''),
          reporterEmail: String(data.reporterEmail || ''),
          pageUrl: window.location.href
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'Could not submit the report.');
      status.textContent = 'Report submitted. Thank you.';
      status.className = 'ehm-report-status success';
      showUiToast('Report submitted');
      setTimeout(closeReportModal, 900);
    } catch (error) {
      status.textContent = error.message || 'Could not submit the report.';
      status.className = 'ehm-report-status error';
      submit.disabled = false;
      submit.textContent = 'Submit Report';
    }
  }

  function getSearchInput() {
    const visible = (input) => {
      if (!input) return false;
      const rect = input.getBoundingClientRect();
      const style = window.getComputedStyle(input);
      return rect.width > 40 && rect.height > 20 && style.display !== 'none' && style.visibility !== 'hidden';
    };

    const headerInputs = Array.from(document.querySelectorAll('header input[type="text"], header input[type="search"], header input'))
      .filter(visible);
    if (headerInputs.length) {
      return headerInputs.find((input) => /search ehemehe/i.test(input.placeholder || '')) || headerInputs[0];
    }

    const all = Array.from(document.querySelectorAll('input[placeholder="Search ehemehe.lk..."], input[placeholder="Search ehemehe.lk…"], input'))
      .filter(visible);
    return all.find((input) => /search ehemehe/i.test(input.placeholder || '')) || all[0] || null;
  }

  function getSearchValue() {
    const fromState = String(state.query || '').trim().toLowerCase();
    if (fromState) return fromState;
    return (getSearchInput()?.value || '').trim().toLowerCase();
  }

  function hasActiveFilters() {
    return !!(getSearchValue() || state.district || state.city || state.category);
  }

  function districtForAd(ad) {
    const location = slugify(ad.location || ad.cityName || '');
    const direct = lookups.districts.find((d) => isSameId(d.id, ad.districtId) || slugify(d.name) === slugify(ad.districtId) || slugify(d.name) === location);
    if (direct) return direct;
    return lookups.districts.find((d) => {
      const cityNames = (FALLBACK_CITIES[d.slug] || []).map(slugify);
      return cityNames.includes(location);
    }) || null;
  }

  function cityBelongsToDistrict(city, district) {
    if (!city || !district) return false;
    return isSameId(city.district_id, district.id) || slugify(city.districtName) === slugify(district.name) || String(city.district_id || '').toLowerCase() === slugify(district.name);
  }

  function adMatchesLocation(ad) {
    if (!state.district && !state.city) return true;
    const adLoc = `${ad.location} ${ad.cityName} ${ad.districtId}`.toLowerCase();
    if (state.city) {
      const cityName = String(state.city.name || '').toLowerCase();
      return adLoc.includes(cityName) || isSameId(ad.cityId, state.city.id) || (cityName.endsWith(' city') && adLoc.includes(cityName.replace(/ city$/, '')));
    }
    if (state.district) {
      const districtName = String(state.district.name || '').toLowerCase();
      return adLoc.includes(districtName) || isSameId(ad.districtId, state.district.id) || slugify(ad.districtId) === slugify(state.district.name);
    }
    return true;
  }

  function categoryKeywords(category) {
    const id = slugify(category?.id || category?.slug || category?.name || '');
    const name = String(category?.name || '').toLowerCase();
    const map = {
      vehicles: ['vehicle','car','toyota','prius','honda','motorbike','three wheeler','three-wheeler','bajaj'],
      cars: ['toyota','prius','hybrid','vehicle'],
      motorbikes: ['motorbike','bike','honda'],
      'three-wheelers': ['three wheeler','three-wheeler','bajaj'],
      property: ['property','house','land','bedroom','perches','apartment'],
      houses: ['house','bedroom'],
      land: ['land','perches'],
      electronics: ['electronics','tv','qled','samsung','macbook','laptop','computer'],
      tvs: ['tv','qled','samsung'],
      'computers-tablets': ['computer','macbook','laptop'],
      'mobile-phones': ['iphone','phone','mobile'],
      phones: ['iphone','phone','mobile'],
      services: ['service','photography'],
      event: ['event','photography'],
      'home-garden': ['sofa','furniture','home','garden'],
      furniture: ['sofa','furniture'],
      'business-industry-agriculture': ['industrial','sewing','machine','business','industry','agriculture'],
      'industrial-machinery': ['industrial','machine','juki','sewing'],
      jobs: ['job','engineer','position','remote','vacancy'],
      vacancies: ['job','engineer','position','remote','vacancy'],
      'animals-pets': ['puppy','puppies','dog','retriever','pet','animal'],
      dogs: ['dog','puppy','puppies','retriever'],
      'sports-hobbies-kids': ['guitar','music','instrument','sport','hobby','kids'],
      'musical-instruments': ['guitar','music','instrument','fender'],
      fashion: ['nike','air max','shoe','fashion'],
      shoes: ['nike','air max','shoe'],
      education: ['tuition','physics','a-level','class','education'],
      'tuition-classes': ['tuition','physics','a-level','class']
    };
    return [...new Set([name, id.replace(/-/g, ' '), ...(map[id] || [])].filter(Boolean))];
  }

  function adMatchesCategory(ad) {
    if (!state.category) return true;

    const category = state.category;
    const selected = slugify(category.id || category.slug || category.name);
    const selectedParent = slugify(category.parentId || '');

    const adCategory = slugify(ad.categoryId || ad.categoryName || '');
    const adSubcategory = slugify(ad.subcategoryId || '');
    const hasCategoryIds = !!(adCategory || adSubcategory);

    // Exact matching first. This prevents wrong results like MacBook showing under Cars
    // just because "AppleCare" contains the letters "car".
    if (category.type === 'parent') {
      if (adCategory === selected) return true;

      const parent = CATEGORY_TREE.find((c) => slugify(c.id) === selected || slugify(c.name) === selected);
      if (parent && parent.children.some((child) => slugify(child.id) === adSubcategory)) return true;

      // If the ad has clear category ids and they don't match the parent/children, reject it.
      if (hasCategoryIds) return false;
    } else {
      if (adSubcategory === selected) return true;

      // Some dynamic Supabase ads may store the subcategory as the main category.
      if (adCategory === selected) return true;

      // If the selected child has a parent and ad category is a different parent, reject it.
      if (selectedParent && adCategory && adCategory !== selectedParent && adSubcategory !== selected) return false;

      // If the ad has category/subcategory ids and no exact match, reject it.
      if (hasCategoryIds) return false;
    }

    // Last fallback only for ads without proper category ids.
    const adText = `${ad.title} ${ad.description} ${ad.categoryName} ${ad.categoryId} ${ad.subcategoryId}`.toLowerCase();
    return categoryKeywords(category).some((keyword) => {
      const k = String(keyword || '').trim().toLowerCase();
      if (!k) return false;
      const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(adText);
    });
  }

  function searchWords(value) {
    return String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function adMatchesSearchQuery(ad, query) {
    const tokens = searchWords(query);
    if (!tokens.length) return true;

    const customValues = ad.customFields && typeof ad.customFields === 'object'
      ? Object.values(ad.customFields).flatMap((value) => Array.isArray(value) ? value : [value]).join(' ')
      : '';
    const words = searchWords(`${ad.title} ${ad.description} ${ad.categoryName} ${ad.categoryId} ${ad.subcategoryId} ${ad.location} ${ad.cityName} ${ad.districtId} ${customValues}`);

    // Every query token must match the beginning of a real word. This keeps
    // "cat" matching "Cats" while rejecting accidental interior matches in
    // words such as "education" and "location".
    return tokens.every((token) => words.some((word) => word.startsWith(token)));
  }

  function adMatchesSearch(ad) {
    return adMatchesSearchQuery(ad, getSearchValue());
  }

  function adCategoryMatchesPromotion(ad, promo) {
    const pcat = slugify(promo.category_id || '');
    if (!pcat) return true;
    const adCat = slugify(ad.categoryId || ad.categoryName || '');
    const adSub = slugify(ad.subcategoryId || '');
    return pcat === adCat || pcat === adSub || adMatchesCategoryForPromo(ad, pcat);
  }
  function adMatchesCategoryForPromo(ad, promoCategory) {
    const oldCategory = state.category;
    const found = lookups.categories.find((c) => slugify(c.id || c.slug || c.name) === promoCategory);
    if (!found) return false;
    state.category = found;
    const ok = adMatchesCategory(ad);
    state.category = oldCategory;
    return ok;
  }
  function topPromotionForAd(ad) {
    const rawId = String(ad.id || '').replace(/^static-/, '');
    return adPromotions.find((promo) => {
      const promoAd = String(promo.ad_id || '').replace(/^static-/, '');
      const promoStatic = String(promo.static_id || '').replace(/^static-/, '');
      const idOk = promoAd === String(ad.id) || promoAd === rawId || promoStatic === rawId;
      return idOk && adCategoryMatchesPromotion(ad, promo);
    });
  }
  function sortTopAdsFirst(rows) {
    return [...rows].sort((a,b)=>{
      const at = topPromotionForAd(a) ? 1 : 0;
      const bt = topPromotionForAd(b) ? 1 : 0;
      if (at !== bt) return bt - at;
      return new Date(b.postedAt || 0) - new Date(a.postedAt || 0);
    });
  }
  function filteredAds() {
    return sortTopAdsFirst(allAds().filter((ad) => adMatchesSearch(ad) && adMatchesLocation(ad) && adMatchesCategory(ad)));
  }

  function getDistrictCities(district) {
    if (!district) return [];
    const cities = lookups.cities.filter((city) => cityBelongsToDistrict(city, district));
    const map = new Map();
    cities.forEach((city) => map.set(slugify(city.name), city));
    (FALLBACK_CITIES[district.slug] || []).forEach((name) => {
      const slug = slugify(name);
      if (!map.has(slug)) {
        map.set(slug, { id: `${district.id}__${slug}`, name, district_id: district.id, districtName: district.name, source: 'fallback' });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  function getLocationLabel() {
    return state.city?.name || state.district?.name || 'Location';
  }

  function getCategoryLabel() {
    return state.category?.name || 'Category';
  }

  function chevronSvg() {
    return '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function viewSvg(type) {
    if (type === 'list') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h3M4 12h3M4 17.5h3M10 6.5h10M10 12h10M10 17.5h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" stroke-width="2"/><rect x="14" y="4" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" stroke-width="2"/><rect x="4" y="14" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" stroke-width="2"/><rect x="14" y="14" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
  }

  function installStyles() {
    if (document.getElementById('ehm-final-mobile-styles')) return;
    const style = document.createElement('style');
    style.id = 'ehm-final-mobile-styles';
    style.textContent = `
      .ehm-mobile-filterbar,.ehm-mobile-results,.ehm-filter-modal{display:none;}
      .ehm-promo-banner{display:block;position:relative;margin:0 0 18px;border-radius:18px;overflow:hidden;min-height:92px;background:#e0f2fe;box-shadow:0 14px 32px rgba(15,23,42,.10);text-decoration:none;color:#fff;}
      .ehm-promo-banner img{width:100%;height:clamp(92px,16vw,190px);object-fit:cover;display:block;filter:saturate(1.04);}
      .ehm-promo-banner span{position:absolute;left:18px;bottom:16px;background:rgba(15,23,42,.72);backdrop-filter:blur(8px);padding:9px 13px;border-radius:999px;font-weight:800;font-size:14px;}
      .ehm-badge.top{background:#ef4444!important;}
      .ehm-desktop-category-select,.ehm-desktop-district-select,.ehm-desktop-city-select{height:46px;border:1.5px solid #dbe6ef;border-radius:14px;background-color:#fff;color:#334155;padding:0 44px 0 16px;font-size:15px;font-weight:600;outline:none;min-width:155px;appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 20 20'%3E%3Cpath d='M5 7.5l5 5 5-5' fill='none' stroke='%2364758b' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 15px center;background-size:18px;}
      .ehm-desktop-category-select:focus,.ehm-desktop-district-select:focus,.ehm-desktop-city-select:focus{border-color:#06b6d4;box-shadow:0 0 0 3px rgba(6,182,212,.12);}
      .ehm-desktop-top-category{display:none!important;}
      .ehm-desktop-top-location-hidden,.ehm-desktop-native-location-hidden{display:none!important;}
      .ehm-desktop-hero-filterbar{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-items:center;justify-content:center;margin:14px auto 0;width:min(100%,560px);max-width:560px;padding:0 4px;}
      .ehm-desktop-hero-filterbar select{width:100%;min-width:0;height:48px;border-radius:14px;font-size:15.5px;}
      .ehm-desktop-results{max-width:1180px;margin:34px auto 58px;padding:0 24px;}
      .ehm-desktop-hero-filterbar + .ehm-desktop-hero-filterbar{display:none!important;}
      @media(min-width:768px){
        #ehmDesktopHeroFilterbar{margin-top:18px!important;}
        #ehmDesktopHeroFilterbar.ehm-stats-balanced{margin-bottom:74px!important;}
        .ehm-desktop-stats-balanced{
          display:flex!important;
          align-items:center!important;
          justify-content:center!important;
          gap:28px!important;
          width:min(100%,680px)!important;
          max-width:680px!important;
          margin:18px auto 0!important;
          padding:0 6px!important;
          color:rgba(255,255,255,.92)!important;
          font-weight:700!important;
          text-align:center!important;
          position:relative!important;
          z-index:3!important;
        }
        .ehm-desktop-stats-balanced > *{
          white-space:nowrap!important;
          display:inline-flex!important;
          align-items:center!important;
          justify-content:center!important;
          gap:7px!important;
        }
      }
      .ehm-desktop-results-head{display:flex;align-items:end;justify-content:space-between;margin-bottom:18px;}
      .ehm-desktop-results h2{margin:0;font-size:30px;line-height:1.1;font-weight:900;color:#0f172a;letter-spacing:-.03em;}
      .ehm-desktop-results p{margin:6px 0 0;color:#64748b;font-size:15px;}
      .ehm-desktop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(245px,1fr));gap:18px;}
      .ehm-desktop-results .ehm-ad-card{display:block;background:#fff;border:1px solid #e5edf3;border-radius:18px;overflow:hidden;text-decoration:none;color:#0f172a;box-shadow:0 8px 24px rgba(15,23,42,.06);transition:.18s ease;}
      .ehm-desktop-results .ehm-ad-card:hover{transform:translateY(-2px);box-shadow:0 14px 30px rgba(15,23,42,.10);}
      .ehm-desktop-results .ehm-ad-img-wrap{position:relative;height:178px;background:#eef7fb;overflow:hidden;}
      .ehm-desktop-results .ehm-ad-img{width:100%;height:100%;object-fit:cover;display:block;}
      .ehm-desktop-results .ehm-badges{position:absolute;left:10px;right:10px;top:10px;display:flex;justify-content:space-between;gap:8px;align-items:center;}
      .ehm-desktop-results .ehm-badge{display:inline-flex;align-items:center;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:800;color:#fff;text-transform:uppercase;}
      .ehm-desktop-results .ehm-badge.featured{background:#f59e0b;}.ehm-desktop-results .ehm-badge.promoted{background:#06b6d4;}.ehm-desktop-results .ehm-badge.top{background:#ef4444;}
      .ehm-desktop-results .ehm-heart{position:absolute;right:10px;bottom:10px;width:38px;height:38px;border:0;border-radius:999px;background:rgba(255,255,255,.94);display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:23px;line-height:1;cursor:pointer;box-shadow:0 4px 14px rgba(15,23,42,.14);z-index:4;}
      .ehm-heart.active,.ehm-dynamic-heart.active{color:#ef4444!important;background:#fff1f2!important;}
      .ehm-ui-toast{position:fixed;z-index:10050;left:50%;bottom:96px;transform:translate(-50%,16px);opacity:0;pointer-events:none;padding:11px 16px;border-radius:999px;background:#0f172a;color:#fff;font-size:14px;font-weight:750;box-shadow:0 14px 36px rgba(15,23,42,.25);transition:.2s ease;white-space:nowrap}.ehm-ui-toast.error{background:#b91c1c}.ehm-ui-toast.show{opacity:1;transform:translate(-50%,0)}
      .ehm-report-modal{position:fixed;inset:0;z-index:10040;display:flex;align-items:center;justify-content:center;padding:18px}.ehm-report-backdrop{position:absolute;inset:0;background:rgba(15,23,42,.58);backdrop-filter:blur(3px)}.ehm-report-dialog{position:relative;width:min(520px,100%);max-height:calc(100vh - 36px);overflow:auto;background:#fff;border-radius:20px;padding:25px;box-shadow:0 30px 80px rgba(15,23,42,.3)}.ehm-report-dialog h2{margin:0 0 7px;color:#0f172a;font-size:24px}.ehm-report-dialog>p{margin:0 0 20px;color:#64748b;line-height:1.5}.ehm-report-close{position:absolute;right:14px;top:12px;width:36px;height:36px;border:0;border-radius:999px;background:#f1f5f9;font-size:25px;color:#475569;cursor:pointer}.ehm-report-dialog form{display:grid;gap:15px}.ehm-report-dialog label{display:grid;gap:7px;color:#334155;font-size:14px;font-weight:750}.ehm-report-dialog label span{font-weight:500;color:#94a3b8}.ehm-report-dialog select,.ehm-report-dialog textarea,.ehm-report-dialog input{width:100%;box-sizing:border-box;border:1.5px solid #dbe4ea;border-radius:12px;padding:11px 12px;background:#fff;color:#0f172a;font:inherit;outline:none}.ehm-report-dialog select:focus,.ehm-report-dialog textarea:focus,.ehm-report-dialog input:focus{border-color:#22b98b;box-shadow:0 0 0 3px rgba(34,185,139,.12)}.ehm-report-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:2px}.ehm-report-actions button{height:44px;border-radius:11px;padding:0 17px;font-weight:800;cursor:pointer}.ehm-report-cancel{border:1px solid #dbe4ea;background:#fff;color:#475569}.ehm-report-submit{border:0;background:#22b98b;color:#fff}.ehm-report-submit:disabled{opacity:.65;cursor:wait}.ehm-report-status{min-height:20px;font-size:13px}.ehm-report-status.error{color:#b91c1c}.ehm-report-status.success{color:#047857}.ehm-report-ad{width:100%;border:0;background:transparent;color:#64748b;font-size:13px;font-weight:750;cursor:pointer;padding:10px 6px}.ehm-report-ad:hover{color:#dc2626}
      .ehm-desktop-results .ehm-ad-body{padding:14px 16px 16px;}
      .ehm-desktop-results .ehm-ad-title{margin:0 0 10px;font-size:17px;line-height:1.32;font-weight:800;color:#0f172a;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:44px;}
      .ehm-desktop-results .ehm-ad-price{font-size:20px;font-weight:900;color:#0891b2;margin-bottom:8px;}
      .ehm-finance-line{margin:6px 0 8px;padding:7px 8px;border:1px solid #bae6fd;background:#ecfeff;border-radius:10px;color:#155e75;font-size:11.5px;line-height:1.35;}
      .ehm-finance-line b{color:#0f172a}.ehm-finance-line span{color:#0f766e;font-weight:700}
      .ehm-desktop-results .ehm-ad-meta{display:flex;gap:10px;flex-wrap:wrap;color:#64748b;font-size:13px;}
      .ehm-desktop-empty{background:#fff;border:1px solid #e5edf3;border-radius:18px;padding:44px;text-align:center;color:#64748b;font-size:17px;}
      @media(max-width:767px){
        html,body{max-width:100%;overflow-x:hidden!important;} body.ehm-modal-open{overflow:hidden!important;} body{padding-bottom:76px!important;}
        body.ehm-home-mobile-ready footer{display:none!important;}
        body.ehm-home-mobile-ready #root section[data-ehm-mobile-hidden],
        body.ehm-home-mobile-ready #root [data-ehm-mobile-hidden]{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;}
        .ehm-mobile-filterbar{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 44px!important;gap:8px!important;align-items:center!important;background:#fff!important;padding:10px 12px 12px!important;border-top:1px solid #edf2f7!important;border-bottom:1px solid #e8eef5!important;box-shadow:0 4px 14px rgba(15,23,42,.04)!important;position:relative!important;z-index:50!important;}
        .ehm-pill{height:44px!important;border:2px solid #d4dce5!important;border-radius:999px!important;background:#fff!important;color:#1f2937!important;display:grid!important;grid-template-columns:minmax(0,max-content) 16px!important;align-items:center!important;justify-content:center!important;column-gap:7px!important;min-width:0!important;padding:0 12px!important;font-size:14.5px!important;font-weight:750!important;letter-spacing:-.01em!important;line-height:1!important;box-shadow:0 1px 5px rgba(15,23,42,.04)!important;}
        .ehm-pill span{display:block!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;min-width:0!important;max-width:100%!important;text-align:center!important;}
        .ehm-pill b{width:16px!important;min-width:16px!important;height:16px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;color:#64748b!important;margin:0!important;}
        .ehm-pill b svg{width:15px!important;height:15px!important;display:block!important;}
        .ehm-view-toggle{height:44px!important;width:44px!important;min-width:44px!important;border-radius:999px!important;border:2px solid ${THEME}!important;background:#fff!important;color:${THEME_DARK}!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0!important;box-shadow:0 2px 8px rgba(6,182,212,.14)!important;}
        .ehm-view-toggle svg{width:20px!important;height:20px!important;display:block!important;}
        @media(max-width:390px){.ehm-mobile-filterbar{gap:7px!important;padding-left:10px!important;padding-right:10px!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr) 42px!important;}.ehm-pill{height:42px!important;font-size:13.8px!important;padding:0 9px!important;column-gap:5px!important;grid-template-columns:minmax(0,max-content) 14px!important;}.ehm-pill b{width:14px!important;min-width:14px!important;}.ehm-pill b svg{width:14px!important;height:14px!important;}.ehm-view-toggle{height:42px!important;width:42px!important;min-width:42px!important;}}
        .ehm-mobile-results{display:block!important;background:#f8fafc!important;min-height:calc(100vh - 190px)!important;padding:22px 16px 92px!important;position:relative!important;z-index:40!important;}
        .ehm-results-head h2{margin:0 0 4px!important;font-size:24px!important;line-height:1.2!important;letter-spacing:-.03em!important;font-weight:900!important;color:#0f172a!important;}
        .ehm-results-head p{margin:0 0 18px!important;color:#64748b!important;font-size:15px!important;}
        .ehm-results-grid{display:grid!important;gap:12px!important;}
        .ehm-results-grid.grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
        .ehm-results-grid.list{grid-template-columns:1fr!important;}
        .ehm-mobile-results .ehm-heart{position:absolute!important;right:9px!important;bottom:9px!important;width:36px!important;height:36px!important;border:0!important;border-radius:999px!important;background:rgba(255,255,255,.95)!important;display:flex!important;align-items:center!important;justify-content:center!important;color:#94a3b8!important;font-size:22px!important;line-height:1!important;z-index:4!important;box-shadow:0 3px 12px rgba(15,23,42,.14)!important;}
        .ehm-mobile-results .ehm-heart.active{color:#ef4444!important;background:#fff1f2!important;}
        .ehm-report-dialog{padding:22px 18px!important;border-radius:17px!important}.ehm-report-actions{display:grid!important;grid-template-columns:1fr 1fr!important}.ehm-report-actions button{width:100%!important;padding:0 10px!important}
        .ehm-ad-card{display:block!important;text-decoration:none!important;color:inherit!important;background:#fff!important;border:1px solid #e5edf3!important;border-radius:16px!important;overflow:hidden!important;box-shadow:0 8px 24px rgba(15,23,42,.07)!important;min-width:0!important;}
        .ehm-ad-img-wrap{height:132px!important;background:#eef5f9!important;position:relative!important;overflow:hidden!important;}
        .ehm-ad-img{width:100%!important;height:100%!important;object-fit:cover!important;display:block!important;}
        .ehm-badges{position:absolute!important;left:10px!important;top:10px!important;right:10px!important;display:flex!important;justify-content:space-between!important;gap:6px!important;pointer-events:none!important;}
        .ehm-badge{height:26px!important;line-height:26px!important;border-radius:8px!important;padding:0 9px!important;color:#fff!important;font-size:10.5px!important;font-weight:900!important;text-transform:uppercase!important;letter-spacing:.01em!important;}
        .ehm-badge.featured{background:#f59e0b!important;}.ehm-badge.promoted{background:${THEME}!important;margin-left:auto!important;}
        .ehm-heart{position:absolute!important;right:10px!important;bottom:10px!important;width:34px!important;height:34px!important;border-radius:999px!important;background:rgba(255,255,255,.93)!important;color:#94a3b8!important;display:flex!important;align-items:center!important;justify-content:center!important;font-size:20px!important;box-shadow:0 3px 12px rgba(15,23,42,.14)!important;}
        .ehm-ad-body{padding:12px!important;}
        .ehm-ad-title{margin:0 0 8px!important;color:#0f172a!important;font-size:14.5px!important;font-weight:800!important;line-height:1.35!important;display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;min-height:39px!important;}
        .ehm-ad-price{font-size:18px!important;line-height:1.2!important;font-weight:900!important;color:${THEME_DARK}!important;margin-bottom:8px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
        .ehm-finance-line{margin:6px 0 8px!important;padding:7px 8px!important;border:1px solid #bae6fd!important;background:#ecfeff!important;border-radius:10px!important;color:#155e75!important;font-size:10.5px!important;line-height:1.35!important;}
        .ehm-finance-line b{color:#0f172a!important}.ehm-finance-line span{color:#0f766e!important;font-weight:700!important}
        .ehm-ad-meta{display:flex!important;align-items:center!important;gap:9px!important;flex-wrap:wrap!important;color:#94a3b8!important;font-size:12px!important;line-height:1.3!important;}
        .ehm-condition{display:inline-flex!important;margin-top:8px!important;padding:4px 8px!important;border-radius:7px!important;background:#dcfce7!important;color:#16a34a!important;font-size:11px!important;font-weight:700!important;}
        .ehm-results-grid.list .ehm-ad-card{display:grid!important;grid-template-columns:112px minmax(0,1fr)!important;align-items:stretch!important;}
        .ehm-results-grid.list .ehm-ad-img-wrap{height:100%!important;min-height:116px!important;}
        .ehm-results-grid.list .ehm-ad-title{min-height:0!important;font-size:14px!important;}.ehm-results-grid.list .ehm-ad-price{font-size:16px!important;}
        .ehm-empty{padding:44px 12px!important;text-align:center!important;color:#64748b!important;font-size:15px!important;line-height:1.6!important;}
        .ehm-filter-modal{display:block!important;position:fixed!important;inset:0!important;z-index:99999!important;background:linear-gradient(180deg,#f8fdff 0%,#fff 25%)!important;color:#334155!important;overflow:hidden!important;}
        .ehm-modal-sheet{height:100%!important;display:flex!important;flex-direction:column!important;padding:18px 16px 0!important;}
        .ehm-modal-top{display:flex!important;align-items:center!important;justify-content:space-between!important;margin-bottom:16px!important;}.ehm-modal-top h2{margin:0!important;font-size:24px!important;line-height:1.15!important;font-weight:900!important;color:#082f49!important;letter-spacing:-.03em!important;}.ehm-close{border:0!important;background:transparent!important;color:#64748b!important;font-size:42px!important;line-height:1!important;padding:0 4px!important;}
        .ehm-modal-search{height:52px!important;border:1.5px solid rgba(6,182,212,.28)!important;border-radius:14px!important;display:flex!important;align-items:center!important;background:linear-gradient(180deg,#f2fbfe 0%,#fff 100%)!important;box-shadow:0 4px 14px rgba(6,182,212,.08)!important;padding:0 14px!important;margin-bottom:18px!important;}.ehm-modal-search span{font-size:26px!important;color:#7dd3e7!important;margin-right:10px!important;}.ehm-modal-search input{border:0!important;outline:0!important;background:transparent!important;width:100%!important;font-size:16px!important;font-weight:600!important;color:#334155!important;}.ehm-modal-search input::placeholder{color:#9ca3af!important;}
        .ehm-modal-body{overflow:auto!important;-webkit-overflow-scrolling:touch!important;padding-bottom:96px!important;}.ehm-row{width:100%!important;min-height:52px!important;border:0!important;border-bottom:1px solid #e6eeee!important;background:transparent!important;color:#475569!important;display:flex!important;align-items:center!important;justify-content:space-between!important;text-align:left!important;font-size:17px!important;font-weight:600!important;padding:0 2px!important;}.ehm-row.theme{color:${THEME_DARK}!important;font-weight:900!important;background:rgba(6,182,212,.04)!important;border-top:1px solid #dff4f8!important;}.ehm-row strong{font-size:22px!important;color:#94a3b8!important;font-weight:500!important;}.ehm-back{justify-content:flex-start!important;gap:12px!important;}.ehm-back .arrow{font-size:28px!important;line-height:1!important;}
        .ehm-modal-actions{position:fixed!important;left:0!important;right:0!important;bottom:0!important;background:rgba(255,255,255,.97)!important;backdrop-filter:blur(10px)!important;border-top:1px solid #ddeef3!important;padding:12px 16px calc(12px + env(safe-area-inset-bottom))!important;display:flex!important;gap:12px!important;box-shadow:0 -6px 20px rgba(15,23,42,.06)!important;}.ehm-action{height:54px!important;border-radius:12px!important;font-size:17px!important;font-weight:900!important;flex:1!important;}.ehm-action.reset{background:#fff!important;color:${THEME_DARK}!important;border:2px solid rgba(6,182,212,.72)!important;}.ehm-action.show{background:linear-gradient(180deg,${THEME} 0%,${THEME_DARK} 100%)!important;color:#fff!important;border:2px solid ${THEME}!important;}
        body.ehm-ad-detail-route .ehm-mobile-filterbar,body.ehm-ad-detail-route .ehm-mobile-results{display:none!important;}
        body.ehm-home-mobile-ready #root section[data-ehm-mobile-hidden="1"],
        body.ehm-home-mobile-ready #root footer[data-ehm-mobile-hidden="1"]{
          display:none!important;
          visibility:hidden!important;
          height:0!important;
          min-height:0!important;
          margin:0!important;
          padding:0!important;
          overflow:hidden!important;
        }
        body.ehm-home-mobile-ready #ehmMobileResults{
          display:block!important;
        }

      }
    `;
    document.head.appendChild(style);
  }

  function removeManagedHome() {
    document.getElementById('ehmMobileFilterbar')?.remove();
    document.getElementById('ehmMobileResults')?.remove();
    document.body.classList.remove('ehm-home-mobile-ready');
  }

  function hideOriginalHomeContent() {
    if (!isMobile() || !isHomeRoute()) return;
    document.body.classList.add('ehm-home-mobile-ready');
    const managed = new Set([document.getElementById('ehmMobileFilterbar'), document.getElementById('ehmMobileResults')].filter(Boolean));
    Array.from(document.querySelectorAll('#root section,#root footer,footer')).forEach((node) => {
      if (managed.has(node) || Array.from(managed).some((m) => m && (m.contains(node) || node.contains(m)))) return;
      const txt = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (!txt) return;
      if (/Latest Ads|Featured Ads|Browse Categories|Got something to sell|Trusted by thousands|What are you looking for|Sri Lanka's #1 Modern Marketplace/i.test(txt) || node.tagName.toLowerCase() === 'footer') {
        if (node.dataset.ehmMobileHidden === '1') return;
        node.setAttribute('data-ehm-mobile-hidden', '1');
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('visibility', 'hidden', 'important');
        node.style.setProperty('height', '0', 'important');
        node.style.setProperty('min-height', '0', 'important');
        node.style.setProperty('margin', '0', 'important');
        node.style.setProperty('padding', '0', 'important');
        node.style.setProperty('overflow', 'hidden', 'important');
      }
    });
  }

  function findHeaderAnchor() {
    const input = getSearchInput();
    const header = input?.closest('header') || document.querySelector('header');
    if (header) return header;

    // If React has not mounted the header/search yet, do not place the filter after #root.
    // Placing after #root causes the large blank space on first visit.
    return null;
  }

  function createFilterBar() {
    const anchor = findHeaderAnchor();
    if (!anchor) return null;

    let bar = document.getElementById('ehmMobileFilterbar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'ehmMobileFilterbar';
      bar.className = 'ehm-mobile-filterbar';
    }

    // Always move the bar directly under the header/search area.
    // This fixes first-load cases where it was inserted after the whole #root content.
    if (bar.previousElementSibling !== anchor || bar.parentElement !== anchor.parentElement) {
      anchor.insertAdjacentElement('afterend', bar);
    }

    const signature = JSON.stringify([getLocationLabel(), getCategoryLabel(), state.view]);
    if (bar.dataset.signature !== signature) {
      bar.dataset.signature = signature;
      bar.innerHTML = `
        <button type="button" class="ehm-pill" id="ehmLocationBtn"><span id="ehmLocationText">${esc(getLocationLabel())}</span><b>${chevronSvg()}</b></button>
        <button type="button" class="ehm-pill" id="ehmCategoryBtn"><span id="ehmCategoryText">${esc(getCategoryLabel())}</span><b>${chevronSvg()}</b></button>
        <button type="button" class="ehm-view-toggle" id="ehmViewBtn" aria-label="Switch view">${viewSvg(state.view === 'grid' ? 'list' : 'grid')}</button>
      `;
      bar.querySelector('#ehmLocationBtn').addEventListener('click', openLocationModal);
      bar.querySelector('#ehmCategoryBtn').addEventListener('click', openCategoryModal);
      bar.querySelector('#ehmViewBtn').addEventListener('click', () => {
        state.view = state.view === 'grid' ? 'list' : 'grid';
        createFilterBar();
        renderResults();
      });
    }
    return bar;
  }

  function createResultsHost() {
    const bar = document.getElementById('ehmMobileFilterbar') || createFilterBar();
    if (!bar) return null;

    let host = document.getElementById('ehmMobileResults');
    if (!host) {
      host = document.createElement('section');
      host.id = 'ehmMobileResults';
      host.className = 'ehm-mobile-results';
    }

    if (host.previousElementSibling !== bar || host.parentElement !== bar.parentElement) {
      bar.insertAdjacentElement('afterend', host);
    }
    return host;
  }

  function attachSearchHandlers() {
    const input = getSearchInput();
    if (!input) return;
    if (input.dataset.ehmSearchBound !== '1') {
      input.dataset.ehmSearchBound = '1';
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          renderResults();
        }
      }, true);
      input.addEventListener('input', () => {
        if (!input.value.trim()) renderResults();
      });
    }
    const wrapper = input.closest('form') || input.closest('div');
    const button = wrapper?.querySelector('button') || input.parentElement?.querySelector('button');
    if (button && button.dataset.ehmSearchBound !== '1') {
      button.dataset.ehmSearchBound = '1';
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        renderResults();
      }, true);
    }
  }

  function bannerForPlacement(placement) {
    return bannerAds.find((banner) =>
      isActivePromo(banner) &&
      String(banner.placement || '') === placement &&
      !!banner.image_url
    ) || null;
  }

  function bannerHtmlForPlacement(placement, className = '') {
    const banner = bannerForPlacement(placement);
    if (!banner) return '';
    const href = banner.target_url || banner.url || '';
    const image = `<img src="${esc(banner.image_url)}" alt="${esc(banner.title || 'Banner Ad')}">`;
    if (!href || href === '#') {
      return `<div class="ehm-promo-banner ${esc(className)}">${image}</div>`;
    }
    return `<a class="ehm-promo-banner ${esc(className)}" href="${esc(href)}" target="_blank" rel="noopener sponsored">${image}</a>`;
  }

  function activeBannerHtml() {
    return bannerHtmlForPlacement('home_mobile_between_filters_ads', 'ehm-home-banner');
  }

  function renderResults() {
    if (!isMobile() || !isHomeRoute()) return;
    const host = createResultsHost();
    if (!host) return;
    const rows = filteredAds();
    const active = hasActiveFilters();
    const html = `
      ${activeBannerHtml()}
      <div class="ehm-results-head ${active ? '' : 'ehm-results-head-default'}">
        ${active ? '<h2>Search Results</h2>' : ''}
        <p>${rows.length ? (active ? `${rows.length} matching ads found` : 'Recently added listings') : 'No matching ads found'}</p>
      </div>
      ${rows.length ? `<div class="ehm-results-grid ${state.view}">${rows.map(renderAdCard).join('')}</div>` : '<div class="ehm-empty">No matching ads<br>found.</div>'}
    `;
    if (host.__ehmRenderedHtml !== html) {
      host.__ehmRenderedHtml = html;
      host.innerHTML = html;
    }
    const viewBtn = document.getElementById('ehmViewBtn');
    const viewHtml = viewSvg(state.view === 'grid' ? 'list' : 'grid');
    if (viewBtn && viewBtn.innerHTML !== viewHtml) viewBtn.innerHTML = viewHtml;
    hideOriginalHomeContent();
  }

  function renderAdCard(ad) {
    const href = `/ad/${encodeURIComponent(ad.id)}`;
    const location = ad.location || ad.cityName || '';
    const price = formatPrice(ad.price, ad.currency);
    return `
      <a class="ehm-ad-card" href="${esc(href)}" data-ehm-ad-id="${esc(ad.id)}">
        <div class="ehm-ad-img-wrap">
          ${ad.image ? `<img class="ehm-ad-img" src="${esc(ad.image)}" alt="${esc(ad.title)}" loading="lazy">` : ''}
          <div class="ehm-badges">${topPromotionForAd(ad) ? '<span class="ehm-badge top">Top Ad</span>' : (ad.isFeatured ? '<span class="ehm-badge featured">Featured</span>' : '<span></span>')}${ad.isPromoted ? '<span class="ehm-badge promoted">Promoted</span>' : ''}</div>
          <button type="button" class="ehm-heart${isFavoriteId(ad.id) ? ' active' : ''}" data-ehm-favorite-id="${esc(ad.id)}" aria-label="Add to favourites" aria-pressed="${isFavoriteId(ad.id) ? 'true' : 'false'}"><span data-ehm-heart-icon>${isFavoriteId(ad.id) ? '♥' : '♡'}</span></button>
        </div>
        <div class="ehm-ad-body">
          <h3 class="ehm-ad-title">${esc(ad.title)}</h3>
          ${price ? `<div class="ehm-ad-price">${esc(price)}</div>` : ''}
          ${financeCardHtml(ad)}
          <div class="ehm-ad-meta"><span>⌖ ${esc(location)}</span><span>◷ ${esc(relativeDate(ad.postedAt))}</span></div>
          ${ad.condition ? `<span class="ehm-condition">${esc(String(ad.condition).toLowerCase() === 'used' ? 'Used' : 'New')}</span>` : ''}
        </div>
      </a>
    `;
  }

  function closeModal() {
    document.getElementById('ehmFilterModal')?.remove();
    document.body.classList.remove('ehm-modal-open');
  }

  function openBaseModal(title, placeholder, bodyHtml) {
    closeModal();
    const modal = document.createElement('div');
    modal.id = 'ehmFilterModal';
    modal.className = 'ehm-filter-modal';
    modal.innerHTML = `
      <div class="ehm-modal-sheet">
        <div class="ehm-modal-top"><h2>${esc(title)}</h2><button type="button" class="ehm-close" aria-label="Close">×</button></div>
        <div class="ehm-modal-search"><span>⌕</span><input type="search" placeholder="${esc(placeholder)}"></div>
        <div class="ehm-modal-body">${bodyHtml}</div>
      </div>
    `;
    document.body.appendChild(modal);
    document.body.classList.add('ehm-modal-open');
    modal.querySelector('.ehm-close').addEventListener('click', closeModal);
    const search = modal.querySelector('input[type="search"]');
    search.addEventListener('input', () => {
      const term = search.value.trim().toLowerCase();
      modal.querySelectorAll('[data-filter-text]').forEach((row) => {
        row.style.display = (row.getAttribute('data-filter-text') || '').toLowerCase().includes(term) ? '' : 'none';
      });
    });
    return modal;
  }

  function openLocationModal() {
    const rows = lookups.districts.map((d) => `<button type="button" class="ehm-row" data-district="${esc(d.id)}" data-filter-text="${esc(d.name)}"><span>${esc(d.name)}</span><strong>›</strong></button>`).join('');
    const modal = openBaseModal('All of Sri Lanka', 'Search for a location', `
      <button type="button" class="ehm-row theme" data-all-location data-filter-text="all sri lanka">All ads in Sri Lanka</button>
      ${rows}
      <div class="ehm-modal-actions"><button type="button" class="ehm-action reset" data-reset-location>Reset</button></div>
    `);
    modal.querySelector('[data-all-location]').addEventListener('click', () => {
      state.district = null;
      state.city = null;
      closeModal();
      updatePills();
      renderResults();
    });
    modal.querySelector('[data-reset-location]').addEventListener('click', () => {
      state.district = null;
      state.city = null;
      closeModal();
      updatePills();
      renderResults();
    });
    modal.querySelectorAll('[data-district]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const district = lookups.districts.find((d) => isSameId(d.id, btn.dataset.district));
        if (district) openCityModal(district);
      });
    });
  }

  function openCityModal(district) {
    const cities = getDistrictCities(district);
    const rows = cities.map((city) => `<button type="button" class="ehm-row" data-city="${esc(city.id)}" data-filter-text="${esc(city.name)}">${esc(city.name)}</button>`).join('');
    const modal = openBaseModal(district.name, 'Search for a location', `
      <button type="button" class="ehm-row ehm-back" data-back-location><span class="arrow">←</span><span>Back to all locations</span></button>
      <button type="button" class="ehm-row theme" data-all-district data-filter-text="all ads in ${esc(district.name)}">All ads in ${esc(district.name)}</button>
      ${rows || `<div class="ehm-empty">No cities added yet.</div>`}
      <div class="ehm-modal-actions"><button type="button" class="ehm-action reset" data-reset-location>Reset</button><button type="button" class="ehm-action show" data-show-location>Show ads</button></div>
    `);
    modal.querySelector('[data-back-location]').addEventListener('click', openLocationModal);
    modal.querySelector('[data-all-district]').addEventListener('click', () => {
      state.district = district;
      state.city = null;
      closeModal();
      updatePills();
      renderResults();
    });
    modal.querySelector('[data-reset-location]').addEventListener('click', () => {
      state.district = null;
      state.city = null;
      closeModal();
      updatePills();
      renderResults();
    });
    modal.querySelector('[data-show-location]').addEventListener('click', () => {
      state.district = district;
      state.city = null;
      closeModal();
      updatePills();
      renderResults();
    });
    modal.querySelectorAll('[data-city]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const city = getDistrictCities(district).find((c) => isSameId(c.id, btn.dataset.city));
        state.district = district;
        state.city = city || null;
        closeModal();
        updatePills();
        renderResults();
      });
    });
  }

  function openCategoryModal() {
    const rows = lookups.categories.map((category) => {
      const hasChildren = Array.isArray(category.children) && category.children.length > 0;
      return `<button type="button" class="ehm-row" ${hasChildren ? `data-parent-category="${esc(category.id)}"` : `data-category="${esc(category.id)}"`} data-filter-text="${esc(category.name)}"><span>${esc(category.name)}</span>${hasChildren ? '<strong>›</strong>' : ''}</button>`;
    }).join('');
    const modal = openBaseModal('Category', 'Search category', `
      <button type="button" class="ehm-row theme" data-all-category data-filter-text="all categories">All Categories</button>
      ${rows}
      <div class="ehm-modal-actions"><button type="button" class="ehm-action reset" data-reset-category>Reset</button></div>
    `);
    modal.querySelector('[data-all-category]').addEventListener('click', () => {
      state.category = null;
      closeModal();
      updatePills();
      renderResults();
    });
    modal.querySelector('[data-reset-category]').addEventListener('click', () => {
      state.category = null;
      closeModal();
      updatePills();
      renderResults();
    });
    modal.querySelectorAll('[data-parent-category]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const category = lookups.categories.find((c) => isSameId(c.id, btn.dataset.parentCategory));
        if (category) openSubCategoryModal(category);
      });
    });
    modal.querySelectorAll('[data-category]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const category = lookups.categories.find((c) => isSameId(c.id, btn.dataset.category));
        state.category = category ? { ...category, type: 'parent' } : null;
        closeModal();
        updatePills();
        renderResults();
      });
    });
  }

  function openSubCategoryModal(category) {
    const children = category.children || [];
    const rows = children.map((child) => `<button type="button" class="ehm-row" data-subcategory="${esc(child.id)}" data-filter-text="${esc(child.name)}">${esc(child.name)}</button>`).join('');
    const modal = openBaseModal(category.name, 'Search category', `
      <button type="button" class="ehm-row ehm-back" data-back-category><span class="arrow">←</span><span>Back to all categories</span></button>
      <button type="button" class="ehm-row theme" data-all-parent-category data-filter-text="all ads in ${esc(category.name)}">All ads in ${esc(category.name)}</button>
      ${rows || `<div class="ehm-empty">No sub categories added yet.</div>`}
      <div class="ehm-modal-actions"><button type="button" class="ehm-action reset" data-reset-category>Reset</button><button type="button" class="ehm-action show" data-show-category>Show ads</button></div>
    `);
    modal.querySelector('[data-back-category]').addEventListener('click', openCategoryModal);
    modal.querySelector('[data-all-parent-category]').addEventListener('click', () => {
      state.category = { ...category, type: 'parent' };
      closeModal();
      updatePills();
      renderResults();
    });
    modal.querySelector('[data-reset-category]').addEventListener('click', () => {
      state.category = null;
      closeModal();
      updatePills();
      renderResults();
    });
    modal.querySelector('[data-show-category]').addEventListener('click', () => {
      state.category = { ...category, type: 'parent' };
      closeModal();
      updatePills();
      renderResults();
    });
    modal.querySelectorAll('[data-subcategory]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const child = children.find((c) => isSameId(c.id, btn.dataset.subcategory));
        state.category = child ? { ...child, parentId: category.id, type: 'child' } : null;
        closeModal();
        updatePills();
        renderResults();
      });
    });
  }

  function updatePills() {
    const locationText = document.getElementById('ehmLocationText');
    const categoryText = document.getElementById('ehmCategoryText');
    if (locationText) locationText.textContent = getLocationLabel();
    if (categoryText) categoryText.textContent = getCategoryLabel();
  }


  function isVisibleElement(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return rect.width > 20 && rect.height > 15 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  function categoryOptionsHtml(selectedId = '') {
    const rows = ['<option value="">All Categories</option>'];
    lookups.categories.forEach((parent) => {
      rows.push(`<option value="parent:${esc(parent.id)}"${selectedId === `parent:${parent.id}` ? ' selected' : ''}>${esc(parent.name)}</option>`);
      if (Array.isArray(parent.children) && parent.children.length) {
        rows.push(`<optgroup label="${esc(parent.name)}">`);
        parent.children.forEach((child) => {
          const val = `child:${parent.id}:${child.id}`;
          rows.push(`<option value="${esc(val)}"${selectedId === val ? ' selected' : ''}>${esc(child.name)}</option>`);
        });
        rows.push('</optgroup>');
      }
    });
    return rows.join('');
  }

  function categoryValueFromState() {
    if (!state.category) return '';
    if (state.category.type === 'child') return `child:${state.category.parentId}:${state.category.id}`;
    return `parent:${state.category.id}`;
  }

  function setCategoryFromSelect(value) {
    if (!value) {
      state.category = null;
      return;
    }
    const parts = value.split(':');
    if (parts[0] === 'parent') {
      const parent = lookups.categories.find((c) => isSameId(c.id, parts[1]));
      state.category = parent ? { ...parent, type: 'parent' } : null;
      return;
    }
    if (parts[0] === 'child') {
      const parent = lookups.categories.find((c) => isSameId(c.id, parts[1]));
      const child = parent?.children?.find((c) => isSameId(c.id, parts[2]));
      state.category = child ? { ...child, parentId: parent.id, type: 'child' } : null;
    }
  }

  function districtOptionsHtml(selectedId = '') {
    return '<option value="">All districts</option>' + lookups.districts.map((d) => `<option value="${esc(d.id)}"${isSameId(d.id, selectedId) ? ' selected' : ''}>${esc(d.name)}</option>`).join('');
  }

  function cityOptionsHtml(selectedId = '') {
    if (!state.district) return '<option value="">Select district first</option>';
    const cities = getDistrictCities(state.district);
    return '<option value="">All cities</option>' + cities.map((c) => `<option value="${esc(c.id)}"${isSameId(c.id, selectedId) ? ' selected' : ''}>${esc(c.name)}</option>`).join('');
  }

  function desktopLocationValueFromState() {
    if (state.city?.id) return `city:${state.district?.id || ''}:${state.city.id}`;
    if (state.district?.id) return `district:${state.district.id}`;
    return '';
  }

  function desktopLocationOptionsHtml(selected = '') {
    const rows = ['<option value="">All of Sri Lanka</option>'];
    lookups.districts.forEach((district) => {
      const districtValue = `district:${district.id}`;
      rows.push(`<option value="${esc(districtValue)}"${selected === districtValue ? ' selected' : ''}>All ads in ${esc(district.name)}</option>`);
      const cities = getDistrictCities(district);
      if (cities.length) {
        rows.push(`<optgroup label="${esc(district.name)}">`);
        cities.forEach((city) => {
          const val = `city:${district.id}:${city.id}`;
          rows.push(`<option value="${esc(val)}"${selected === val ? ' selected' : ''}>${esc(city.name)}</option>`);
        });
        rows.push('</optgroup>');
      }
    });
    return rows.join('');
  }

  function setDesktopLocationFromSelect(value) {
    state.district = null;
    state.city = null;
    if (!value) return;

    const parts = String(value).split(':');
    if (parts[0] === 'district') {
      state.district = lookups.districts.find((d) => isSameId(d.id, parts[1])) || null;
      return;
    }

    if (parts[0] === 'city') {
      const district = lookups.districts.find((d) => isSameId(d.id, parts[1])) || null;
      state.district = district;
      const cities = district ? getDistrictCities(district) : [];
      state.city = cities.find((c) => isSameId(c.id, parts.slice(2).join(':'))) || null;
    }
  }

  function findDesktopInputs() {
    return Array.from(document.querySelectorAll('input')).filter((input) => {
      const ph = input.getAttribute('placeholder') || '';
      return isVisibleElement(input) && /search|looking/i.test(ph);
    });
  }

  function hideDesktopTopDistrictControl() {
    if (isMobile() || !isHomeRoute()) return;

    // Safety first: remove any hidden class accidentally applied to layout containers.
    document.querySelectorAll('div.ehm-desktop-top-location-hidden, section.ehm-desktop-top-location-hidden, header.ehm-desktop-top-location-hidden')
      .forEach((node) => node.classList.remove('ehm-desktop-top-location-hidden'));

    Array.from(document.querySelectorAll('select,button')).forEach((node) => {
      if (!isVisibleElement(node)) return;

      const rect = node.getBoundingClientRect();
      // Only hide small control elements, never page/header containers.
      if (rect.width > 280 || rect.height > 70) return;

      const txt = (node.textContent || node.value || '').replace(/\s+/g, ' ').trim();
      const inHero = !!node.closest('section') && /What are you looking for|Search for anything/i.test(node.closest('section')?.textContent || '');
      if (inHero) return;

      if (/All Districts/i.test(txt)) {
        node.classList.add('ehm-desktop-top-location-hidden');
      }
    });
  }

  function activeDesktopQueryInput() {
    const inputs = findDesktopInputs();
    return inputs.find((input) => /what are you looking/i.test(input.placeholder || '')) || inputs[0] || null;
  }

  function setDesktopQueryFromInput(input) {
    if (input) state.query = (input.value || '').trim();
  }

  function enhanceDesktopTopSearch() {
    if (isMobile() || !isHomeRoute()) return;
    hideDesktopTopDistrictControl();
    document.querySelectorAll('.ehm-desktop-top-category').forEach((node) => node.remove());

    const inputs = findDesktopInputs();
    inputs.forEach((input, index) => {
      const wrapper = input.closest('form') || input.parentElement;
      if (!wrapper) return;

      const isHero = /search for anything/i.test(input.placeholder || '') || /What are you looking for/i.test(input.closest('section')?.textContent || '');

      // Hide only small original location controls. Never hide wrapper divs/sections.
      Array.from(wrapper.querySelectorAll('select,button')).forEach((node) => {
        if (node === input || node.id?.startsWith('ehm')) return;
        const rect = node.getBoundingClientRect();
        if (rect.width > 280 || rect.height > 70) return;
        const txt = (node.textContent || node.value || '').replace(/\s+/g, ' ').trim();
        if (/All Districts|All Locations|Colombo|Kandy|Galle|Gampaha|Matara/i.test(txt) && !/Search|Post an Ad|Sign Up|Log In/i.test(txt)) {
          node.classList.add('ehm-desktop-top-location-hidden');
        }
      });

      const button = wrapper.querySelector('button[type="submit"], button');
      if (button && button.dataset.ehmDesktopSearch !== '1') {
        button.dataset.ehmDesktopSearch = '1';
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation?.();
          setDesktopQueryFromInput(input);
          renderDesktopResults(true);
        }, true);
      }
      if (input.dataset.ehmDesktopSearch !== '1') {
        input.dataset.ehmDesktopSearch = '1';
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            setDesktopQueryFromInput(input);
            renderDesktopResults(true);
          }
        }, true);
        input.addEventListener('input', () => {
          state.query = (input.value || '').trim();
          if (!state.query) renderDesktopResults(true, false);
        });
      }
    });
  }

  function syncDesktopCategorySelects() {
    document.querySelectorAll('.ehm-desktop-category-select').forEach((select) => {
      select.value = categoryValueFromState();
    });
  }

  function syncDesktopLocationSelects() {
    const selected = desktopLocationValueFromState();
    const optionsHtml = desktopLocationOptionsHtml('');

    const syncOne = (select) => {
      if (!select) return;
      if (select.__ehmOptionsHtml !== optionsHtml) {
        select.innerHTML = optionsHtml;
        select.__ehmOptionsHtml = optionsHtml;
      }
      select.value = selected;
    };

    syncOne(document.getElementById('ehmDesktopHeroLocation'));

    // Remove old separate city controls if an older cached DOM still has them.
    document.querySelectorAll('.ehm-desktop-city-select').forEach((select) => {
      if (select.id !== 'ehmDesktopHeroLocation') select.remove();
    });

    document.querySelectorAll('.ehm-desktop-district-select').forEach((select) => {
      if (select.id !== 'ehmDesktopHeroLocation') syncOne(select);
    });
  }

  function balanceDesktopHeroStats() {
    if (isMobile() || !isHomeRoute()) return;

    document.querySelectorAll('.ehm-desktop-stats-hidden-placeholder').forEach((node) => node.classList.remove('ehm-desktop-stats-hidden-placeholder'));

    const bar = document.getElementById('ehmDesktopHeroFilterbar');
    if (!bar) return;

    const searchInput = findDesktopInputs().find((input) => /search for anything/i.test(input.placeholder || ''));
    const heroSection = searchInput?.closest('section') || Array.from(document.querySelectorAll('section')).find((section) => /Safe & Secure|125K\+ Active Ads|48K\+ Happy Users/i.test(section.textContent || ''));
    if (!heroSection) return;

    const statsTextRe = /Safe & Secure|125K\+ Active Ads|48K\+ Happy Users/i;

    let stats = document.getElementById('ehmDesktopStatsBalanced');
    if (!stats) {
      const candidates = Array.from(heroSection.querySelectorAll('div,ul,p')).filter((node) => {
        if (node.id === 'ehmDesktopStatsBalanced' || bar.contains(node)) return false;
        const txt = (node.textContent || '').replace(/\s+/g, ' ').trim();
        if (!statsTextRe.test(txt)) return false;
        const rect = node.getBoundingClientRect();
        // Pick the compact row, not the entire hero section.
        return rect.width > 220 && rect.width < 900 && rect.height > 12 && rect.height < 90 && txt.length < 120;
      }).sort((a, b) => {
        const at = (a.textContent || '').length;
        const bt = (b.textContent || '').length;
        return at - bt;
      });

      stats = candidates[0] || null;
      if (!stats) return;
      stats.id = 'ehmDesktopStatsBalanced';
    }

    stats.classList.add('ehm-desktop-stats-balanced');
    bar.classList.add('ehm-stats-balanced');

    // Move the stats row directly below the dropdowns.
    if (stats.previousElementSibling !== bar || stats.parentElement !== bar.parentElement) {
      bar.insertAdjacentElement('afterend', stats);
    }

  }

  function enhanceDesktopHeroControls() {
    if (isMobile() || !isHomeRoute()) return;
    const heroInput = findDesktopInputs().find((input) => /search for anything/i.test(input.placeholder || ''));
    if (!heroInput) return;

    const section = heroInput.closest('section') || heroInput.closest('div');
    if (!section) return;

    // Hide existing native/simple location select near hero search. Never
    // re-hide the EheMehe replacement controls on later stabilization passes.
    Array.from(section.querySelectorAll('select')).forEach((sel) => {
      if (sel.id?.startsWith('ehm') || sel.closest('#ehmDesktopHeroFilterbar')) return;
      const txt = Array.from(sel.options || []).map((o) => o.textContent).join(' ');
      if (/All Locations|Colombo|Kandy|Galle|Gampaha|Matara/i.test(txt)) {
        sel.classList.add('ehm-desktop-top-location-hidden');
        // Hide the select's small icon/wrapper too. Hiding only the select left
        // a dead location-pin control inside the search box.
        const nativeWrap = sel.closest('[data-yw="c3JjL2NvbXBvbmVudHMvSGVyb1NlY3Rpb24udHN4QDYwOjE0"]') || sel.parentElement;
        if (nativeWrap && !nativeWrap.contains(heroInput)) nativeWrap.classList.add('ehm-desktop-native-location-hidden');
      }
    });

    let bar = document.getElementById('ehmDesktopHeroFilterbar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'ehmDesktopHeroFilterbar';
      bar.className = 'ehm-desktop-hero-filterbar';
      const searchWrap = heroInput.closest('form') || heroInput.parentElement;
      const heroSearchParent = searchWrap?.parentElement || searchWrap || heroInput;
      heroSearchParent.insertAdjacentElement('afterend', bar);
    }

    if (!bar.querySelector('#ehmDesktopHeroCategory') || !bar.querySelector('#ehmDesktopHeroLocation')) {
      bar.innerHTML = `
        <select class="ehm-desktop-category-select" id="ehmDesktopHeroCategory" aria-label="Category"></select>
        <select class="ehm-desktop-district-select" id="ehmDesktopHeroLocation" aria-label="Location"></select>
      `;
    }

    const cat = bar.querySelector('#ehmDesktopHeroCategory');
    const location = bar.querySelector('#ehmDesktopHeroLocation');
    const catHtml = categoryOptionsHtml('');
    const locationHtml = desktopLocationOptionsHtml('');

    // Keep the native selects stable. Replacing their HTML on every observer
    // tick interrupted desktop interaction and caused unnecessary layout work.
    if (cat.__ehmOptionsHtml !== catHtml) {
      cat.innerHTML = catHtml;
      cat.__ehmOptionsHtml = catHtml;
    }
    if (location.__ehmOptionsHtml !== locationHtml) {
      location.innerHTML = locationHtml;
      location.__ehmOptionsHtml = locationHtml;
    }
    cat.value = categoryValueFromState();
    location.value = desktopLocationValueFromState();

    if (cat.dataset.ehmBound !== '1') {
      cat.dataset.ehmBound = '1';
      cat.addEventListener('change', () => {
        setCategoryFromSelect(cat.value);
        setDesktopQueryFromInput(heroInput);
        syncDesktopCategorySelects();
        renderDesktopResults(true);
      });
    }

    if (location.dataset.ehmBound !== '1') {
      location.dataset.ehmBound = '1';
      location.addEventListener('change', () => {
        setDesktopLocationFromSelect(location.value);
        setDesktopQueryFromInput(heroInput);
        syncDesktopLocationSelects();
        renderDesktopResults(true);
      });
    }

    balanceDesktopHeroStats();
  }

  function desktopHomeSectionByHeading(label) {
    const heading = Array.from(document.querySelectorAll('#root section h2')).find((node) => String(node.textContent || '').trim() === label);
    return heading?.closest('section') || null;
  }

  function arrangeDesktopHomeSections() {
    if (isMobile() || !isHomeRoute()) return null;
    const sections = Array.from(document.querySelectorAll('#root section'));
    const browse = sections.find((section) => String(section.querySelector('h2')?.textContent || '').trim() === 'Browse Categories') || null;

    // The Supabase-backed section is the only Latest Ads source. Hide every
    // bundled Featured/Latest section so the final order is always:
    // Hero → Browse Categories → Latest Ads.
    sections.forEach((section) => {
      if (section.id === 'ehmDesktopResults') return;
      const heading = String(section.querySelector('h2')?.textContent || '').trim();
      if (heading === 'Featured Ads' || heading === 'Latest Ads') {
        if (section.style.getPropertyValue('display') !== 'none' || section.style.getPropertyPriority('display') !== 'important') {
          section.style.setProperty('display', 'none', 'important');
        }
      }
    });
    return browse;
  }

  function createDesktopResultsHost() {
    let host = document.getElementById('ehmDesktopResults');
    if (!host) {
      host = document.createElement('section');
      host.id = 'ehmDesktopResults';
      host.className = 'ehm-desktop-results';
    }
    const browse = arrangeDesktopHomeSections();
    const hero = Array.from(document.querySelectorAll('section')).find((s) => /What are you looking for|Sri Lanka's #1 Modern Marketplace/i.test(s.textContent || ''));
    const anchor = browse || hero;
    if (anchor && (host.previousElementSibling !== anchor || host.parentElement !== anchor.parentElement)) {
      anchor.insertAdjacentElement('afterend', host);
    } else if (!anchor && !host.parentElement) {
      (document.querySelector('#root') || document.body).appendChild(host);
    }
    return host;
  }

  function renderDesktopResults(forceShow = false, shouldScroll = true) {
    if (isMobile() || !isHomeRoute()) return;
    const active = hasActiveFilters();
    const host = createDesktopResultsHost();
    if (!forceShow && !active) {
      host.style.display = 'none';
      return;
    }

    const rows = filteredAds();
    host.style.display = 'block';
    host.innerHTML = `
      ${activeBannerHtml()}
      <div class="ehm-desktop-results-head">
        <div>
          <h2>${active ? 'Search Results' : 'Latest Ads'}</h2>
          <p>${rows.length ? `${rows.length} matching ads found` : 'No matching ads found'}</p>
        </div>
      </div>
      ${rows.length ? `<div class="ehm-desktop-grid">${rows.map(renderAdCard).join('')}</div>` : '<div class="ehm-desktop-empty">No matching ads found.</div>'}
    `;
    if (shouldScroll) host.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function stabilizeDesktopHomeShell() {
    if (isMobile() || !isHomeRoute() || desktopShellMutating) return false;
    desktopShellMutating = true;
    try {
      document.documentElement.classList.add('ehm-desktop-home-prepaint');
      document.body?.classList?.remove('ehm-ad-detail-route');
      enhanceDesktopTopSearch();
      enhanceDesktopHeroControls();
      syncDesktopCategorySelects();
      syncDesktopLocationSelects();
      balanceDesktopHeroStats();
      arrangeDesktopHomeSections();
      return !!document.getElementById('ehmDesktopHeroFilterbar');
    } finally {
      Promise.resolve().then(() => { desktopShellMutating = false; });
    }
  }

  async function ensureDesktopHome() {
    if (isMobile() || !isHomeRoute()) return;

    // Render the final desktop shell immediately from bundled fallback data.
    // Network lookups must never control the first paint or swap the hero UI
    // several seconds after the page has already become visible.
    stabilizeDesktopHomeShell();
    renderDesktopResults(true, false);

    if (!desktopDataPromise) {
      desktopDataPromise = Promise.allSettled([
        loadLookups(),
        loadFinanceSettings(),
        loadAds(),
        loadPromotions()
      ]).finally(() => { desktopDataPromise = null; });
    }
    await desktopDataPromise;

    if (isMobile() || !isHomeRoute()) return;
    stabilizeDesktopHomeShell();
    renderDesktopResults(true, false);
  }

  async function ensureHomeMobile() {
    if (!isMobile() || !isHomeRoute()) return false;
    document.body.classList.remove('ehm-ad-detail-route');
    installStyles();

    // Build the exact mobile layout immediately using the bundled/static ads.
    // This avoids showing the original Featured Ads carousel while waiting for Supabase.
    const bar = createFilterBar();
    if (!bar) return false;

    const earlyHost = createResultsHost();
    if (!earlyHost) return false;

    attachSearchHandlers();
    updatePills();
    renderResults();
    hideOriginalHomeContent();

    // Load live data in the background and refresh the same Latest Ads grid.
    await Promise.all([
      loadLookups(),
      loadFinanceSettings(),
      loadAds(),
      loadPromotions()
    ]);

    attachSearchHandlers();
    updatePills();
    renderResults();
    hideOriginalHomeContent();

    // Keep the managed mobile UI pinned right under the header.
    createFilterBar();
    createResultsHost();
    return true;
  }


  function injectAdDetailFinance() {
    if (!isAdRoute()) return;
    if (document.getElementById('ehmDynamicAdDetail')) {
      document.getElementById('ehmAdDetailFinance')?.remove();
      return;
    }

    const rawId = decodeURIComponent(
      window.location.pathname.replace(/^\/ad\//, '').replace(/\/$/, '')
    );
    const ad = allAds().find(
      (item) =>
        String(item.id) === rawId ||
        String(item.id) === String(rawId).replace(/^static-/, '')
    );

    const existing = document.getElementById('ehmAdDetailFinance');

    if (!ad || !isVehicleAd(ad)) {
      if (existing) existing.remove();
      return;
    }

    const finance = calcVehicleFinance(ad.price);
    if (!finance) {
      if (existing) existing.remove();
      return;
    }

    const priceText = formatPrice(ad.price, ad.currency || 'LKR');
    const normalizedPrice = priceText.replace(/\s+/g, ' ').trim();

    const priceCandidates = Array.from(
      document.querySelectorAll('main h1, main h2, main h3, main p, main span, main div')
    )
      .filter((node) => {
        if (node.id === 'ehmAdDetailFinance' || node.closest('#ehmAdDetailFinance')) return false;
        const text = String(node.textContent || '').replace(/\s+/g, ' ').trim();
        if (text !== normalizedPrice) return false;
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        const aScore = a.children.length * 100000 + aRect.width * aRect.height;
        const bScore = b.children.length * 100000 + bRect.width * bRect.height;
        return aScore - bScore;
      });

    const priceNode = priceCandidates[0];

    if (!priceNode) {
      if (existing) existing.remove();
      return;
    }

    const downPayment = formatPrice(finance.downPayment, ad.currency || 'LKR');
    const monthlyPayment = formatPrice(finance.monthlyPayment, ad.currency || 'LKR');
    const phone = String(finance.companyPhone || '').trim();
    const phoneHref = phone.replace(/[^+\d]/g, '');

    const content = `
      <div class="ehm-finance-detail-item">
        <span>Down Payment</span>
        <strong>${esc(downPayment)}</strong>
      </div>
      <div class="ehm-finance-detail-item">
        <span>Monthly Payment</span>
        <strong>${esc(monthlyPayment)}</strong>
      </div>
      <div class="ehm-finance-detail-item ehm-finance-detail-phone">
        <span>Finance Company</span>
        ${phoneHref
          ? `<a href="tel:${esc(phoneHref)}">${esc(phone)}</a>`
          : `<strong>${esc(phone)}</strong>`}
      </div>
    `;

    if (existing) {
      if (existing.__ehmContent !== content) {
        existing.__ehmContent = content;
        existing.innerHTML = content;
      }
      if (existing.previousElementSibling !== priceNode) {
        priceNode.insertAdjacentElement('afterend', existing);
      }
      return;
    }

    const box = document.createElement('div');
    box.id = 'ehmAdDetailFinance';
    box.className = 'ehm-finance-detail';
    box.__ehmContent = content;
    box.innerHTML = content;

    priceNode.insertAdjacentElement('afterend', box);
  }

  function injectAdDetailBanner() {
    if (!isMobile() || !isAdRoute()) return;
    const existing = document.getElementById('ehmAdDetailBanner');
    const html = bannerHtmlForPlacement('ad_detail_mobile_before_image', 'ehm-detail-banner');
    if (!html) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'ehmAdDetailBanner';
    wrapper.className = 'ehm-ad-detail-banner-wrap';
    wrapper.innerHTML = html;

    const breadcrumb = Array.from(document.querySelectorAll('nav, .section-container, div'))
      .filter((node) => {
        const text = String(node.textContent || '').replace(/\s+/g, ' ').trim();
        return /^Home\s*[›>]/i.test(text) && text.length < 260;
      })
      .sort((a,b) => (a.getBoundingClientRect().height || 999) - (b.getBoundingClientRect().height || 999))[0];

    const galleryImage = document.querySelector('main img');
    const galleryContainer = galleryImage?.closest('section, article, div');

    if (breadcrumb?.parentElement) {
      breadcrumb.insertAdjacentElement('afterend', wrapper);
    } else if (galleryContainer?.parentElement) {
      galleryContainer.insertAdjacentElement('beforebegin', wrapper);
    } else {
      (document.querySelector('main') || document.body).prepend(wrapper);
    }
  }

  function hideAdDetailLocation() {
    if (!isAdRoute()) return;
    document.body.classList.add('ehm-ad-detail-route');
    removeManagedHome();
    if (document.getElementById('ehmDynamicAdDetail')) {
      document.getElementById('ehmAdDetailFinance')?.remove();
      document.getElementById('ehmSellerPhone')?.remove();
      injectAdDetailBanner();
      return;
    }
    injectAdDetailBanner();
    injectAdDetailFinance();
    injectSellerPhoneAboveCall();

    const norm = (text) => String(text || '').replace(/\s+/g, ' ').trim();

    const hideNode = (node) => {
      if (!node || node.dataset.ehmHiddenAdLocation === '1') return;
      node.dataset.ehmHiddenAdLocation = '1';
      node.style.setProperty('display', 'none', 'important');
      node.style.setProperty('visibility', 'hidden', 'important');
      node.style.setProperty('height', '0', 'important');
      node.style.setProperty('min-height', '0', 'important');
      node.style.setProperty('max-height', '0', 'important');
      node.style.setProperty('margin', '0', 'important');
      node.style.setProperty('padding', '0', 'important');
      node.style.setProperty('overflow', 'hidden', 'important');
      node.style.setProperty('border', '0', 'important');
      node.style.setProperty('box-shadow', 'none', 'important');
    };

    const isLocationBlock = (node) => {
      const text = norm(node.textContent).toLowerCase();
      if (!text) return false;

      const hasLocationWord = /(^|\s)location(\s|$)/i.test(text);
      const hasPlace = /(sri lanka|colombo|gampaha|kalutara|kandy|matale|nuwara eliya|galle|matara|hambantota|jaffna|kurunegala|puttalam|anuradhapura|badulla|monaragala|ratnapura|kegalle|negombo|dehiwala|peradeniya|maharagama|gampola)/i.test(text);

      // Location card normally contains only "Location + place".
      // Keep it strict enough not to hide seller card / description.
      return hasLocationWord && hasPlace && text.length < 420;
    };

    // Find the smallest card/container that contains Location + place.
    const candidates = Array.from(document.querySelectorAll('section, article, aside, div'))
      .filter(isLocationBlock)
      .sort((a, b) => norm(a.textContent).length - norm(b.textContent).length);

    candidates.forEach((node) => {
      let box = node;

      // Prefer a rounded/card-like wrapper, but don't climb into seller card or whole page.
      for (let i = 0; i < 5 && box.parentElement; i += 1) {
        const text = norm(box.textContent).toLowerCase();
        const looksLikeSeller = /(call now|send message|member since|total ads posted|seller|ravindu|kamal)/i.test(text);
        const looksLikeDescription = /description/i.test(text);
        if (looksLikeSeller || looksLikeDescription) break;

        const style = window.getComputedStyle(box);
        const rect = box.getBoundingClientRect();
        const rounded = parseFloat(style.borderRadius || '0') > 8;
        const cardLike = rounded || style.boxShadow !== 'none' || rect.height > 120;

        if (isLocationBlock(box) && cardLike && rect.height < 420) break;
        if (!isLocationBlock(box.parentElement)) break;

        box = box.parentElement;
      }

      hideNode(box);
    });

    // Backup method: exact "Location" heading -> hide nearest card parent.
    Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,span,p,div')).forEach((el) => {
      if (norm(el.textContent).toLowerCase() !== 'location') return;

      let box = el.parentElement;
      for (let i = 0; i < 8 && box; i += 1) {
        const text = norm(box.textContent).toLowerCase();
        const hasPlace = /(sri lanka|colombo|gampaha|kalutara|kandy|matale|nuwara eliya|galle|matara|hambantota|jaffna|kurunegala|puttalam|anuradhapura|badulla|monaragala|ratnapura|kegalle|negombo|dehiwala|peradeniya|maharagama|gampola)/i.test(text);
        const hasSeller = /(call now|send message|member since|total ads posted)/i.test(text);
        const hasDescription = /description/i.test(text);

        if (hasPlace && !hasSeller && !hasDescription && text.length < 420) {
          hideNode(box);
          break;
        }
        box = box.parentElement;
      }
    });

    // Backup method: map placeholder/icon area with place text, then hide its nearby card.
    Array.from(document.querySelectorAll('div')).forEach((node) => {
      const text = norm(node.textContent).toLowerCase();
      if (!/(sri lanka|colombo|gampaha|kandy|galle|matara|jaffna|peradeniya)/i.test(text)) return;
      let box = node;
      for (let i = 0; i < 6 && box; i += 1) {
        const boxText = norm(box.textContent).toLowerCase();
        if (/location/i.test(boxText) && boxText.length < 420 && !/(call now|send message|member since|description)/i.test(boxText)) {
          hideNode(box);
          break;
        }
        box = box.parentElement;
      }
    });
  }

  function openAdPageAtTop(force = false) {
    if (!isAdRoute()) return;

    const routeKey = `${location.pathname}${location.search}${location.hash}`;
    if (!force && window.__ehmAdTopRoute === routeKey) return;
    window.__ehmAdTopRoute = routeKey;

    try {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    } catch (_) {}

    const reset = () => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    };

    reset();
    requestAnimationFrame(reset);
    setTimeout(reset, 40);
    setTimeout(reset, 160);
    setTimeout(reset, 450);
  }


  function currentRouteAdId() {
    if (!isAdRoute()) return '';
    try {
      return decodeURIComponent(window.location.pathname.replace(/^\/ad\//, '').replace(/\/$/, ''));
    } catch (_) {
      return window.location.pathname.replace(/^\/ad\//, '').replace(/\/$/, '');
    }
  }

  async function loadAdForCurrentRoute() {
    const rawId = currentRouteAdId();
    if (!rawId) return null;
    const cleanId = String(rawId).replace(/^static-/, '');

    const existing = allAds().find((ad) => String(ad.id) === rawId || String(ad.id) === cleanId);
    if (existing) return existing;

    const cached = readPublicDetailAd(cleanId);
    if (cached) return cached;
    if (/^\d+$/.test(cleanId)) return null;

    let client = window.supabaseClient;
    if (!client && typeof window.waitForSupabaseClient === 'function') {
      try { client = await window.waitForSupabaseClient(2500); } catch (_) { client = null; }
    }
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('ads')
        .select('*')
        .eq('id', cleanId)
        .eq('status', 'approved')
        .limit(1);
      if (error || !Array.isArray(data) || !data[0]) return null;
      const normalized = normalizeAd(data[0], 'supabase');
      cachePublicDetailAd(normalized);
      if (!supabaseAds.some((ad) => String(ad.id) === String(normalized.id))) {
        supabaseAds = [normalized, ...supabaseAds];
      }
      return normalized;
    } catch (_) {
      return null;
    }
  }

  function detailFieldLabel(key) {
    const labels = {
      brand: 'Brand / Make', make: 'Brand / Make', model: 'Model', mileage: 'Mileage (km)',
      fuel_type: 'Fuel Type', fueltype: 'Fuel Type', transmission: 'Gear / Transmission',
      gear_transmission: 'Gear / Transmission', body_type: 'Body Type', car_body_type: 'Car Body Type',
      ownership: 'Ownership', manufacture_year: 'Manufacture Year', registration_year: 'Registration Year',
      engine_capacity: 'Engine Capacity', engine_cc: 'Engine Capacity (cc)', bedrooms: 'Bedrooms',
      bathrooms: 'Bathrooms', land_size: 'Land Size', property_type: 'Property Type'
    };
    const normalized = String(key || '').toLowerCase();
    if (labels[normalized]) return labels[normalized];
    return String(key || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function publicCustomFields(ad) {
    const custom = ad?.customFields && typeof ad.customFields === 'object' ? ad.customFields : {};
    const hidden = new Set([
      'owner_user_id','owner_name','owner_contact_email','category_slug','category_name',
      'subcategory_slug','subcategory_name','district','city','contact_phones',
      'verified_contact_phones','phone_verification_proof','submitted_at'
    ]);
    return Object.entries(custom).filter(([key, value]) => {
      if (hidden.has(key) || value === null || value === undefined || value === '') return false;
      if (Array.isArray(value)) return value.length > 0 && !value.some((item) => typeof item === 'object');
      return typeof value !== 'object';
    });
  }

  function detailLocation(ad) {
    const custom = ad?.customFields || {};
    const city = ad.cityName || custom.city || ad.location || '';
    const district = custom.district || ad.districtId || '';
    if (city && district && slugify(city) !== slugify(district)) return `${city}, ${district}`;
    return city || district || 'Sri Lanka';
  }

  function dynamicDetailHtml(ad) {
    const images = Array.from(new Set((Array.isArray(ad.images) ? ad.images : [ad.image]).filter(Boolean)));
    const mainImage = images[0] || '';
    const location = detailLocation(ad);
    const phones = Array.from(new Set([
      ...(Array.isArray(ad.contactPhones) ? ad.contactPhones : []), ad.contactPhone, ad.seller?.phone
    ].map((v) => String(v || '').trim()).filter(Boolean)));
    const primaryDial = (phones[0] || '').replace(/[^+\d]/g, '');
    const sellerName = ad.seller?.name || ad.customFields?.owner_name || 'Seller';
    const sellerEmail = ad.seller?.email || ad.customFields?.owner_contact_email || '';
    const customRows = publicCustomFields(ad);
    const finance = isVehicleAd(ad) ? calcVehicleFinance(ad.price) : null;

    return `
      <div class="ehm-dynamic-breadcrumb"><a href="/">Home</a><span>›</span><span>${esc(ad.categoryName || ad.customFields?.category_name || 'Marketplace')}</span><span>›</span><strong>${esc(ad.title)}</strong></div>
      <div class="ehm-dynamic-layout">
        <div class="ehm-dynamic-main">
          <section class="ehm-dynamic-gallery">
            <div class="ehm-dynamic-main-image">${mainImage ? `<img id="ehmDynamicMainImage" src="${esc(mainImage)}" alt="${esc(ad.title)}">` : '<div class="ehm-dynamic-no-image">No photo available</div>'}</div>
            ${images.length > 1 ? `<div class="ehm-dynamic-thumbs">${images.map((src, index) => `<button type="button" class="${index === 0 ? 'active' : ''}" data-ehm-detail-image="${esc(src)}"><img src="${esc(src)}" alt=""></button>`).join('')}</div>` : ''}
          </section>
          <section class="ehm-dynamic-card ehm-dynamic-summary">
            <div class="ehm-dynamic-title-row"><h1>${esc(ad.title)}</h1><button type="button" class="ehm-dynamic-heart${isFavoriteId(ad.id) ? ' active' : ''}" data-ehm-favorite-id="${esc(ad.id)}" aria-label="Save ad" aria-pressed="${isFavoriteId(ad.id) ? 'true' : 'false'}"><span data-ehm-heart-icon>${isFavoriteId(ad.id) ? '♥' : '♡'}</span></button></div>
            <div class="ehm-dynamic-price">${esc(formatPrice(ad.price, ad.currency || 'LKR'))}</div>
            ${finance ? `<div class="ehm-dynamic-finance"><div><span>Down Payment</span><strong>${esc(formatPrice(finance.downPayment, ad.currency || 'LKR'))}</strong></div><div><span>Monthly Payment</span><strong>${esc(formatPrice(finance.monthlyPayment, ad.currency || 'LKR'))}</strong></div><div><span>Finance Company</span><strong>${esc(finance.companyPhone || '')}</strong></div></div>` : ''}
            <div class="ehm-dynamic-meta">${ad.condition ? `<span>${esc(String(ad.condition).toLowerCase() === 'used' ? 'Used' : 'New')}</span>` : ''}<span>⌖ ${esc(location)}</span><span>◷ ${esc(relativeDate(ad.postedAt))}</span></div>
            <div class="ehm-dynamic-description"><h2>Description</h2><p>${esc(ad.description || 'No description provided.').replace(/\n/g, '<br>')}</p></div>
          </section>
          ${customRows.length ? `<section class="ehm-dynamic-card"><h2>Category Details</h2><div class="ehm-dynamic-specs">${customRows.map(([key, value]) => `<div><span>${esc(detailFieldLabel(key))}</span><strong>${esc(Array.isArray(value) ? value.join(', ') : value)}</strong></div>`).join('')}</div></section>` : ''}
        </div>
        <aside class="ehm-dynamic-side">
          <section class="ehm-dynamic-card ehm-dynamic-contact">
            <h2>Contact Seller</h2>
            <div class="ehm-dynamic-seller-name"><strong>${esc(sellerName)}</strong>${sellerEmail ? `<span>${esc(sellerEmail)}</span>` : ''}</div>
            ${phones.length ? `<div class="ehm-dynamic-phones">${phones.map((phone, index) => `<a href="tel:${esc(phone.replace(/[^+\d]/g, ''))}"><span>${index === 0 ? 'Primary' : `Contact ${index + 1}`}</span><strong>${esc(formatPublicPhone(phone))}</strong></a>`).join('')}</div>` : '<p>No contact number available.</p>'}
            ${primaryDial ? `<a class="ehm-dynamic-call" href="tel:${esc(primaryDial)}">Call Now</a><a class="ehm-dynamic-message" href="sms:${esc(primaryDial)}">Send Message</a>` : ''}
          </section>
          <section class="ehm-dynamic-card ehm-dynamic-safety"><h2>Stay Safe</h2><p>Inspect the item before paying and meet the seller in a safe public place.</p><button type="button" class="ehm-report-ad" data-ehm-report-ad="${esc(ad.id)}">⚑ Report this ad</button></section>
        </aside>
      </div>`;
  }

  function installDynamicDetailStyles() {
    if (document.getElementById('ehmDynamicDetailStyles')) return;
    const style = document.createElement('style');
    style.id = 'ehmDynamicDetailStyles';
    style.textContent = `
      .ehm-dynamic-detail{max-width:1180px!important;margin:0 auto!important;padding:18px 20px 110px!important;text-align:left!important;color:#0f172a!important}
      .ehm-dynamic-breadcrumb{display:flex;gap:9px;align-items:center;flex-wrap:wrap;font-size:13px;color:#64748b;margin:0 0 18px}.ehm-dynamic-breadcrumb a{color:#0891b2;text-decoration:none}.ehm-dynamic-breadcrumb strong{max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .ehm-dynamic-layout{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:24px;align-items:start}.ehm-dynamic-main{min-width:0;display:grid;gap:18px}.ehm-dynamic-side{display:grid;gap:18px;position:sticky;top:92px}
      .ehm-dynamic-card,.ehm-dynamic-gallery{background:#fff;border:1px solid #e6edf2;border-radius:18px;overflow:hidden;box-shadow:0 8px 28px rgba(15,23,42,.06)}.ehm-dynamic-card{padding:22px}.ehm-dynamic-card h2{margin:0 0 16px;font-size:18px;color:#0f172a}
      .ehm-dynamic-main-image{height:min(56vw,520px);min-height:300px;background:#edf3f6;display:flex;align-items:center;justify-content:center}.ehm-dynamic-main-image img{width:100%;height:100%;object-fit:contain;display:block}.ehm-dynamic-no-image{color:#94a3b8;font-weight:700}
      .ehm-dynamic-thumbs{display:flex;gap:10px;padding:12px;overflow:auto}.ehm-dynamic-thumbs button{width:76px;height:58px;min-width:76px;padding:0;border:2px solid transparent;border-radius:10px;overflow:hidden;background:#eef2f5}.ehm-dynamic-thumbs button.active{border-color:#22b98b}.ehm-dynamic-thumbs img{width:100%;height:100%;object-fit:cover}
      .ehm-dynamic-title-row{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.ehm-dynamic-title-row h1{font-size:28px;line-height:1.25;margin:0;color:#0f172a}.ehm-dynamic-heart{width:44px;height:44px;min-width:44px;border:1px solid #dce5eb;border-radius:12px;background:#fff;font-size:26px;color:#94a3b8}.ehm-dynamic-price{font-size:30px;font-weight:900;color:#0f9f76;margin:15px 0}
      .ehm-dynamic-meta{display:flex;gap:9px;flex-wrap:wrap;margin-bottom:20px}.ehm-dynamic-meta span{padding:7px 10px;border-radius:9px;background:#f1f5f9;color:#475569;font-size:13px;font-weight:700}.ehm-dynamic-meta span:first-child{background:#dcfce7;color:#15803d}
      .ehm-dynamic-description{border-top:1px solid #edf1f4;padding-top:20px}.ehm-dynamic-description h2{margin-bottom:10px}.ehm-dynamic-description p{margin:0;color:#475569;line-height:1.7;overflow-wrap:anywhere}
      .ehm-dynamic-finance{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:0 0 16px}.ehm-dynamic-finance div{padding:11px;border:1px solid #bae6fd;background:#ecfeff;border-radius:11px}.ehm-dynamic-finance span{display:block;font-size:11px;color:#0e7490}.ehm-dynamic-finance strong{display:block;margin-top:3px;font-size:13px;color:#0f172a;overflow-wrap:anywhere}
      .ehm-dynamic-specs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 22px}.ehm-dynamic-specs div{padding:13px 0;border-bottom:1px solid #edf1f4}.ehm-dynamic-specs span{display:block;color:#64748b;font-size:13px;margin-bottom:4px}.ehm-dynamic-specs strong{font-size:15px;color:#0f172a;overflow-wrap:anywhere}
      .ehm-dynamic-contact h2{font-size:20px}.ehm-dynamic-seller-name{display:grid;gap:3px;padding:0 0 14px}.ehm-dynamic-seller-name strong{font-size:16px}.ehm-dynamic-seller-name span{font-size:12px;color:#64748b;overflow-wrap:anywhere}.ehm-dynamic-phones{display:grid;gap:8px;margin-bottom:14px}.ehm-dynamic-phones a{display:flex;justify-content:space-between;gap:10px;padding:11px;border:1px solid #dfe8ed;border-radius:11px;text-decoration:none}.ehm-dynamic-phones span{font-size:12px;color:#64748b}.ehm-dynamic-phones strong{color:#0f172a}.ehm-dynamic-call,.ehm-dynamic-message{display:flex;height:50px;align-items:center;justify-content:center;border-radius:12px;text-decoration:none;font-weight:900;margin-top:10px}.ehm-dynamic-call{background:#22b98b;color:#fff}.ehm-dynamic-message{border:2px solid #22b98b;color:#0f9f76;background:#fff}.ehm-dynamic-safety p{margin:0;color:#64748b;line-height:1.55}
      @media(max-width:900px){.ehm-dynamic-layout{grid-template-columns:1fr}.ehm-dynamic-side{position:static}.ehm-dynamic-main-image{height:52vw;min-height:260px}}
      @media(max-width:767px){.ehm-dynamic-detail{padding:12px 12px 100px!important}.ehm-dynamic-breadcrumb{margin-bottom:12px}.ehm-dynamic-card{padding:16px;border-radius:15px}.ehm-dynamic-gallery{border-radius:15px}.ehm-dynamic-main-image{height:72vw;min-height:220px}.ehm-dynamic-title-row h1{font-size:21px}.ehm-dynamic-price{font-size:24px}.ehm-dynamic-finance{grid-template-columns:1fr}.ehm-dynamic-specs{grid-template-columns:1fr}.ehm-dynamic-side{gap:14px}.ehm-dynamic-layout,.ehm-dynamic-main{gap:14px}}
    `;
    document.head.appendChild(style);
  }

  function bindDynamicDetailGallery(host) {
    host.querySelectorAll('[data-ehm-detail-image]').forEach((button) => {
      button.addEventListener('click', () => {
        const image = host.querySelector('#ehmDynamicMainImage');
        if (image) image.src = button.getAttribute('data-ehm-detail-image') || '';
        host.querySelectorAll('[data-ehm-detail-image]').forEach((item) => item.classList.toggle('active', item === button));
      });
    });
  }

  function renderDynamicAdDetail(ad) {
    if (!isAdRoute() || !ad || ad.source !== 'supabase') return false;
    installDynamicDetailStyles();
    const signature = JSON.stringify([
      ad.id, ad.title, ad.price, ad.description, ad.images, ad.customFields, ad.contactPhones,
      financeSettings.downPaymentPercent, financeSettings.annualRatePercent, financeSettings.months, financeSettings.companyPhone
    ]);
    let host = document.getElementById('ehmDynamicAdDetail');
    if (host && host.__ehmSignature === signature) {
      finishDynamicDetailPending();
      return true;
    }

    if (!host) {
      const notFoundHeading = Array.from(document.querySelectorAll('#root h1,#root h2,#root h3')).find((node) => String(node.textContent || '').trim() === 'Ad not found');
      const target = notFoundHeading?.closest('.section-container') || notFoundHeading?.parentElement;
      if (!target) return false;
      target.id = 'ehmDynamicAdDetail';
      target.className = 'ehm-dynamic-detail';
      host = target;
    }

    host.__ehmSignature = signature;
    const html = dynamicDetailHtml(ad);
    if (host.__ehmHtml !== html) {
      host.__ehmHtml = html;
      host.innerHTML = html;
      bindDynamicDetailGallery(host);
    }
    document.body.classList.add('ehm-dynamic-detail-active');
    cachePublicDetailAd(ad);
    finishDynamicDetailPending();
    return true;
  }

  function currentAdForDetail() {
    const rawId = decodeURIComponent(
      window.location.pathname.replace(/^\/ad\//, '').replace(/\/$/, '')
    );
    const cleanId = String(rawId).replace(/^static-/, '');

    const normalized = allAds().find(
      (item) => String(item.id) === rawId || String(item.id) === cleanId
    );
    if (normalized) return normalized;

    const staticRaw = STATIC_ADS.find(
      (item) => String(item.id) === rawId || String(item.id) === cleanId
    );
    return staticRaw ? normalizeAd(staticRaw, 'static') : null;
  }

  function formatPublicPhone(value) {
    const digits=String(value||'').replace(/\D/g,'');
    if(/^94\d{9}$/.test(digits))return `+94 ${digits.slice(2,4)} ${digits.slice(4,7)} ${digits.slice(7)}`;
    return String(value||'').trim();
  }

  function enableStaticReportButton() {
    if (!isAdRoute()) return false;
    const button = Array.from(document.querySelectorAll('button')).find((node) => /^report this ad$/i.test(String(node.textContent || '').trim()));
    if (!button) return false;
    button.setAttribute('data-ehm-report-ad', currentReportAdId());
    button.type = 'button';
    return true;
  }

  function injectSellerPhoneAboveCall() {
    if (!isAdRoute()) return false;
    if (document.getElementById('ehmDynamicAdDetail')) {
      document.getElementById('ehmSellerPhone')?.remove();
      return false;
    }

    const callButton = Array.from(document.querySelectorAll('a[href^="tel:"], a, button')).find((node) => {
      if(node.closest?.('#ehmSellerPhone'))return false;
      const text = String(node.textContent || '').replace(/\s+/g, ' ').trim();
      return /^call now$/i.test(text) || /^call$/i.test(text) || String(node.getAttribute?.('href') || '').startsWith('tel:');
    });
    if (!callButton || !callButton.parentElement) return false;

    const ad = currentAdForDetail();
    const hrefPhone = String(callButton.getAttribute?.('href') || '').replace(/^tel:/i, '').trim();
    const phones = Array.from(new Set([
      ...(Array.isArray(ad?.contactPhones) ? ad.contactPhones : []),
      ad?.contactPhone, ad?.contact_phone, ad?.phone, ad?.phone_number, ad?.seller?.phone, hrefPhone
    ].map(value=>String(value||'').trim()).filter(Boolean)));

    const existing = document.getElementById('ehmSellerPhone');
    if (!phones.length) { if (existing) existing.remove(); return false; }

    const content = `<div class="ehm-seller-phone-heading">Contact Number${phones.length===1?'':'s'}</div><div class="ehm-seller-phone-list">${phones.map((phone,index)=>{
      const dialPhone=phone.replace(/[^\d+]/g,'');
      return `<a href="tel:${esc(dialPhone)}"><span>${index===0?'Primary':`Contact ${index+1}`}</span><strong>${esc(formatPublicPhone(phone))}</strong></a>`;
    }).join('')}</div>`;

    if (callButton.tagName === 'A') callButton.setAttribute('href', `tel:${phones[0].replace(/[^\d+]/g,'')}`);
    if (existing) {
      if (existing.__ehmContent !== content) {
        existing.__ehmContent = content;
        existing.innerHTML = content;
      }
      if (existing.nextElementSibling !== callButton) callButton.insertAdjacentElement('beforebegin', existing);
      return true;
    }
    const row = document.createElement('div');
    row.id = 'ehmSellerPhone'; row.className = 'ehm-seller-phone'; row.__ehmContent = content; row.innerHTML = content;
    callButton.insertAdjacentElement('beforebegin', row);
    return true;
  }

  let sellerRetryRoute = '';
  let sellerRetryTimers = [];
  function scheduleSellerPhoneInjection(force = false) {
    const routeKey = isAdRoute() ? `${location.pathname}${location.search}` : '';
    if (!routeKey) return;
    if (!force && sellerRetryRoute === routeKey) return;

    sellerRetryRoute = routeKey;
    sellerRetryTimers.forEach((timer) => clearTimeout(timer));
    sellerRetryTimers = [0, 100, 300, 700, 1400, 2600].map((delay) =>
      setTimeout(injectSellerPhoneAboveCall, delay)
    );
  }

  async function sync() {
    if (syncing) return;
    syncing = true;
    window.__ehmMutating = true;
    try {
      installStyles();

      if (isAdRoute()) {
        openAdPageAtTop();
        removeManagedHome();
        beginDynamicDetailPending();

        // The old flow waited for the complete ads list and finance/settings
        // queries before looking up the selected ad. Fetch the route ad first,
        // and use the click/session cache immediately when available.
        const instantAd = readPublicDetailAd(currentRouteAdId());
        if (instantAd) renderDynamicAdDetail(instantAd);

        const routeAdPromise = loadAdForCurrentRoute();
        const routeAd = await routeAdPromise;
        if (routeAd) {
          renderDynamicAdDetail(routeAd);
        } else if (isDatabaseAdRoute()) {
          // Only reveal React's real not-found state after the approved-ad
          // lookup has actually completed. It is never shown as a loading UI.
          finishDynamicDetailPending();
        }

        // Non-critical page enhancements refresh in the background and no
        // longer delay the first ad-detail render.
        Promise.allSettled([loadFinanceSettings(), loadPromotions(), loadAds()]).then(() => {
          if (!isAdRoute()) return;
          const latest = readPublicDetailAd(currentRouteAdId()) || currentAdForDetail();
          if (latest?.source === 'supabase') renderDynamicAdDetail(latest);
          injectAdDetailBanner();
          injectAdDetailFinance();
          injectSellerPhoneAboveCall();
          enableStaticReportButton();
          hideAdDetailLocation();
        });

        injectAdDetailBanner();
        injectAdDetailFinance();
        injectSellerPhoneAboveCall();
        enableStaticReportButton();
        scheduleSellerPhoneInjection();
        hideAdDetailLocation();
        return;
      }

      document.body.classList.remove('ehm-dynamic-detail-active');

      if (!isMobile()) {
        removeManagedHome();
        if (isHomeRoute()) await ensureDesktopHome();
        return;
      }

      if (isHomeRoute()) {
        await ensureHomeMobile();
      } else {
        removeManagedHome();
      }
    } finally {
      syncing = false;
      setTimeout(() => { window.__ehmMutating = false; }, 0);
    }
  }

  function scheduleSync(delay = 80) {
    window.clearTimeout(window.__ehmSyncTimer);
    window.__ehmSyncTimer = window.setTimeout(sync, delay);
  }

  let routeObserver = null;
  let routeObserverActive = false;
  let adStabilizeRoute = '';
  let adStabilizeTimers = [];

  function needsRouteObserver() {
    return isHomeRoute() || isAdRoute();
  }

  function refreshRouteObserver() {
    if (!routeObserver) {
      routeObserver = new MutationObserver(() => {
        if (window.__ehmMutating) return;
        const path = window.location.pathname;
        if (path !== lastPath) {
          lastPath = path;
          handleRouteChange();
          return;
        }
        if (isHomeRoute()) {
          if (isMobile()) {
            hideOriginalHomeContent();
            scheduleSync(80);
          } else {
            // React may re-render the native hero after auth/data hydration.
            // Re-apply only the lightweight shell synchronously so the page
            // never falls back to the competing old desktop layout.
            stabilizeDesktopHomeShell();
          }
        } else if (isAdRoute()) {
          scheduleSync(80);
        }
      });
    }

    const shouldObserve = needsRouteObserver();
    if (shouldObserve && !routeObserverActive) {
      routeObserver.observe(document.body, { childList: true, subtree: true });
      routeObserverActive = true;
    } else if (!shouldObserve && routeObserverActive) {
      routeObserver.disconnect();
      routeObserverActive = false;
    }
  }

  function scheduleAdDetailStabilization(force = false) {
    const routeKey = isAdRoute() ? `${location.pathname}${location.search}` : '';
    if (!routeKey) {
      adStabilizeRoute = '';
      adStabilizeTimers.forEach((timer) => clearTimeout(timer));
      adStabilizeTimers = [];
      return;
    }
    if (!force && adStabilizeRoute === routeKey) return;

    adStabilizeRoute = routeKey;
    adStabilizeTimers.forEach((timer) => clearTimeout(timer));
    adStabilizeTimers = [0, 120, 350, 800, 1600, 3000].map((delay) =>
      setTimeout(() => scheduleSync(0), delay)
    );
    scheduleSellerPhoneInjection(true);
  }

  function handleRouteChange() {
    if (!isHomeRoute() || isMobile()) document.documentElement.classList.remove('ehm-desktop-home-prepaint');
    else document.documentElement.classList.add('ehm-desktop-home-prepaint');
    refreshRouteObserver();
    if (isAdRoute()) {
      window.__ehmAdTopRoute = '';
      beginDynamicDetailPending();
      openAdPageAtTop(true);
      scheduleAdDetailStabilization(true);
    } else {
      finishDynamicDetailPending();
      scheduleAdDetailStabilization(true);
    }
    scheduleSync(30);
  }

  function installRouteWatchers() {
    if (window.__ehmFinalWatchers) return;
    window.__ehmFinalWatchers = true;

    document.addEventListener('click', (event) => {
      const favoriteButton = event.target?.closest?.('[data-ehm-favorite-id]');
      if (favoriteButton) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        toggleFavoriteId(favoriteButton.getAttribute('data-ehm-favorite-id'));
        return;
      }

      const reportButton = event.target?.closest?.('[data-ehm-report-ad]') || event.target?.closest?.('button');
      if (reportButton && (reportButton.hasAttribute?.('data-ehm-report-ad') || /^report this ad$/i.test(String(reportButton.textContent || '').trim()))) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        openReportModal(reportButton.getAttribute?.('data-ehm-report-ad') || currentReportAdId());
        return;
      }

      if (event.target?.closest?.('[data-ehm-report-close]')) {
        event.preventDefault();
        closeReportModal();
        return;
      }

      const link = event.target?.closest?.('a[data-ehm-ad-id],a[href^="/ad/"]');
      if (!link) return;
      const href = String(link.getAttribute('href') || '');
      const rawId = link.getAttribute('data-ehm-ad-id') || href.replace(/^\/ad\//, '').split(/[?#]/)[0];
      const cleanId = decodeURIComponent(String(rawId || '')).replace(/^static-/, '');
      const selected = allAds().find((ad) => String(ad.id).replace(/^static-/, '') === cleanId);
      if (selected?.source === 'supabase') cachePublicDetailAd(selected);
      if (cleanId && !/^\d+$/.test(cleanId)) beginDynamicDetailPending();
    }, true);

    document.addEventListener('submit', (event) => {
      if (event.target?.id !== 'ehmReportForm') return;
      event.preventDefault();
      submitAdReport(event.target);
    }, true);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && document.getElementById('ehmReportModal')) closeReportModal();
    });

    const originalPush = history.pushState;
    const originalReplace = history.replaceState;
    history.pushState = function () {
      const previousPath = location.pathname;
      const result = originalPush.apply(this, arguments);
      if (location.pathname !== previousPath) {
        lastPath = location.pathname;
        handleRouteChange();
      }
      return result;
    };
    history.replaceState = function () {
      const previousPath = location.pathname;
      const result = originalReplace.apply(this, arguments);
      if (location.pathname !== previousPath) {
        lastPath = location.pathname;
        handleRouteChange();
      }
      return result;
    };
    window.addEventListener('popstate', () => {
      lastPath = location.pathname;
      handleRouteChange();
    });
    window.addEventListener('pageshow', () => {
      lastPath = location.pathname;
      handleRouteChange();
    });
    window.addEventListener('resize', () => {
      refreshRouteObserver();
      scheduleSync(120);
    });

    refreshRouteObserver();

    // The main route observer is now active, so the early pre-paint watcher can
    // be retired without leaving a gap where React could restore the old hero.
    window.__ehmDesktopPrepaintObserver?.disconnect?.();
    window.__ehmDesktopPrepaintObserver = null;
  }

  function installDesktopHomePrepaintWatcher() {
    if (window.__ehmDesktopPrepaintObserver || isMobile() || !isHomeRoute()) return;
    document.documentElement.classList.add('ehm-desktop-home-prepaint');

    const observer = new MutationObserver(() => {
      if (window.__ehmMutating || desktopShellMutating) return;
      stabilizeDesktopHomeShell();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.__ehmDesktopPrepaintObserver = observer;

    // Works both when React has already mounted and when it mounts in the next
    // microtask. MutationObserver callbacks run before the browser paints.
    stabilizeDesktopHomeShell();
  }

  async function init() {
    installStyles();
    installRouteWatchers();
    stabilizeDesktopHomeShell();
    if (isAdRoute()) {
      window.__ehmAdTopRoute = '';
      openAdPageAtTop(true);
      scheduleAdDetailStabilization(true);
    }
    await sync();
    setTimeout(sync, 300);
    setTimeout(sync, 900);
  }

  // This script is loaded before the deferred React bundle finishes its first
  // render. Stabilize the desktop home during React's first mount, and hide the
  // database-detail main area so the bundled temporary not-found branch cannot
  // flash on screen.
  installStyles();
  installDesktopHomePrepaintWatcher();
  beginDynamicDetailPending();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
