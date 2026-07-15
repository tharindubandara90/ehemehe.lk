
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
  let supabaseAds = [];
  let adPromotions = [];
  let bannerAds = [];
  let promotionsLoaded = false;
  const AD_PROMOTIONS_KEY = 'ehemeheAdPromotions';
  const BANNER_ADS_KEY = 'ehemeheBannerAds';
  function readLocalArray(key) { try { return JSON.parse(localStorage.getItem(key) || '[]') || []; } catch (e) { return []; } }
  function isActivePromo(row) { if (!row) return false; if (row.is_active === false || row.is_enabled === false || String(row.status || 'active').toLowerCase() === 'disabled') return false; const end = row.end_at || row.expires_at; if (!end) return true; const t = new Date(end).getTime(); return !Number.isFinite(t) || t >= Date.now(); }
  let syncing = false;
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
    const categoryName = raw.categoryName || raw.categories?.name || raw.category || '';
    const cityName = raw.cityName || raw.cities?.name || raw.city || raw.location || '';
    const districtId = raw.district_id || raw.districtId || raw.cities?.district_id || raw.district || raw.location || '';
    const seller = raw.seller && typeof raw.seller === 'object' ? { ...raw.seller } : {};
    let customFields = raw.custom_fields || raw.customFields || {};
    if (typeof customFields === 'string') { try { customFields = JSON.parse(customFields); } catch (_) { customFields = {}; } }
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
      condition: raw.condition || 'new',
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
    adsLoaded = true;
    try {
      if (!window.supabaseClient) throw new Error('No Supabase client');
      const { data, error } = await window.supabaseClient
        .from('ads')
        .select('*, categories(name,slug), cities(id,name,district_id)')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (error) throw error;
      supabaseAds = (data || []).map((ad) => normalizeAd(ad, 'supabase'));
    } catch (e) {
      supabaseAds = [];
    }
    return supabaseAds;
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

  function adMatchesSearch(ad) {
    const q = getSearchValue();
    if (!q) return true;
    const haystack = `${ad.title} ${ad.description} ${ad.categoryName} ${ad.categoryId} ${ad.subcategoryId} ${ad.location} ${ad.cityName}`.toLowerCase();
    return haystack.includes(q);
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
      .ehm-desktop-category-select,.ehm-desktop-district-select,.ehm-desktop-city-select{height:46px;border:1.5px solid #dbe6ef;border-radius:14px;background:#fff;color:#334155;padding:0 14px;font-size:15px;font-weight:600;outline:none;min-width:155px;}
      .ehm-desktop-category-select:focus,.ehm-desktop-district-select:focus,.ehm-desktop-city-select:focus{border-color:#06b6d4;box-shadow:0 0 0 3px rgba(6,182,212,.12);}
      .ehm-desktop-top-category{display:none!important;}
      .ehm-desktop-top-location-hidden{display:none!important;}
      .ehm-desktop-hero-filterbar{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:center;justify-content:center;margin:14px auto 0;width:min(100%,680px);max-width:680px;padding:0 6px;}
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
      .ehm-desktop-results .ehm-heart{position:absolute;right:10px;bottom:10px;width:36px;height:36px;border-radius:999px;background:rgba(255,255,255,.92);display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:22px;box-shadow:0 4px 14px rgba(15,23,42,.14);}
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

    bar.innerHTML = `
      <button type="button" class="ehm-pill" id="ehmLocationBtn"><span id="ehmLocationText">${esc(getLocationLabel())}</span><b>${chevronSvg()}</b></button>
      <button type="button" class="ehm-pill" id="ehmCategoryBtn"><span id="ehmCategoryText">${esc(getCategoryLabel())}</span><b>${chevronSvg()}</b></button>
      <button type="button" class="ehm-view-toggle" id="ehmViewBtn" aria-label="Switch view">${viewSvg(state.view === 'grid' ? 'list' : 'grid')}</button>
    `;
    bar.querySelector('#ehmLocationBtn').addEventListener('click', openLocationModal);
    bar.querySelector('#ehmCategoryBtn').addEventListener('click', openCategoryModal);
    bar.querySelector('#ehmViewBtn').addEventListener('click', () => {
      state.view = state.view === 'grid' ? 'list' : 'grid';
      renderResults();
    });
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
    host.innerHTML = `
      ${activeBannerHtml()}
      <div class="ehm-results-head ${active ? '' : 'ehm-results-head-default'}">
        ${active ? '<h2>Search Results</h2>' : ''}
        <p>${rows.length ? (active ? `${rows.length} matching ads found` : 'Recently added listings') : 'No matching ads found'}</p>
      </div>
      ${rows.length ? `<div class="ehm-results-grid ${state.view}">${rows.map(renderAdCard).join('')}</div>` : '<div class="ehm-empty">No matching ads<br>found.</div>'}
    `;
    const viewBtn = document.getElementById('ehmViewBtn');
    if (viewBtn) viewBtn.innerHTML = viewSvg(state.view === 'grid' ? 'list' : 'grid');
    hideOriginalHomeContent();
  }

  function renderAdCard(ad) {
    const href = `/ad/${encodeURIComponent(ad.id)}`;
    const location = ad.location || ad.cityName || '';
    const price = formatPrice(ad.price, ad.currency);
    return `
      <a class="ehm-ad-card" href="${esc(href)}">
        <div class="ehm-ad-img-wrap">
          ${ad.image ? `<img class="ehm-ad-img" src="${esc(ad.image)}" alt="${esc(ad.title)}" loading="lazy">` : ''}
          <div class="ehm-badges">${topPromotionForAd(ad) ? '<span class="ehm-badge top">Top Ad</span>' : (ad.isFeatured ? '<span class="ehm-badge featured">Featured</span>' : '<span></span>')}${ad.isPromoted ? '<span class="ehm-badge promoted">Promoted</span>' : ''}</div>
          <span class="ehm-heart">♡</span>
        </div>
        <div class="ehm-ad-body">
          <h3 class="ehm-ad-title">${esc(ad.title)}</h3>
          ${price ? `<div class="ehm-ad-price">${esc(price)}</div>` : ''}
          ${financeCardHtml(ad)}
          <div class="ehm-ad-meta"><span>⌖ ${esc(location)}</span><span>◷ ${esc(relativeDate(ad.postedAt))}</span></div>
          <span class="ehm-condition">${esc(ad.condition === 'used' ? 'Used' : 'New')}</span>
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

    const heroLocation = document.getElementById('ehmDesktopHeroLocation');
    if (heroLocation) {
      heroLocation.innerHTML = desktopLocationOptionsHtml(selected);
      heroLocation.value = selected;
    }

    // Remove old separate city controls if an older cached DOM still has them.
    document.querySelectorAll('.ehm-desktop-city-select').forEach((select) => {
      if (select.id !== 'ehmDesktopHeroLocation') select.remove();
    });

    document.querySelectorAll('.ehm-desktop-district-select').forEach((select) => {
      if (select.id === 'ehmDesktopHeroLocation') return;
      select.innerHTML = desktopLocationOptionsHtml(selected);
      select.value = selected;
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

    // Hide existing native/simple location select near hero search.
    Array.from(section.querySelectorAll('select')).forEach((sel) => {
      const txt = Array.from(sel.options || []).map((o) => o.textContent).join(' ');
      if (/All Locations|Colombo|Kandy|Galle|Gampaha|Matara/i.test(txt)) sel.classList.add('ehm-desktop-top-location-hidden');
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

    bar.innerHTML = `
      <select class="ehm-desktop-category-select" id="ehmDesktopHeroCategory">${categoryOptionsHtml(categoryValueFromState())}</select>
      <select class="ehm-desktop-district-select" id="ehmDesktopHeroLocation">${desktopLocationOptionsHtml(desktopLocationValueFromState())}</select>
    `;

    const cat = bar.querySelector('#ehmDesktopHeroCategory');
    const location = bar.querySelector('#ehmDesktopHeroLocation');

    cat.addEventListener('change', () => {
      setCategoryFromSelect(cat.value);
      setDesktopQueryFromInput(heroInput);
      syncDesktopCategorySelects();
      renderDesktopResults(true);
    });

    location.addEventListener('change', () => {
      setDesktopLocationFromSelect(location.value);
      setDesktopQueryFromInput(heroInput);
      syncDesktopLocationSelects();
      renderDesktopResults(true);
    });

    balanceDesktopHeroStats();
  }

  function createDesktopResultsHost() {
    let host = document.getElementById('ehmDesktopResults');
    if (!host) {
      host = document.createElement('section');
      host.id = 'ehmDesktopResults';
      host.className = 'ehm-desktop-results';
      const hero = Array.from(document.querySelectorAll('section')).find((s) => /What are you looking for|Sri Lanka's #1 Modern Marketplace/i.test(s.textContent || ''));
      (hero || document.querySelector('#root') || document.body).insertAdjacentElement(hero ? 'afterend' : 'beforeend', host);
    }
    return host;
  }

  function renderDesktopResults(forceShow = false) {
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
    host.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function ensureDesktopHome() {
    if (isMobile() || !isHomeRoute()) return;
    document.body.classList.remove('ehm-ad-detail-route');
    await loadLookups();
    await loadFinanceSettings();
    await loadAds();
    await loadPromotions();
    enhanceDesktopTopSearch();
    enhanceDesktopHeroControls();
    syncDesktopCategorySelects();
    syncDesktopLocationSelects();
    balanceDesktopHeroStats();
    if (bannerAds.length) renderDesktopResults(true);
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
      existing.innerHTML = content;
      if (existing.previousElementSibling === priceNode) return;
      existing.remove();
    }

    const box = document.createElement('div');
    box.id = 'ehmAdDetailFinance';
    box.className = 'ehm-finance-detail';
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

  function injectSellerPhoneAboveCall() {
    if (!isAdRoute()) return false;

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
      existing.innerHTML = content;
      if (existing.nextElementSibling !== callButton) callButton.insertAdjacentElement('beforebegin', existing);
      return true;
    }
    const row = document.createElement('div');
    row.id = 'ehmSellerPhone'; row.className = 'ehm-seller-phone'; row.innerHTML = content;
    callButton.insertAdjacentElement('beforebegin', row);
    return true;
  }

  function scheduleSellerPhoneInjection() {
    [0, 80, 220, 500, 1000, 1800].forEach((delay) => {
      setTimeout(injectSellerPhoneAboveCall, delay);
    });
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
        await loadFinanceSettings();
        await loadAds();
        await loadPromotions();
        injectAdDetailBanner();
        injectAdDetailFinance();
        injectSellerPhoneAboveCall();
        scheduleSellerPhoneInjection();
        hideAdDetailLocation();
        setTimeout(hideAdDetailLocation, 150);
        setTimeout(hideAdDetailLocation, 500);
        setTimeout(hideAdDetailLocation, 1200);
        return;
      }

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

  function installRouteWatchers() {
    if (window.__ehmFinalWatchers) return;
    window.__ehmFinalWatchers = true;

    const originalPush = history.pushState;
    const originalReplace = history.replaceState;
    history.pushState = function () {
      const previousPath = location.pathname;
      const result = originalPush.apply(this, arguments);
      if (location.pathname !== previousPath && isAdRoute()) {
        window.__ehmAdTopRoute = '';
        openAdPageAtTop(true);
      }
      scheduleSync(30); scheduleSync(250);
      return result;
    };
    history.replaceState = function () {
      const previousPath = location.pathname;
      const result = originalReplace.apply(this, arguments);
      if (location.pathname !== previousPath && isAdRoute()) {
        window.__ehmAdTopRoute = '';
        openAdPageAtTop(true);
      }
      scheduleSync(30); scheduleSync(250);
      return result;
    };
    window.addEventListener('popstate', () => {
      if (isAdRoute()) {
        window.__ehmAdTopRoute = '';
        openAdPageAtTop(true);
      }
      scheduleSync(30);
      setTimeout(sync, 250);
      setTimeout(sync, 700);
    });
    window.addEventListener('pageshow', () => {
      if (isAdRoute()) {
        window.__ehmAdTopRoute = '';
        openAdPageAtTop(true);
      }
      scheduleSync(30);
      setTimeout(sync, 250);
    });
    window.addEventListener('resize', () => scheduleSync(120));

    const observer = new MutationObserver(() => {
      if (window.__ehmMutating) return;
      const path = window.location.pathname;
      if (path !== lastPath) {
        lastPath = path;
        if (isAdRoute()) {
          window.__ehmAdTopRoute = '';
          openAdPageAtTop(true);
        }
        scheduleSync(30);
        setTimeout(sync, 250);
      } else if (isMobile() && isHomeRoute()) {
        // React mounts the native sections in stages. Hide them immediately so
        // the first visible mobile screen remains the two-column Latest Ads layout.
        hideOriginalHomeContent();
        scheduleSync(80);
      } else if (isAdRoute()) {
        injectSellerPhoneAboveCall();
        scheduleSync(120);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  async function init() {
    installStyles();
    installRouteWatchers();
    if (!isMobile() && isHomeRoute()) {
      setTimeout(ensureDesktopHome, 500);
      setTimeout(ensureDesktopHome, 1400);
    }
    if (isAdRoute()) {
      window.__ehmAdTopRoute = '';
      openAdPageAtTop(true);
      window.clearInterval(window.__ehmAdLocationLongTimer);
      window.__ehmAdLocationLongTimer = window.setInterval(hideAdDetailLocation, 200);
      setTimeout(() => window.clearInterval(window.__ehmAdLocationLongTimer), 15000);
    }
    await sync();
    setTimeout(sync, 300);
    setTimeout(sync, 900);
    setTimeout(sync, 1800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
