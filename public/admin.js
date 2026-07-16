let currentUser = null;
let currentPermissions = null;
let activeTab = 'overview';

let USERS = [], ADS = [], CATEGORIES = [], DISTRICTS = [], CITIES = [];
let STAFF = [], REPORTS = [], SHOPS = [], VERIFICATIONS = [];
let PAYMENTS = [], PRICING = [], INVOICES = [], CUSTOM_FIELDS = [], BANNERS = [], AD_PROMOTIONS = [];
let SETTINGS = {};

const MAIN_ADMIN = "ehemehe.lk@gmail.com";


const SITE_STATIC_ADS = [{"id":"1","title":"2020 Toyota Prius Hybrid - Low Mileage","description":"Well-maintained Toyota Prius Hybrid with only 35,000km on the odometer. Full service history available. Air conditioning, power windows, ABS brakes, and hybrid battery in excellent condition. Recently serviced with new tires.","price":8500000,"currency":"LKR","categoryId":"vehicles","subcategoryId":"cars","images":["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s1","name":"Kamal Perera","phone":"+94 77 123 4567","email":"kamal@email.com","memberSince":"2024-01-15","totalAds":12,"verified":true},"condition":"used","postedAt":"2026-06-19","isFeatured":true,"isPromoted":true,"viewCount":342,"contactPhone":"+94 77 123 4567"},{"id":"2","title":"Modern 3-Bedroom House in Kandy","description":"Beautiful modern house in a prime location in Kandy. 3 bedrooms, 2 bathrooms, open-plan kitchen, large garden, and parking for 2 cars. Close to schools, hospitals, and shopping centers.","price":45000000,"currency":"LKR","categoryId":"property","subcategoryId":"houses","images":["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop"],"location":"Kandy","seller":{"id":"s2","name":"Nadeesha Silva","phone":"+94 71 234 5678","email":"nadeesha@email.com","memberSince":"2024-03-22","totalAds":5,"verified":true},"condition":"new","postedAt":"2026-06-20","isFeatured":true,"isPromoted":false,"viewCount":189,"contactPhone":"+94 71 234 5678"},{"id":"3","title":"iPhone 15 Pro Max 256GB - Space Black","description":"Brand new iPhone 15 Pro Max 256GB in Space Black. Sealed box with full Apple warranty. Includes case and screen protector.","price":520000,"currency":"LKR","categoryId":"mobile-phones","subcategoryId":"phones","images":["https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s3","name":"Ravindu Fernando","phone":"+94 76 345 6789","email":"ravindu@email.com","memberSince":"2024-06-10","totalAds":8,"verified":false},"condition":"new","postedAt":"2026-06-21","isFeatured":true,"isPromoted":true,"viewCount":567,"contactPhone":"+94 76 345 6789"},{"id":"4","title":"Samsung 65\" QLED 4K Smart TV","description":"Samsung 65-inch QLED 4K Smart TV with Quantum Dot technology. Stunning picture quality, built-in voice assistant, and all major streaming apps. Wall mount included.","price":485000,"currency":"LKR","categoryId":"electronics","subcategoryId":"tvs","images":["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&h=600&fit=crop"],"location":"Gampaha","seller":{"id":"s4","name":"Ishara Jayawardena","phone":"+94 70 456 7890","email":"ishara@email.com","memberSince":"2023-11-05","totalAds":22,"verified":true},"condition":"new","postedAt":"2026-06-18","isFeatured":true,"isPromoted":false,"viewCount":231,"contactPhone":"+94 70 456 7890"},{"id":"5","title":"Professional Guitar - Fender Stratocaster","description":"Fender American Professional II Stratocaster in 3-Color Sunburst. Rosewood fretboard, V-Mod II pickups. Comes with original hardshell case and all documentation.","price":650000,"currency":"LKR","categoryId":"sports-hobbies-kids","subcategoryId":"musical-instruments","images":["https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s5","name":"Dilini Ratnayake","phone":"+94 78 567 8901","email":"dilini@email.com","memberSince":"2024-08-18","totalAds":3,"verified":false},"condition":"used","postedAt":"2026-06-17","isFeatured":false,"isPromoted":false,"viewCount":156,"contactPhone":"+94 78 567 8901"},{"id":"6","title":"Honda CB150R - Excellent Condition","description":"Honda CB150R ExMotion in Matte Black. Low mileage, single owner. Regular servicing at Honda center. Comes with full documentation and insurance.","price":1250000,"currency":"LKR","categoryId":"vehicles","subcategoryId":"motorbikes","images":["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop"],"location":"Galle","seller":{"id":"s1","name":"Kamal Perera","phone":"+94 77 123 4567","email":"kamal@email.com","memberSince":"2024-01-15","totalAds":12,"verified":true},"condition":"used","postedAt":"2026-06-16","isFeatured":false,"isPromoted":true,"viewCount":423,"contactPhone":"+94 77 123 4567"},{"id":"7","title":"MacBook Pro M3 14-inch 16GB/512GB","description":"Apple MacBook Pro 14-inch with M3 chip, 16GB RAM, 512GB SSD. Space Gray. Battery cycle count: 45. AppleCare+ until 2027. Perfect for professionals and developers.","price":890000,"currency":"LKR","categoryId":"electronics","subcategoryId":"computers-tablets","images":["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s3","name":"Ravindu Fernando","phone":"+94 76 345 6789","email":"ravindu@email.com","memberSince":"2024-06-10","totalAds":8,"verified":false},"condition":"used","postedAt":"2026-06-20","isFeatured":true,"isPromoted":false,"viewCount":312,"contactPhone":"+94 76 345 6789"},{"id":"8","title":"Golden Retriever Puppies - 3 Months","description":"Adorable Golden Retriever puppies, 3 months old. First vaccination done. Both parents are KC registered. Puppies are playful and well-socialized.","price":85000,"currency":"LKR","categoryId":"animals-pets","subcategoryId":"dogs","images":["https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s5","name":"Dilini Ratnayake","phone":"+94 78 567 8901","email":"dilini@email.com","memberSince":"2024-08-18","totalAds":3,"verified":false},"condition":"new","postedAt":"2026-06-21","isFeatured":true,"isPromoted":false,"viewCount":891,"contactPhone":"+94 78 567 8901"},{"id":"9","title":"Modern Sofa Set - 7 Piece","description":"Elegant 7-piece sofa set in premium fabric. Includes 3-seater, 2-seater, 2 single chairs, and center table. Brand new, direct from manufacturer.","price":285000,"currency":"LKR","categoryId":"home-garden","subcategoryId":"furniture","images":["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop"],"location":"Kurunegala","seller":{"id":"s2","name":"Nadeesha Silva","phone":"+94 71 234 5678","email":"nadeesha@email.com","memberSince":"2024-03-22","totalAds":5,"verified":true},"condition":"new","postedAt":"2026-06-19","isFeatured":false,"isPromoted":false,"viewCount":167,"contactPhone":"+94 71 234 5678"},{"id":"10","title":"Software Engineer - Remote Position","description":"Leading tech company seeking experienced software engineers. React/Node.js preferred. Competitive salary + benefits. Full remote flexibility.","price":350000,"currency":"LKR","categoryId":"jobs","subcategoryId":"vacancies","images":["https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s4","name":"Ishara Jayawardena","phone":"+94 70 456 7890","email":"ishara@email.com","memberSince":"2023-11-05","totalAds":22,"verified":true},"condition":"new","postedAt":"2026-06-21","isFeatured":true,"isPromoted":true,"viewCount":1245,"contactEmail":"careers@techcompany.lk"},{"id":"11","title":"Land for Sale - 10 Perches in Kadawatha","description":"Prime land for sale in Kadawatha. 10 perches, flat terrain, road access from both sides. Ideal for residential construction. Close to Colombo-Kandy highway.","price":12000000,"currency":"LKR","categoryId":"property","subcategoryId":"land","images":["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop"],"location":"Gampaha","seller":{"id":"s1","name":"Kamal Perera","phone":"+94 77 123 4567","email":"kamal@email.com","memberSince":"2024-01-15","totalAds":12,"verified":true},"condition":"new","postedAt":"2026-06-18","isFeatured":false,"isPromoted":false,"viewCount":289,"contactPhone":"+94 77 123 4567"},{"id":"12","title":"Professional Photography Services","description":"Event, portrait, product, and commercial photography. 10+ years experience. Portfolio available on request. Competitive rates for weddings and corporate events.","price":50000,"currency":"LKR","categoryId":"services","subcategoryId":"event","images":["https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s3","name":"Ravindu Fernando","phone":"+94 76 345 6789","email":"ravindu@email.com","memberSince":"2024-06-10","totalAds":8,"verified":false},"condition":"new","postedAt":"2026-06-17","isFeatured":false,"isPromoted":false,"viewCount":98,"contactPhone":"+94 76 345 6789"},{"id":"13","title":"Nike Air Max 270 - White/Black","description":"Authentic Nike Air Max 270 in White/Black colorway. Size 10 UK. Never worn, still in original box. Bought from official Nike store.","price":32000,"currency":"LKR","categoryId":"fashion","subcategoryId":"shoes","images":["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s5","name":"Dilini Ratnayake","phone":"+94 78 567 8901","email":"dilini@email.com","memberSince":"2024-08-18","totalAds":3,"verified":false},"condition":"new","postedAt":"2026-06-20","isFeatured":false,"isPromoted":false,"viewCount":234,"contactPhone":"+94 78 567 8901"},{"id":"14","title":"Three Wheeler - Bajaj RE 205","description":"Bajaj RE 205 three-wheeler in excellent running condition. Recently serviced. Good for taxi or small business. Registration up to date.","price":680000,"currency":"LKR","categoryId":"vehicles","subcategoryId":"three-wheelers","images":["https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&h=600&fit=crop"],"location":"Galle","seller":{"id":"s2","name":"Nadeesha Silva","phone":"+94 71 234 5678","email":"nadeesha@email.com","memberSince":"2024-03-22","totalAds":5,"verified":true},"condition":"used","postedAt":"2026-06-15","isFeatured":false,"isPromoted":false,"viewCount":156,"contactPhone":"+94 71 234 5678"},{"id":"15","title":"A-Level Physics Tuition - Online","description":"Qualified teacher with 15 years experience offering online A-Level Physics tuition. Small batch sizes (max 10 students). Proven track record of A/L results.","price":5000,"currency":"LKR","categoryId":"education","subcategoryId":"tuition-classes","images":["https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop"],"location":"Colombo","seller":{"id":"s4","name":"Ishara Jayawardena","phone":"+94 70 456 7890","email":"ishara@email.com","memberSince":"2023-11-05","totalAds":22,"verified":true},"condition":"new","postedAt":"2026-06-21","isFeatured":false,"isPromoted":false,"viewCount":78,"contactPhone":"+94 70 456 7890"},{"id":"16","title":"Industrial Sewing Machine - Juki","description":"Juki DDL-8100E industrial sewing machine with table and motor. Heavy-duty, perfect for garment manufacturing. Barely used, looks brand new.","price":185000,"currency":"LKR","categoryId":"business-industry-agriculture","subcategoryId":"industrial-machinery","images":["https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop"],"location":"Gampaha","seller":{"id":"s1","name":"Kamal Perera","phone":"+94 77 123 4567","email":"kamal@email.com","memberSince":"2024-01-15","totalAds":12,"verified":true},"condition":"used","postedAt":"2026-06-16","isFeatured":false,"isPromoted":false,"viewCount":67,"contactPhone":"+94 77 123 4567"}];
const STATIC_OVERRIDE_KEY = 'ehemeheStaticAdOverrides';

function readStaticAdOverrides(){
  try { return JSON.parse(localStorage.getItem(STATIC_OVERRIDE_KEY) || '{}') || {}; }
  catch(e) { return {}; }
}
function writeStaticAdOverrides(overrides){
  localStorage.setItem(STATIC_OVERRIDE_KEY, JSON.stringify(overrides || {}));
}
function titleFromId(value){
  return String(value || '')
    .replace(/-/g,' ')
    .replace(/\b\w/g, ch => ch.toUpperCase());
}
function mergeStaticRawAd(raw){
  const overrides = readStaticAdOverrides();
  const override = overrides[String(raw.id)] || {};
  if(override.deleted) return null;
  const merged = {...raw, ...override};
  if(override.image_url) merged.images = [override.image_url];
  if(!merged.status) merged.status = 'approved';
  return merged;
}
function normalizeSiteStaticAd(raw){
  const merged = mergeStaticRawAd(raw);
  if(!merged) return null;
  const locationName = merged.location || merged.city || 'Sri Lanka';
  const locId = slug(locationName);
  const categoryId = slugNorm(merged.category_id || merged.categoryId || 'general');
  const subcategoryId = slugNorm(merged.subcategory_id || merged.subcategoryId || '');
  const image = merged.image_url || merged.image || (Array.isArray(merged.images) ? merged.images[0] : '');
  return {
    id: `static-${merged.id}`,
    static_id: String(merged.id),
    source: 'site_static',
    title: merged.title || 'Untitled listing',
    description: merged.description || '',
    price: merged.price ?? null,
    currency: merged.currency || 'LKR',
    category_id: categoryId,
    subcategory_id: subcategoryId,
    city_id: locId,
    district_id: locId,
    phone: merged.phone || merged.contactPhone || merged.seller?.phone || '',
    image_url: image,
    images: Array.isArray(merged.images) ? merged.images : (image ? [image] : []),
    condition: merged.condition || 'new',
    status: merged.status || 'approved',
    is_featured: !!merged.isFeatured || !!merged.featured,
    is_promoted: !!merged.isPromoted || !!merged.promoted,
    promotion_type: merged.promotion_type || (merged.isPromoted ? 'promoted' : ''),
    created_at: merged.created_at || merged.postedAt || new Date().toISOString(),
    updated_at: merged.updated_at || merged.postedAt || new Date().toISOString(),
    view_count: merged.viewCount || 0,
    user_email: merged.seller?.email || merged.contactEmail || '',
    seller_name: merged.seller?.name || '',
    categories: { id: categoryId, name: titleFromId(categoryId), slug: categoryId },
    cities: { id: locId, name: locationName, district_id: locId }
  };
}
function siteStaticAdminAds(){
  return SITE_STATIC_ADS.map(normalizeSiteStaticAd).filter(Boolean);
}
function enrichSupabaseAd(ad){
  let custom = ad.custom_fields || {};
  if(typeof custom === 'string'){
    try{ custom = JSON.parse(custom); }catch(_){ custom = {}; }
  }
  const categoryId = String(ad.category_id || ad.categories?.id || custom.subcategory_slug || custom.category_slug || '').toLowerCase();
  const cityId = String(ad.city_id || ad.cities?.id || custom.city || ad.city || '').toLowerCase();
  const categoryName = ad.categories?.name || custom.subcategory_name || custom.category_name || '';
  const cityName = ad.cities?.name || custom.city || ad.city || '';
  return {
    ...ad,
    custom_fields: custom,
    source: ad.source || 'supabase',
    category_id: categoryId,
    city_id: cityId,
    categories: ad.categories || (categoryName ? {id:categoryId, name:categoryName, slug:categoryId} : null),
    cities: ad.cities || (cityName ? {id:cityId, name:cityName, district_id:custom.district || ad.district_id || ''} : null)
  };
}
function mergeDashboardAds(supabaseRows, staticRows){
  const combined = [...(supabaseRows || []).map(enrichSupabaseAd), ...(staticRows || [])];
  const seen = new Set();
  return combined.filter((ad) => {
    const key = `${slug(ad.title)}|${slug(adCityName(ad))}|${ad.price ?? ''}`;
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function ensureStaticLookups(){
  const catMap = new Map((CATEGORIES || []).map(c => [String(c.id || c.slug || c.name).toLowerCase(), c]));
  SITE_STATIC_ADS.forEach(raw => {
    const catId = String(raw.categoryId || raw.category_id || '').toLowerCase();
    if(catId && !catMap.has(catId)){
      catMap.set(catId, {id:catId, slug:catId, name:titleFromId(catId), source:'site_static'});
    }
    const subId = String(raw.subcategoryId || raw.subcategory_id || '').toLowerCase();
    if(subId && !catMap.has(subId)){
      catMap.set(subId, {id:subId, slug:subId, name:titleFromId(subId), parent_id:catId || null, source:'site_static'});
    }
  });
  CATEGORIES = Array.from(catMap.values());

  const districtMap = new Map((DISTRICTS || []).map(d => [String(d.id || d.slug || d.name).toLowerCase(), d]));
  const cityMap = new Map((CITIES || []).map(c => [String(c.id || c.name).toLowerCase(), c]));
  SITE_STATIC_ADS.forEach(raw => {
    const name = raw.location || 'Sri Lanka';
    const id = slug(name);
    if(!districtMap.has(id)) districtMap.set(id, {id, slug:id, name, source:'site_static'});
    if(!cityMap.has(id)) cityMap.set(id, {id, slug:id, name, district_id:id, source:'site_static'});
  });
  DISTRICTS = Array.from(districtMap.values());
  CITIES = Array.from(cityMap.values());
}
function updateStaticAdOverrideFor(ad, patch){
  const staticId = ad.static_id || String(ad.id || '').replace(/^static-/, '');
  if(!staticId) return;
  const overrides = readStaticAdOverrides();
  overrides[staticId] = { ...(overrides[staticId] || {}), ...patch, updated_at: new Date().toISOString() };
  writeStaticAdOverrides(overrides);
}
function staticPatchFromEditor(currentAd){
  const cityId = el('editCity').value;
  const cityName = cityNameById(cityId);
  const image = el('editImage').value.trim();
  return {
    title: el('editTitle').value,
    price: el('editPrice').value || null,
    contactPhone: el('editPhone').value,
    phone: el('editPhone').value,
    description: el('editDescription').value,
    image_url: image,
    images: image ? [image] : [],
    status: el('editStatus').value,
    categoryId: el('editCategory').value || currentAd.category_id,
    subcategoryId: currentAd.subcategory_id || '',
    location: cityName === '-' ? (currentAd.cities?.name || currentAd.location || 'Sri Lanka') : cityName,
    condition: currentAd.condition || 'new',
    isFeatured: !!currentAd.is_featured,
    isPromoted: !!el('editPromotion').value,
    promotion_type: el('editPromotion').value || '',
    finance: calcVehicleFinance(el('editPrice').value)
  };
}


const el = (id) => document.getElementById(id);
const html = (v) => String(v ?? "")
  .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
  .replaceAll('"',"&quot;").replaceAll("'","&#039;");
const slug = (v) => String(v || "").toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const money = (v) => {
  if(v === null || v === undefined || v === "") return "LKR 0";
  const n = Number(String(v).replace(/[^\d.]/g,""));
  return isFinite(n) ? "LKR " + n.toLocaleString("en-US") : String(v);
};
const dateText = (v) => {
  const d = v ? new Date(v) : null;
  return d && !isNaN(d) ? d.toLocaleDateString("en-GB", {year:"numeric", month:"short", day:"numeric"}) : "-";
};
const statusBadge = (s) => `<span class="badge ${html(String(s || "pending").toLowerCase())}">${html(s || "pending")}</span>`;
const toast = (msg) => alert(msg);
function toggleSidebar(){ el('sidebar')?.classList.toggle('open'); }
function closeModal(){ el('modal').classList.add('hidden'); el('modalBody').innerHTML=''; }
function openModal(title, body){ el('modalTitle').innerText=title; el('modalBody').innerHTML=body; el('modal').classList.remove('hidden'); }
function setLoading(target, msg="Loading..."){ if(el(target)) el(target).innerHTML = `<div class="empty">${html(msg)}</div>`; }

const FALLBACK_CATEGORIES = [
  {id:'vehicles', name:'Vehicles', slug:'vehicles'},
  {id:'cars', name:'Cars', slug:'cars', parent_id:'vehicles'},
  {id:'property', name:'Property', slug:'property'},
  {id:'electronics', name:'Electronics', slug:'electronics'},
  {id:'mobile-phones', name:'Mobile Phones', slug:'mobile-phones'},
  {id:'jobs', name:'Jobs', slug:'jobs'},
  {id:'services', name:'Services', slug:'services'},
  {id:'animals-pets', name:'Animals & Pets', slug:'animals-pets'}
];
const FALLBACK_DISTRICTS = [
  {id:'colombo', name:'Colombo'}, {id:'gampaha', name:'Gampaha'}, {id:'kandy', name:'Kandy'},
  {id:'galle', name:'Galle'}, {id:'matara', name:'Matara'}, {id:'kalutara', name:'Kalutara'}
];
const FALLBACK_CITIES = [
  {id:'colombo-city', name:'Colombo City', district_id:'colombo'}, {id:'dehiwala', name:'Dehiwala', district_id:'colombo'},
  {id:'gampaha-city', name:'Gampaha City', district_id:'gampaha'}, {id:'negombo', name:'Negombo', district_id:'gampaha'},
  {id:'kandy-city', name:'Kandy City', district_id:'kandy'}, {id:'peradeniya', name:'Peradeniya', district_id:'kandy'},
  {id:'galle-city', name:'Galle City', district_id:'galle'}, {id:'matara-city', name:'Matara City', district_id:'matara'},
  {id:'kalutara-city', name:'Kalutara City', district_id:'kalutara'}
];
const PERMISSIONS = {
  can_view_users: 'View users',
  can_approve_users: 'Approve / suspend users',
  can_view_ads: 'View ads',
  can_approve_ads: 'Approve / reject ads',
  can_edit_ads: 'Edit ads',
  can_delete_ads: 'Delete ads',
  can_manage_categories: 'Manage categories',
  can_manage_cities: 'Manage locations',
  can_manage_moderators: 'Manage staff roles'
};
const ROLE_PRESETS = {
  super_admin: {label:'Super Admin', access:'100%', description:'Full system access, finance, settings, staff management.'},
  admin: {label:'Admin', access:'100%', description:'Full dashboard access except protected main admin controls.'},
  moderator: {label:'Moderator', access:'60%', description:'Approve, reject, edit, and review ads. No payment gateway access.'},
  support: {label:'Support Agent', access:'40%', description:'View user details, handle verification, and support account issues.'}
};


const VEHICLE_FINANCE_DEFAULTS = {
  downPaymentPercent: 40,
  annualRatePercent: 15,
  months: 48,
  companyPhone: '+94 77 000 0000'
};
const LOCAL_SETTING_PREFIX = 'ehemeheSiteSetting:';

function getLocalSetting(key){
  try { return localStorage.getItem(LOCAL_SETTING_PREFIX + key); } catch(e) { return null; }
}
function setLocalSetting(key, value){
  try { localStorage.setItem(LOCAL_SETTING_PREFIX + key, String(value ?? '')); } catch(e) {}
}
function applyLocalSettingFallbacks(){
  const defaults = {
    vehicle_downpayment_percent: VEHICLE_FINANCE_DEFAULTS.downPaymentPercent,
    vehicle_annual_rate_percent: VEHICLE_FINANCE_DEFAULTS.annualRatePercent,
    vehicle_finance_months: VEHICLE_FINANCE_DEFAULTS.months,
    vehicle_finance_company_phone: VEHICLE_FINANCE_DEFAULTS.companyPhone
  };
  Object.entries(defaults).forEach(([key, fallback]) => {
    if(SETTINGS[key] === undefined || SETTINGS[key] === null || SETTINGS[key] === ''){
      const local = getLocalSetting(key);
      SETTINGS[key] = local !== null && local !== '' ? local : fallback;
    }
  });
}
function settingNumber(key, fallback){
  const value = Number(SETTINGS[key] ?? getLocalSetting(key) ?? fallback);
  return Number.isFinite(value) ? value : fallback;
}
function vehicleFinanceSettings(){
  return {
    downPaymentPercent: settingNumber('vehicle_downpayment_percent', VEHICLE_FINANCE_DEFAULTS.downPaymentPercent),
    annualRatePercent: settingNumber('vehicle_annual_rate_percent', VEHICLE_FINANCE_DEFAULTS.annualRatePercent),
    months: Math.max(1, Math.round(settingNumber('vehicle_finance_months', VEHICLE_FINANCE_DEFAULTS.months))),
    companyPhone: String(SETTINGS.vehicle_finance_company_phone ?? getLocalSetting('vehicle_finance_company_phone') ?? VEHICLE_FINANCE_DEFAULTS.companyPhone)
  };
}
function isVehicleAd(ad){
  const direct = [ad.category_id, ad.categoryId, ad.category, ad.category_name, ad.categories?.name, ad.categories?.slug, ad.subcategory_id, ad.subcategoryId, ad.subcategory, ad.subcategory_name]
    .map(x => slugNorm(x));
  const vehicleKeys = ['vehicles','vehicle','cars','car','motorbikes','motorbike','bikes','vans','trucks','buses','three-wheelers','three-wheeler'];
  if(direct.some(x => vehicleKeys.includes(x))) return true;
  try {
    const tokens = adCategoryTokens(ad);
    return vehicleKeys.some(key => tokens.has(key));
  } catch(e) { return false; }
}
function calcVehicleFinance(price, settings = vehicleFinanceSettings()){
  const amount = Number(String(price ?? '').replace(/[^\d.]/g,''));
  if(!Number.isFinite(amount) || amount <= 0) return null;
  const downPayment = Math.round(amount * settings.downPaymentPercent / 100);
  const principal = Math.max(0, amount - downPayment);
  const monthlyRate = settings.annualRatePercent / 100 / 12;
  const months = Math.max(1, Number(settings.months || 1));
  let monthlyPayment;
  if(monthlyRate <= 0){
    monthlyPayment = principal / months;
  } else {
    const factor = Math.pow(1 + monthlyRate, months);
    monthlyPayment = principal * monthlyRate * factor / (factor - 1);
  }
  return {
    price: amount,
    downPayment: Math.round(downPayment),
    financeAmount: Math.round(principal),
    monthlyPayment: Math.round(monthlyPayment),
    annualRatePercent: settings.annualRatePercent,
    downPaymentPercent: settings.downPaymentPercent,
    months,
    companyPhone: settings.companyPhone
  };
}
function vehicleFinanceSummaryHtml(ad){
  if(!isVehicleAd(ad)) return '';
  const f = calcVehicleFinance(ad.price);
  if(!f) return '';
  return `<div class="finance-mini"><b>Finance</b> • Down ${html(money(f.downPayment))} • Monthly ${html(money(f.monthlyPayment))}<br>Company: ${html(f.companyPhone)} • ${html(f.downPaymentPercent)}% down • ${html(f.annualRatePercent)}% / ${html(f.months)} months</div>`;
}
function fillVehicleFinanceSettingsForm(){
  const settings = vehicleFinanceSettings();
  if(el('vehicleDownPaymentPercent')) el('vehicleDownPaymentPercent').value = settings.downPaymentPercent;
  if(el('vehicleAnnualRatePercent')) el('vehicleAnnualRatePercent').value = settings.annualRatePercent;
  if(el('vehicleFinanceMonths')) el('vehicleFinanceMonths').value = settings.months;
  if(el('vehicleFinancePhone')) el('vehicleFinancePhone').value = settings.companyPhone;
  updateVehicleFinancePreview();
}
function updateVehicleFinancePreview(){
  const preview = el('vehicleFinancePreview');
  if(!preview) return;
  const settings = {
    downPaymentPercent: Number(el('vehicleDownPaymentPercent')?.value || VEHICLE_FINANCE_DEFAULTS.downPaymentPercent),
    annualRatePercent: Number(el('vehicleAnnualRatePercent')?.value || VEHICLE_FINANCE_DEFAULTS.annualRatePercent),
    months: Number(el('vehicleFinanceMonths')?.value || VEHICLE_FINANCE_DEFAULTS.months),
    companyPhone: el('vehicleFinancePhone')?.value || VEHICLE_FINANCE_DEFAULTS.companyPhone
  };
  const sample = calcVehicleFinance(10000000, settings);
  preview.innerHTML = sample ? `Example for LKR 10,000,000: Down ${html(money(sample.downPayment))}, Monthly ${html(money(sample.monthlyPayment))}, Company ${html(sample.companyPhone)}` : 'Enter finance settings to preview calculation.';
}
async function saveVehicleFinanceSettings(){
  const entries = {
    vehicle_downpayment_percent: el('vehicleDownPaymentPercent').value || VEHICLE_FINANCE_DEFAULTS.downPaymentPercent,
    vehicle_annual_rate_percent: el('vehicleAnnualRatePercent').value || VEHICLE_FINANCE_DEFAULTS.annualRatePercent,
    vehicle_finance_months: el('vehicleFinanceMonths').value || VEHICLE_FINANCE_DEFAULTS.months,
    vehicle_finance_company_phone: el('vehicleFinancePhone').value || VEHICLE_FINANCE_DEFAULTS.companyPhone
  };
  for(const [key,value] of Object.entries(entries)){
    await saveSetting(key, value);
  }
  applyLocalSettingFallbacks();
  fillVehicleFinanceSettingsForm();
  renderAds();
  renderPromotions();
  toast('Vehicle finance settings saved.');
}
function bindVehicleFinanceSettingsInputs(){
  ['vehicleDownPaymentPercent','vehicleAnnualRatePercent','vehicleFinanceMonths','vehicleFinancePhone'].forEach(id => {
    const node = el(id);
    if(node && node.dataset.financeBound !== '1'){
      node.dataset.financeBound = '1';
      node.addEventListener('input', updateVehicleFinancePreview);
      node.addEventListener('change', updateVehicleFinancePreview);
    }
  });
}
function editModalFinancePreview(ad){
  if(!isVehicleAd(ad)) return '<div id="editFinancePreview" class="finance-summary hidden"></div>';
  const f = calcVehicleFinance(ad.price);
  return `<div id="editFinancePreview" class="finance-summary">${f ? `<div class="row"><span>Down Payment</span><strong>${html(money(f.downPayment))}</strong></div><div class="row"><span>Monthly Payment</span><strong>${html(money(f.monthlyPayment))}</strong></div><div class="row"><span>Finance Company</span><strong>${html(f.companyPhone)}</strong></div>` : 'Enter vehicle price to calculate finance.'}</div>`;
}
function refreshEditFinancePreview(){
  const box = el('editFinancePreview');
  if(!box) return;
  const ad = {price: el('editPrice')?.value, category_id: el('editCategory')?.value, categories:{name: el('editCategory')?.selectedOptions?.[0]?.textContent || ''}};
  if(!isVehicleAd(ad)) { box.classList.add('hidden'); box.innerHTML=''; return; }
  box.classList.remove('hidden');
  const f = calcVehicleFinance(ad.price);
  box.innerHTML = f ? `<div class="row"><span>Down Payment</span><strong>${html(money(f.downPayment))}</strong></div><div class="row"><span>Monthly Payment</span><strong>${html(money(f.monthlyPayment))}</strong></div><div class="row"><span>Finance Company</span><strong>${html(f.companyPhone)}</strong></div>` : 'Enter vehicle price to calculate finance.';
}
function bindEditFinancePreview(){
  ['editPrice','editCategory'].forEach(id => {
    const node = el(id);
    if(node && node.dataset.financeBound !== '1'){
      node.dataset.financeBound = '1';
      node.addEventListener('input', refreshEditFinancePreview);
      node.addEventListener('change', refreshEditFinancePreview);
    }
  });
  refreshEditFinancePreview();
}


/* ---------------- Auth + Permissions ---------------- */
async function login(){
  try {
    if ((!window.supabaseClient || typeof window.supabaseClient.auth === 'undefined') && window.waitForSupabaseClient) {
      await window.waitForSupabaseClient(10000);
    }
    supabaseClient = window.supabaseClient || supabaseClient;
  } catch (error) {
    toast('Could not initialize the database connection. Please refresh and try again.');
    return;
  }
  if(typeof supabaseClient === 'undefined' || !supabaseClient){
    toast('Supabase client is not configured.');
    return;
  }
  const email = el('email').value.trim().toLowerCase();
  const password = el('password').value;
  if(!email || !password){
    toast('Email and password are required.');
    return;
  }
  try{
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if(error){
      if(isFetchFailure(error) && isLocalDevHost() && isMainAdminEmail(email)){
        console.warn('Supabase login fetch failed. Opening localhost-only Super Admin fallback. Production hosting will still require Supabase Auth.');
        await openLocalSuperAdminDashboard(email);
        return;
      }
      toast(friendlyAuthError(error));
      return;
    }
    await openDashboard(data.user);
  }catch(error){
    if(isFetchFailure(error) && isLocalDevHost() && isMainAdminEmail(email)){
      console.warn('Supabase login fetch failed. Opening localhost-only Super Admin fallback. Production hosting will still require Supabase Auth.', error);
      await openLocalSuperAdminDashboard(email);
      return;
    }
    toast(friendlyAuthError(error));
  }
}
async function logout(){
  try{
    if(typeof supabaseClient !== 'undefined' && supabaseClient) await supabaseClient.auth.signOut();
  }catch(error){
    console.warn('Supabase logout skipped:', error?.message || error);
  }
  location.reload();
}
async function checkSession(){
  try {
    if ((!window.supabaseClient || typeof window.supabaseClient.auth === 'undefined') && window.waitForSupabaseClient) {
      await window.waitForSupabaseClient(10000);
    }
    supabaseClient = window.supabaseClient || supabaseClient;
  } catch (error) {
    console.warn('Supabase session initialization skipped:', error?.message || error);
    return;
  }
  if(typeof supabaseClient === 'undefined' || !supabaseClient) return;
  try{
    const { data } = await supabaseClient.auth.getSession();
    if(data?.session?.user) await openDashboard(data.session.user);
  }catch(error){
    console.warn('Supabase session check failed:', error?.message || error);
  }
}
function isMainAdminEmail(email){ return String(email || '').toLowerCase() === MAIN_ADMIN.toLowerCase(); }
function defaultAdminPermissions(email){
  return {
    email, role:'super_admin', is_active:true,
    can_view_users:true, can_approve_users:true,
    can_view_ads:true, can_approve_ads:true, can_edit_ads:true, can_delete_ads:true,
    can_manage_categories:true, can_manage_cities:true, can_manage_moderators:true
  };
}

function isLocalDevHost(){
  return ['localhost','127.0.0.1','0.0.0.0',''].includes(location.hostname);
}
function isFetchFailure(error){
  const message = String(error?.message || error || '').toLowerCase();
  return message.includes('failed to fetch') || message.includes('networkerror') || message.includes('load failed') || message.includes('fetch failed');
}
function friendlyAuthError(error){
  if(isFetchFailure(error)){
    return 'Cannot connect to Supabase. Check internet connection, Supabase project URL/API key, or Supabase service status.';
  }
  return error?.message || String(error || 'Login failed.');
}
async function openLocalSuperAdminDashboard(email){
  currentUser = { id:'local-super-admin', email };
  currentPermissions = defaultAdminPermissions(email);
  el('staffInfoTop').innerText = 'SUPER_ADMIN';
  el('loginBox').classList.add('hidden');
  el('dashboard').classList.remove('hidden');
  applyPermissionUI();
  await loadAll();
  showTab('overview');
}
async function openDashboard(user){
  currentUser = user;
  let staff = null;
  try{
    const { data, error } = await supabaseClient.from('staff_permissions')
      .select('*').eq('email', user.email).eq('is_active', true).maybeSingle();
    if(error) console.warn('staff lookup:', error.message);
    staff = data;
  }catch(e){ console.warn('staff lookup failed', e); }

  if(!staff && isMainAdminEmail(user.email)) staff = defaultAdminPermissions(user.email);
  if(!staff){
    toast('This account does not have admin or moderator access.');
    return;
  }
  currentPermissions = staff;
  el('staffInfoTop').innerText = `${String(staff.role || 'staff').toUpperCase()}`;
  el('loginBox').classList.add('hidden');
  el('dashboard').classList.remove('hidden');
  applyPermissionUI();
  await loadAll();
  showTab('overview');
}
function can(permission){
  if(!currentPermissions) return false;
  const role = String(currentPermissions.role || '').toLowerCase();
  if(isMainAdminEmail(currentPermissions.email) || role === 'admin' || role === 'super_admin') return true;
  return !!currentPermissions[permission];
}
function canFinance(){ return can('can_manage_moderators') || ['admin','super_admin'].includes(String(currentPermissions?.role || '').toLowerCase()); }
function requirePermission(permission){
  if(can(permission)) return true;
  toast('You do not have permission to perform this action.');
  return false;
}
function applyPermissionUI(){
  const map = [
    ['tab-users','can_view_users'], ['tab-ads','can_view_ads'], ['tab-promotions','can_view_ads'],
    ['tab-reports','can_view_ads'], ['tab-categories','can_manage_categories'],
    ['tab-locations','can_manage_cities'], ['tab-fields','can_manage_categories'],
    ['tab-roles','can_manage_moderators'], ['tab-shops','can_view_users'],
    ['tab-verification','can_view_users'], ['tab-finance','finance'], ['tab-pricing','finance'], ['tab-vehiclefinance','finance'],
    ['tab-invoices','finance'], ['tab-seo','finance'], ['tab-api','finance'], ['tab-banners','finance']
  ];
  map.forEach(([id,perm]) => {
    const node = el(id);
    if(!node) return;
    node.style.display = (perm === 'finance' ? canFinance() : can(perm)) ? '' : 'none';
  });
}

/* ---------------- Data loading helpers ---------------- */
async function safeSelect(table, select='*', options={}){
  if(typeof supabaseClient === 'undefined') return [];
  try{
    let q = supabaseClient.from(table).select(select);
    if(options.eq) options.eq.forEach(([k,v]) => { q = q.eq(k,v); });
    if(options.order) q = q.order(options.order, { ascending: !!options.ascending });
    const {data,error} = await q;
    if(error) throw error;
    return data || [];
  }catch(e){
    console.warn(`Table load skipped: ${table}`, e.message || e);
    return [];
  }
}
async function safeInsert(table, payload){
  const {data,error} = await supabaseClient.from(table).insert(payload).select().single();
  if(error) throw error;
  return data;
}
async function safeUpdate(table, id, payload){
  const {error} = await supabaseClient.from(table).update(payload).eq('id', id);
  if(error) throw error;
}
async function safeDelete(table, id){
  const {error} = await supabaseClient.from(table).delete().eq('id', id);
  if(error) throw error;
}
async function loadAll(){
  await Promise.allSettled([
    loadUsers(false), loadAds(false), loadCategories(false), loadLocations(false), loadStaff(false),
    loadReports(false), loadShops(false), loadVerifications(false), loadFinance(false), loadPricing(false),
    loadInvoices(false), loadCustomFields(false), loadSettings(false), loadBanners(false), loadPromotions(false)
  ]);
  buildAllFilterOptions();
  updateStats();
  renderRevenueChart();
}
async function loadUsers(render=true){
  if(!can('can_view_users')) return;
  USERS = await safeSelect('profiles','*',{order:'created_at',ascending:false});
  if(render) renderUsers();
  updateStats();
}
async function loadAds(render=true){
  if(!can('can_view_ads')) return;
  let rows = await safeSelect('ads','*, categories(id,name,slug), cities(id,name,district_id)',{order:'created_at',ascending:false});
  if(!rows.length) rows = await safeSelect('ads','*',{order:'created_at',ascending:false});
  ensureStaticLookups();
  ADS = mergeDashboardAds(rows, siteStaticAdminAds());
  if(render) { buildAllFilterOptions(); renderAds(); renderPromotions(); renderOpsSnapshot(); renderRecentActivity(); }
  updateStats();
}
async function loadCategories(render=true){
  CATEGORIES = await safeSelect('categories','*',{order:'name',ascending:true});
  if(!CATEGORIES.length) CATEGORIES = FALLBACK_CATEGORIES.slice();
  ensureStaticLookups();
  if(render) renderCategories();
}
async function loadLocations(render=true){
  DISTRICTS = await safeSelect('districts','*',{order:'name',ascending:true});
  CITIES = await safeSelect('cities','*',{order:'name',ascending:true});
  if(!DISTRICTS.length) DISTRICTS = FALLBACK_DISTRICTS.slice();
  if(!CITIES.length) CITIES = FALLBACK_CITIES.slice();
  ensureStaticLookups();
  if(render) renderLocations();
}
async function loadStaff(render=true){
  if(!can('can_manage_moderators')) return;
  STAFF = await safeSelect('staff_permissions','*',{order:'created_at',ascending:false});
  if(render) renderStaff();
}
async function loadReports(render=true){
  REPORTS = await safeSelect('ad_reports','*',{order:'created_at',ascending:false});
  if(!REPORTS.length) REPORTS = await safeSelect('reports','*',{order:'created_at',ascending:false});
  if(render) renderReports();
}
async function loadShops(render=true){
  SHOPS = await safeSelect('shops','*',{order:'created_at',ascending:false});
  if(!SHOPS.length) SHOPS = await safeSelect('business_profiles','*',{order:'created_at',ascending:false});
  if(render) renderShops();
}
async function loadVerifications(render=true){
  VERIFICATIONS = await safeSelect('verifications','*',{order:'created_at',ascending:false});
  if(!VERIFICATIONS.length) VERIFICATIONS = await safeSelect('kyc_documents','*',{order:'created_at',ascending:false});
  if(render) renderVerifications();
}
async function loadFinance(render=true){
  PAYMENTS = await safeSelect('payments','*',{order:'created_at',ascending:false});
  if(!PAYMENTS.length) PAYMENTS = await safeSelect('payment_logs','*',{order:'created_at',ascending:false});
  if(render) renderPayments();
}
async function loadPricing(render=true){
  PRICING = await safeSelect('pricing_plans','*',{order:'created_at',ascending:false});
  if(!PRICING.length) PRICING = await safeSelect('subscription_plans','*',{order:'created_at',ascending:false});
  if(render) renderPricing();
}
async function loadInvoices(render=true){
  INVOICES = await safeSelect('invoices','*',{order:'created_at',ascending:false});
  if(render) renderInvoices();
}
async function loadCustomFields(render=true){
  CUSTOM_FIELDS = await safeSelect('custom_fields','*',{order:'created_at',ascending:false});
  if(render) renderCustomFields();
}
async function loadSettings(render=true){
  const rows = await safeSelect('site_settings','*',{order:'key',ascending:true});
  SETTINGS = {};
  rows.forEach(r => { SETTINGS[r.key || r.name] = r.value ?? r.val ?? ''; });
  applyLocalSettingFallbacks();
  fillSettingsForms();
}
async function loadBanners(render=true){
  BANNERS = await safeSelect('banner_ads','*',{order:'created_at',ascending:false});
  if(!BANNERS.length) BANNERS = await safeSelect('banners','*',{order:'created_at',ascending:false});
  if(render) renderBanners();
}

/* ---------------- Navigation ---------------- */
function showTab(tab){
  const perms = {
    users:'can_view_users', ads:'can_view_ads', promotions:'can_view_ads', reports:'can_view_ads',
    categories:'can_manage_categories', locations:'can_manage_cities', fields:'can_manage_categories',
    roles:'can_manage_moderators', shops:'can_view_users', verification:'can_view_users'
  };
  if(perms[tab] && !requirePermission(perms[tab])) return;
  if(['finance','pricing','vehiclefinance','invoices','seo','api','banners'].includes(tab) && !canFinance()){
    toast('You do not have permission to access financial or system settings.');
    return;
  }

  activeTab = tab;
  document.querySelectorAll('.section').forEach(section => section.classList.add('hidden'));
  document.querySelectorAll('.nav button').forEach(button => button.classList.remove('active'));
  el(`section-${tab}`)?.classList.remove('hidden');
  el(`tab-${tab}`)?.classList.add('active');

  const titles = {
    overview:'Overview', ads:'Ad & Listing Management', categories:'Category Management',
    promotions:'Ad Promotions', reports:'Reported Ads', users:'User Management',
    shops:'Business Directories / Shops', verification:'User Verification', finance:'Payment Logs',
    pricing:'Pricing & Subscriptions', vehiclefinance:'Vehicle Finance Settings', invoices:'Invoices', locations:'Location Settings',
    fields:'Custom Filters', roles:'Role-Based Access Control', seo:'SEO Manager',
    api:'API Settings', banners:'Banner Ads'
  };
  el('pageTitle').innerText = titles[tab] || 'Dashboard';
  el('sidebar')?.classList.remove('open');

  if(tab === 'overview') { updateStats(); renderRevenueChart(); renderOpsSnapshot(); renderRecentActivity(); }
  if(tab === 'ads') { buildAllFilterOptions(); renderAds(); }
  if(tab === 'categories') renderCategories();
  if(tab === 'promotions') renderPromotions();
  if(tab === 'reports') renderReports();
  if(tab === 'users') renderUsers();
  if(tab === 'shops') renderShops();
  if(tab === 'verification') renderVerifications();
  if(tab === 'finance') renderPayments();
  if(tab === 'pricing') renderPricing();
  if(tab === 'vehiclefinance') { fillVehicleFinanceSettingsForm(); bindVehicleFinanceSettingsInputs(); }
  if(tab === 'invoices') renderInvoices();
  if(tab === 'locations') renderLocations();
  if(tab === 'fields') renderCustomFields();
  if(tab === 'roles') renderStaff();
  if(tab === 'seo' || tab === 'api') fillSettingsForms();
  if(tab === 'banners') renderBanners();
}
async function refreshCurrentTab(){
  const loaders = {
    overview: loadAll, ads: loadAds, categories: loadCategories, promotions: async (render=true)=>{ await loadAds(false); await loadPromotions(false); await loadBanners(false); if(render) renderPromotions(); },
    reports: loadReports, users: loadUsers, shops: loadShops, verification: loadVerifications,
    finance: loadFinance, pricing: loadPricing, vehiclefinance: loadSettings, invoices: loadInvoices, locations: loadLocations,
    fields: loadCustomFields, roles: loadStaff, seo: loadSettings, api: loadSettings, banners: loadBanners
  };
  await (loaders[activeTab] || loadAll)(true);
  showTab(activeTab);
}

/* ---------------- Overview ---------------- */
function updateStats(){
  const live = ADS.filter(a => (a.status || 'pending') === 'approved').length;
  const pending = ADS.filter(a => (a.status || 'pending') === 'pending').length;
  const revenue = PAYMENTS.filter(p => ['success','paid','completed'].includes(String(p.status || '').toLowerCase()))
    .reduce((sum,p) => sum + Number(p.amount || p.price || p.total || 0), 0);
  if(el('statLiveAds')) el('statLiveAds').innerText = live;
  if(el('statPendingAds')) el('statPendingAds').innerText = pending;
  if(el('statUsers')) el('statUsers').innerText = USERS.length;
  if(el('statRevenue')) el('statRevenue').innerText = money(revenue);
}
function renderOpsSnapshot(){
  if(!el('opsSnapshot')) return;
  const data = [
    ['Pending Reviews', ADS.filter(a=>(a.status||'pending')==='pending').length, 'Ads waiting for approval'],
    ['Reported Ads', REPORTS.filter(r=>(r.status||'pending')==='pending').length, 'Needs moderator review'],
    ['Verification Queue', VERIFICATIONS.filter(v=>(v.status||'pending')==='pending').length, 'KYC / OTP verification'],
    ['Active Promotions', promotedAds().length, 'Paid visibility products']
  ];
  el('opsSnapshot').innerHTML = data.map(([label,num,sub]) => `<div class="stat"><div class="num">${html(num)}</div><div class="label">${html(label)}</div><div class="trend">${html(sub)}</div></div>`).join('');
}
function renderRecentActivity(){
  if(!el('recentActivity')) return;
  const rows = [
    ...ADS.slice(0,5).map(a => ({type:'Ad', title:a.title || 'Untitled listing', status:a.status || 'pending', date:a.created_at})),
    ...USERS.slice(0,3).map(u => ({type:'User', title:u.email || u.full_name || 'New user', status:u.status || 'active', date:u.created_at})),
    ...PAYMENTS.slice(0,3).map(p => ({type:'Payment', title:p.reference || p.id || 'Payment', status:p.status || 'pending', date:p.created_at}))
  ].sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0,8);
  if(!rows.length){ el('recentActivity').innerHTML = `<div class="empty">No recent activity found.</div>`; return; }
  el('recentActivity').innerHTML = table(['Type','Title','Status','Date'], rows.map(r => [r.type, html(r.title), statusBadge(r.status), dateText(r.date)]));
}
function renderRevenueChart(){
  const canvas = el('revenueCanvas'); if(!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const mode = el('revenueMode')?.value || 'daily';
  const paid = PAYMENTS.filter(p => ['success','paid','completed'].includes(String(p.status || '').toLowerCase()));
  const map = new Map();
  paid.forEach(p => {
    const d = new Date(p.created_at || p.paid_at || Date.now());
    const key = mode === 'monthly' ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` : d.toISOString().slice(0,10);
    map.set(key, (map.get(key) || 0) + Number(p.amount || p.price || p.total || 0));
  });
  let points = Array.from(map.entries()).sort().slice(-12);
  if(!points.length){
    const now = new Date();
    points = Array.from({length:7}).map((_,i)=> {
      const d = new Date(now); d.setDate(d.getDate() - (6-i));
      return [d.toISOString().slice(5,10), 0];
    });
  }
  const values = points.map(p=>p[1]);
  const max = Math.max(...values, 1);
  const W = canvas.width, H = canvas.height;
  const pad = 42, base = H - pad;
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
  for(let i=0;i<5;i++){ const y = pad + i*(H-2*pad)/4; ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(W-pad,y); ctx.stroke(); }
  const bw = (W-2*pad)/points.length * .6;
  points.forEach(([label,value],i)=>{
    const x = pad + i*((W-2*pad)/points.length) + 14;
    const h = (value/max)*(H-2*pad-10);
    const grad = ctx.createLinearGradient(0,base-h,0,base);
    grad.addColorStop(0,'#06b6d4'); grad.addColorStop(1,'#2563eb');
    ctx.fillStyle = grad; roundRect(ctx,x,base-h,bw,h,8); ctx.fill();
    ctx.fillStyle = '#64748b'; ctx.font = '12px Inter, Arial'; ctx.textAlign='center';
    ctx.fillText(String(label).slice(-5), x+bw/2, H-14);
  });
  ctx.fillStyle = '#0f172a'; ctx.font = '700 13px Inter, Arial'; ctx.textAlign='left';
  ctx.fillText(`Max ${money(max)}`, pad, 22);
}
function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

/* ---------------- Filters + utilities ---------------- */
function buildAllFilterOptions(){
  const adCategoryValue = el('adCategory')?.value || 'all';
  const adLocationValue = el('adLocation')?.value || 'all';

  fillCategorySelect('adCategory', true);
  fillLocationSelect('adLocation', true);
  fillCategorySelect('catParent', false, 'Main category');
  fillCategorySelect('fieldCategory', true);

  if(el('adCategory') && [...el('adCategory').options].some(o => o.value === adCategoryValue)) el('adCategory').value = adCategoryValue;
  if(el('adLocation') && [...el('adLocation').options].some(o => o.value === adLocationValue)) el('adLocation').value = adLocationValue;
}
function fillCategorySelect(id, includeAll=true, firstLabel='All categories'){
  const node = el(id); if(!node) return;
  let out = includeAll ? `<option value="all">${html(firstLabel)}</option>` : `<option value="">${html(firstLabel)}</option>`;
  CATEGORIES.forEach(c => {
    const value = slugNorm(c.id || c.slug || c.name);
    out += `<option value="${html(value)}">${html(c.name)}</option>`;
  });
  node.innerHTML = out;
}
function fillLocationSelect(id, includeAll=true){
  const node = el(id); if(!node) return;
  let out = includeAll ? `<option value="all">All locations</option>` : '';
  DISTRICTS.forEach(d => {
    const dId = slugNorm(d.id || d.slug || d.name);
    out += `<option value="district:${html(dId)}">All ads in ${html(d.name)}</option>`;
    const cities = CITIES.filter(c => slugNorm(c.district_id) === dId || norm(c.district_id) === norm(d.id) || norm(c.district_id) === norm(d.name));
    if(cities.length){
      out += `<optgroup label="${html(d.name)}">`;
      cities.forEach(c => out += `<option value="city:${html(slugNorm(c.id || c.slug || c.name))}">${html(c.name)}</option>`);
      out += `</optgroup>`;
    }
  });
  node.innerHTML = out;
}
function table(headers, rows){
  return `<div class="table-wrap"><table class="table"><thead><tr>${headers.map(h=>`<th>${html(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function matchesText(obj, q){ return !q || JSON.stringify(obj).toLowerCase().includes(q.toLowerCase()); }
function imageOf(a){
  if(a.image_url) return a.image_url;
  if(Array.isArray(a.images) && a.images[0]) return a.images[0];
  if(typeof a.images === 'string'){
    try{ const p = JSON.parse(a.images); if(Array.isArray(p) && p[0]) return p[0]; }catch(e){}
    return a.images;
  }
  return '';
}
function catNameById(id){
  const c = CATEGORIES.find(x => String(x.id).toLowerCase() === String(id).toLowerCase() || String(x.slug).toLowerCase() === String(id).toLowerCase());
  return c?.name || id || '-';
}
function cityNameById(id){
  const c = CITIES.find(x => String(x.id).toLowerCase() === String(id).toLowerCase() || String(x.name).toLowerCase() === String(id).toLowerCase());
  return c?.name || id || '-';
}
function adCategoryName(a){ return a.categories?.name || a.category_name || catNameById(a.category_id) || '-'; }
function adCityName(a){ return a.cities?.name || a.city_name || a.city || cityNameById(a.city_id) || a.location || '-'; }
function adSeller(a){ return a.profiles?.email || a.user_email || a.email || a.phone || '-'; }

function norm(v){
  return String(v ?? '').toLowerCase().trim();
}
function slugNorm(v){
  return slug(String(v ?? '')).toLowerCase();
}
function categoryByAny(value){
  const v = norm(value);
  const s = slugNorm(value);
  return CATEGORIES.find(c => {
    const ids = [
      c.id, c.slug, c.name, c.category_id, c.value
    ].map(x => norm(x));
    const slugs = [
      c.id, c.slug, c.name, c.category_id, c.value
    ].map(x => slugNorm(x));
    return ids.includes(v) || slugs.includes(s);
  }) || null;
}
function categoryChildrenIds(parentValue){
  const parent = categoryByAny(parentValue);
  if(!parent) return [];
  const parentKeys = [parent.id, parent.slug, parent.name].map(x => norm(x)).filter(Boolean);
  return CATEGORIES
    .filter(c => parentKeys.includes(norm(c.parent_id)) || parentKeys.includes(norm(c.parent_slug)) || parentKeys.includes(norm(c.parent)))
    .flatMap(c => [c.id, c.slug, c.name].map(x => norm(x)).filter(Boolean));
}
function adCategoryTokens(a){
  const raw = [
    a.category_id, a.categoryId, a.subcategory_id, a.subcategoryId,
    a.categories?.id, a.categories?.slug, a.categories?.name,
    a.category_name, a.category, a.subcategory_name, a.subcategory
  ];
  const cat = categoryByAny(a.category_id || a.categoryId || a.categories?.id || a.category || a.category_name);
  if(cat) raw.push(cat.id, cat.slug, cat.name, cat.parent_id, cat.parent_slug);
  const sub = categoryByAny(a.subcategory_id || a.subcategoryId || a.subcategory || a.subcategory_name);
  if(sub) raw.push(sub.id, sub.slug, sub.name, sub.parent_id, sub.parent_slug);
  return new Set(raw.flatMap(x => [norm(x), slugNorm(x)]).filter(Boolean));
}
function locationByAny(value){
  const v = norm(value);
  const s = slugNorm(value);
  const city = CITIES.find(c => [c.id,c.slug,c.name,c.city].map(x=>norm(x)).includes(v) || [c.id,c.slug,c.name,c.city].map(x=>slugNorm(x)).includes(s));
  if(city) return {type:'city', row:city};
  const district = DISTRICTS.find(d => [d.id,d.slug,d.name,d.district].map(x=>norm(x)).includes(v) || [d.id,d.slug,d.name,d.district].map(x=>slugNorm(x)).includes(s));
  if(district) return {type:'district', row:district};
  return null;
}
function adLocationTokens(a){
  const raw = [
    a.city_id, a.cityId, a.district_id, a.districtId,
    a.cities?.id, a.cities?.slug, a.cities?.name, a.cities?.district_id,
    a.city_name, a.city, a.location, a.district_name, a.district
  ];
  const city = locationByAny(a.city_id || a.cityId || a.cities?.id || a.city || a.city_name || a.location);
  if(city?.row) raw.push(city.row.id, city.row.slug, city.row.name, city.row.district_id);
  const district = locationByAny(a.district_id || a.districtId || a.cities?.district_id || a.district || a.district_name);
  if(district?.row) raw.push(district.row.id, district.row.slug, district.row.name);
  return new Set(raw.flatMap(x => [norm(x), slugNorm(x)]).filter(Boolean));
}
function adMatchesCategory(a, selected){
  if(!selected || selected === 'all') return true;
  const selectedTokens = new Set([norm(selected), slugNorm(selected), ...categoryChildrenIds(selected)]);
  const selectedCat = categoryByAny(selected);
  if(selectedCat){
    [selectedCat.id, selectedCat.slug, selectedCat.name, selectedCat.parent_id].forEach(x => {
      if(x){ selectedTokens.add(norm(x)); selectedTokens.add(slugNorm(x)); }
    });
  }
  const adTokens = adCategoryTokens(a);
  for(const token of selectedTokens){
    if(token && adTokens.has(token)) return true;
  }
  return false;
}
function adMatchesLocation(a, selected){
  if(!selected || selected === 'all') return true;
  let kind = '', value = selected;
  if(String(selected).includes(':')){
    [kind, value] = String(selected).split(':');
  }
  const selectedTokens = new Set([norm(value), slugNorm(value)]);
  const selectedLoc = locationByAny(value);
  if(selectedLoc?.row){
    [selectedLoc.row.id, selectedLoc.row.slug, selectedLoc.row.name, selectedLoc.row.district_id].forEach(x => {
      if(x){ selectedTokens.add(norm(x)); selectedTokens.add(slugNorm(x)); }
    });
  }

  const adTokens = adLocationTokens(a);
  if(kind === 'district'){
    const districtKeys = new Set([...selectedTokens]);
    const childCities = CITIES.filter(c => districtKeys.has(norm(c.district_id)) || districtKeys.has(slugNorm(c.district_id)));
    childCities.forEach(c => [c.id,c.slug,c.name].forEach(x => {
      if(x){ selectedTokens.add(norm(x)); selectedTokens.add(slugNorm(x)); }
    }));
  }

  for(const token of selectedTokens){
    if(token && adTokens.has(token)) return true;
  }
  return false;
}
function adMatchesFilter(a, searchId, statusId, catId, locId){
  const q = (el(searchId)?.value || '').toLowerCase().trim();
  const status = el(statusId)?.value || 'all';
  const cat = el(catId)?.value || 'all';
  const loc = el(locId)?.value || 'all';
  const text = JSON.stringify(a).toLowerCase();

  if(q && !text.includes(q)) return false;
  if(status !== 'all' && norm(a.status || 'pending') !== norm(status)) return false;
  if(!adMatchesCategory(a, cat)) return false;
  if(!adMatchesLocation(a, loc)) return false;
  return true;
}

/* ---------------- Ads ---------------- */
function renderAds(){
  const target = el('adsList'); if(!target) return;
  buildAllFilterOptions();
  const rows = ADS.filter(a => adMatchesFilter(a,'adSearch','adStatus','adCategory','adLocation'));
  if(!rows.length){ target.innerHTML = `<div class="empty">No listings found.</div>`; return; }
  target.innerHTML = rows.map(renderAdCard).join('');
}
function renderAdCard(a){
  const img = imageOf(a);
  return `<article class="listing-card">
    <div class="listing-thumb">${img?`<img src="${html(img)}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'noimg',innerText:'e'}))">`:`<div class="noimg">e</div>`}<div class="listing-status">${statusBadge(a.status || 'pending')}</div></div>
    <div class="listing-body">
      <div class="listing-title">${html(a.title || 'Untitled listing')}</div>
      <div class="listing-price">${html(money(a.price))}</div>
      ${vehicleFinanceSummaryHtml(a)}
      <div class="listing-meta"><span>📍 ${html(adCityName(a))}</span><span>🗂 ${html(adCategoryName(a))}</span><span>👤 ${html(adSeller(a))}</span></div>
      <div class="listing-desc">${html((a.description || '').slice(0,160))}</div>
      <div class="listing-actions">
        <button class="btn small" onclick="editAd('${html(a.id)}')" ${can('can_edit_ads')?'':'disabled'}>Edit</button>
        <button class="btn ok small" onclick="approveAd('${html(a.id)}')" ${can('can_approve_ads')?'':'disabled'}>Approve</button>
        <button class="btn warn small" onclick="rejectAd('${html(a.id)}')" ${can('can_approve_ads')?'':'disabled'}>Reject</button>
        <button class="btn danger small" onclick="deleteAd('${html(a.id)}')" ${can('can_delete_ads')?'':'disabled'}>Delete</button>
      </div>
    </div>
  </article>`;
}
async function approveAd(id){
  if(!requirePermission('can_approve_ads')) return;
  const current = ADS.find(x => String(x.id) === String(id));
  if(current?.source === 'site_static'){
    updateStaticAdOverrideFor(current, {status:'approved', deleted:false});
    await loadAds(true);
    return;
  }
  try{ await safeUpdate('ads',id,{status:'approved',reject_reason:null,updated_at:new Date().toISOString()}); await loadAds(true); }catch(e){toast(e.message);}
}
async function rejectAd(id){
  if(!requirePermission('can_approve_ads')) return;
  const reason=prompt('Reject reason')||'';
  const current = ADS.find(x => String(x.id) === String(id));
  if(current?.source === 'site_static'){
    updateStaticAdOverrideFor(current, {status:'rejected', reject_reason:reason});
    await loadAds(true);
    return;
  }
  try{ await safeUpdate('ads',id,{status:'rejected',reject_reason:reason,updated_at:new Date().toISOString()}); await loadAds(true); }catch(e){toast(e.message);}
}
async function deleteAd(id){
  if(!requirePermission('can_delete_ads')) return;
  if(!confirm('Delete this listing?')) return;
  const current = ADS.find(x => String(x.id) === String(id));
  if(current?.source === 'site_static'){
    updateStaticAdOverrideFor(current, {deleted:true, status:'deleted'});
    await loadAds(true);
    return;
  }
  try{ await safeDelete('ads',id); await loadAds(true); }catch(e){toast(e.message);}
}
function editAd(id){ if(!requirePermission('can_edit_ads')) return; const a=ADS.find(x=>String(x.id)===String(id)); if(!a) return; openAdModal(a); }
function openAdCreate(){ if(!requirePermission('can_edit_ads')) return; openAdModal({status:'pending'}); }
function openAdModal(a){
  openModal(a.id?'Edit Listing':'Add Listing', `<div class="grid">
    <div class="field"><label>Title</label><input class="input" id="editTitle" value="${html(a.title||'')}"></div>
    <div class="field"><label>Price</label><input class="input" id="editPrice" value="${html(a.price||'')}"></div>
    <div class="field"><label>Phone</label><input class="input" id="editPhone" value="${html(a.phone||'')}"></div>
    <div class="field"><label>Status</label><select id="editStatus"><option ${a.status==='pending'?'selected':''} value="pending">Pending</option><option ${a.status==='approved'?'selected':''} value="approved">Approved</option><option ${a.status==='rejected'?'selected':''} value="rejected">Rejected</option></select></div>
    <div class="field"><label>Category</label><select id="editCategory">${CATEGORIES.map(c=>`<option value="${html(c.id)}" ${String(a.category_id)===String(c.id)?'selected':''}>${html(c.name)}</option>`).join('')}</select></div>
    <div class="field"><label>City</label><select id="editCity">${CITIES.map(c=>`<option value="${html(c.id)}" ${String(a.city_id)===String(c.id)?'selected':''}>${html(c.name)}</option>`).join('')}</select></div>
    <div class="field"><label>Image URL</label><input class="input" id="editImage" value="${html(imageOf(a))}"></div>
    <div class="field"><label>Promotion type</label><select id="editPromotion"><option value="">None</option><option ${a.promotion_type==='top'?'selected':''} value="top">Top Ad</option><option ${a.promotion_type==='bump'?'selected':''} value="bump">Bump Ad</option><option ${a.promotion_type==='urgent'?'selected':''} value="urgent">Urgent</option></select></div>
    <div class="field" style="grid-column:1/-1"><label>Description</label><textarea id="editDescription">${html(a.description||'')}</textarea></div>
    <div style="grid-column:1/-1">${editModalFinancePreview(a)}</div>
  </div>
  <button class="btn primary" onclick="saveAd('${html(a.id||'')}')">Save Listing</button>`);
  bindEditFinancePreview();
}
async function saveAd(id){
  if(!requirePermission('can_edit_ads')) return;
  const current = ADS.find(x => String(x.id) === String(id));
  const editedAdForFinance = {price: el('editPrice').value, category_id: el('editCategory').value, categories:{name: el('editCategory')?.selectedOptions?.[0]?.textContent || ''}};
  const finance = isVehicleAd(editedAdForFinance) ? calcVehicleFinance(el('editPrice').value) : null;
  const payload = {
    title:el('editTitle').value, price:el('editPrice').value||null, phone:el('editPhone').value,
    status:el('editStatus').value, category_id:el('editCategory').value || null, city_id:el('editCity').value || null,
    image_url:el('editImage').value, description:el('editDescription').value, promotion_type:el('editPromotion').value || null,
    is_promoted:!!el('editPromotion').value,
    finance_enabled: !!finance,
    finance_downpayment: finance ? finance.downPayment : null,
    finance_monthly_payment: finance ? finance.monthlyPayment : null,
    finance_downpayment_percent: finance ? finance.downPaymentPercent : null,
    finance_annual_rate_percent: finance ? finance.annualRatePercent : null,
    finance_months: finance ? finance.months : null,
    finance_company_phone: finance ? finance.companyPhone : null,
    updated_at:new Date().toISOString()
  };
  if(current?.source === 'site_static'){
    updateStaticAdOverrideFor(current, staticPatchFromEditor(current));
    closeModal();
    await loadAds(true);
    return;
  }
  try{
    if(id) await safeUpdate('ads',id,payload); else await safeInsert('ads',payload);
    closeModal(); await loadAds(true);
  }catch(e){
    if(String(e.message || '').includes('finance_')){
      const fallbackPayload = {...payload};
      ['finance_enabled','finance_downpayment','finance_monthly_payment','finance_downpayment_percent','finance_annual_rate_percent','finance_months','finance_company_phone'].forEach(k => delete fallbackPayload[k]);
      try{
        if(id) await safeUpdate('ads',id,fallbackPayload); else await safeInsert('ads',fallbackPayload);
        closeModal(); await loadAds(true);
        toast('Listing saved. Run vehicle finance SQL to store finance fields in Supabase.');
      }catch(inner){ toast(inner.message); }
    } else {
      toast(e.message);
    }
  }
}

/* ---------------- Categories ---------------- */
function renderCategories(){
  fillCategorySelect('catParent', false, 'Main category');
  fillCategorySelect('fieldCategory', true);
  const rows = CATEGORIES;
  if(!rows.length){ el('categoriesList').innerHTML = `<div class="empty">No categories found.</div>`; return; }
  el('categoriesList').innerHTML = table(['Name','Slug','Parent','Status','Actions'], rows.map(c => [
    `<b>${html(c.name)}</b>`,
    html(c.slug || slug(c.name)),
    html(catNameById(c.parent_id) || (c.parent_id ? c.parent_id : 'Main')),
    statusBadge(c.is_active === false ? 'disabled' : 'active'),
    `<div class="actions"><button class="btn small" onclick="editCategory('${html(c.id)}')">Edit</button><button class="btn danger small" onclick="deleteCategory('${html(c.id)}')">Delete</button></div>`
  ]));
}
function resetCategoryForm(){ ['catId','catName','catSlug','catParent'].forEach(id=>{ if(el(id)) el(id).value=''; }); }
function editCategory(id){
  const c=CATEGORIES.find(x=>String(x.id)===String(id)); if(!c) return;
  el('catId').value=c.id; el('catName').value=c.name||''; el('catSlug').value=c.slug||slug(c.name); el('catParent').value=c.parent_id||'';
}
async function saveCategory(){
  if(!requirePermission('can_manage_categories')) return;
  const id=el('catId').value;
  const payload={name:el('catName').value, slug:el('catSlug').value || slug(el('catName').value), parent_id:el('catParent').value || null, is_active:true};
  try{
    if(id) await safeUpdate('categories',id,payload); else await safeInsert('categories',payload);
    resetCategoryForm(); await loadCategories(true);
  }catch(e){ toast(e.message); }
}
async function deleteCategory(id){
  if(!requirePermission('can_manage_categories')) return;
  if(!confirm('Delete this category?')) return;
  try{ await safeDelete('categories',id); await loadCategories(true); }catch(e){ toast(e.message); }
}

/* ---------------- Promotions + Reports ---------------- */
function promotedAds(){
  return ADS.filter(a => a.is_promoted || a.promoted || a.is_featured || a.featured || a.promotion_type || a.is_urgent || a.is_top);
}
function renderPromotions(){
  const q=(el('promoSearch')?.value||'').toLowerCase();
  const type=el('promoType')?.value||'all';
  const status=el('promoStatus')?.value||'all';
  let rows = promotedAds();
  if(q) rows = rows.filter(a => JSON.stringify(a).toLowerCase().includes(q));
  if(type !== 'all') rows = rows.filter(a => String(a.promotion_type || (a.is_urgent?'urgent':a.is_top?'top':a.is_featured?'featured':a.is_promoted?'promoted':'')).toLowerCase().includes(type));
  if(status !== 'all') rows = rows.filter(a => status === 'active' ? (a.status||'approved')==='approved' : (a.status||'')!=='approved');
  const target=el('promotionsList'); if(!target) return;
  if(!rows.length){ target.innerHTML=`<div class="empty">No promoted listings found.</div>`; return; }
  target.innerHTML = rows.map(a => renderAdCard(a)).join('');
}
function openPromotionModal(){ openAdCreate(); }
function renderReports(){
  const q=(el('reportSearch')?.value||'').toLowerCase();
  const status=el('reportStatus')?.value||'pending';
  let rows=REPORTS.filter(r => (status==='all'||(r.status||'pending')===status) && matchesText(r,q));
  if(!rows.length){ el('reportsList').innerHTML=`<div class="empty">No reports found.</div>`; return; }
  el('reportsList').innerHTML = table(['Ad','Reason','Reporter','Status','Date','Actions'], rows.map(r => [
    html(r.ad_id || r.listing_id || '-'), html(r.reason || r.message || r.type || '-'), html(r.reporter_email || r.email || r.user_id || '-'),
    statusBadge(r.status || 'pending'), dateText(r.created_at),
    `<div class="actions"><button class="btn ok small" onclick="resolveReport('${html(r.id)}')">Resolve</button><button class="btn warn small" onclick="markReport('${html(r.id)}','reviewed')">Reviewed</button>${r.ad_id?`<button class="btn danger small" onclick="rejectAd('${html(r.ad_id)}')">Reject Ad</button>`:''}</div>`
  ]));
}
async function markReport(id,status){ try{ await safeUpdate(REPORTS[0]?.table || 'ad_reports',id,{status,updated_at:new Date().toISOString()}); await loadReports(true); }catch(e){ toast(e.message); } }
async function resolveReport(id){ await markReport(id,'resolved'); }

/* ---------------- Users / Shops / Verification ---------------- */
function renderUsers(){
  const q=(el('userSearch')?.value||'').toLowerCase();
  const status=el('userStatus')?.value||'all';
  const role=el('userRole')?.value||'all';
  let rows=USERS.filter(u => matchesText(u,q) && (status==='all'||(u.status||'active')===status) && (role==='all'||(u.role||'user')===role));
  if(!rows.length){ el('usersList').innerHTML=`<div class="empty">No users found.</div>`; return; }
  el('usersList').innerHTML = table(['User','Phone','Joined','Status','Role','Actions'], rows.map(u => [
    `<b>${html(u.full_name || u.name || 'No name')}</b><br><span class="small">${html(u.email || '')}</span>`,
    html(u.phone || '-'), dateText(u.created_at), statusBadge(u.status || 'active'), html(u.role || 'user'),
    `<div class="actions"><button class="btn ok small" onclick="updateUser('${html(u.id)}','approved')">Approve</button><button class="btn warn small" onclick="updateUser('${html(u.id)}','suspended')">Suspend</button><button class="btn danger small" onclick="updateUser('${html(u.id)}','blocked')">Block</button></div>`
  ]));
}
async function updateUser(id,status){ if(!requirePermission('can_approve_users')) return; try{ await safeUpdate('profiles',id,{status,updated_at:new Date().toISOString()}); await loadUsers(true); }catch(e){ toast(e.message); } }
function renderShops(){
  const q=(el('shopSearch')?.value||'').toLowerCase(); const status=el('shopStatus')?.value||'all';
  const rows=SHOPS.filter(s => matchesText(s,q) && (status==='all'||(s.status||'active')===status));
  if(!rows.length){ el('shopsList').innerHTML=`<div class="empty">No business profiles found.</div>`; return; }
  el('shopsList').innerHTML = table(['Shop','Owner','Category','Status','Actions'], rows.map(s => [
    `<b>${html(s.name || s.shop_name || 'Untitled shop')}</b><br><span class="small">${html(s.email || s.phone || '')}</span>`,
    html(s.owner_name || s.user_id || '-'), html(s.category || s.business_type || '-'), statusBadge(s.status || 'active'),
    `<div class="actions"><button class="btn small" onclick="editShop('${html(s.id)}')">Edit</button><button class="btn warn small" onclick="updateShopStatus('${html(s.id)}','suspended')">Suspend</button></div>`
  ]));
}
function openShopModal(){ openModal('Add Shop', `<div class="grid"><div class="field"><label>Shop name</label><input class="input" id="shopName"></div><div class="field"><label>Phone</label><input class="input" id="shopPhone"></div><div class="field"><label>Category</label><input class="input" id="shopCategory"></div><div class="field"><label>Status</label><select id="shopStatusEdit"><option value="active">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option></select></div></div><button class="btn primary" onclick="saveShop()">Save Shop</button>`); }
function editShop(id){ const s=SHOPS.find(x=>String(x.id)===String(id)); if(!s) return; openShopModal(); el('shopName').value=s.name||s.shop_name||''; el('shopPhone').value=s.phone||''; el('shopCategory').value=s.category||s.business_type||''; el('shopStatusEdit').value=s.status||'active'; el('shopName').dataset.id=id; }
async function saveShop(){ try{ const id=el('shopName').dataset.id; const payload={name:el('shopName').value,phone:el('shopPhone').value,category:el('shopCategory').value,status:el('shopStatusEdit').value,updated_at:new Date().toISOString()}; if(id) await safeUpdate('shops',id,payload); else await safeInsert('shops',payload); closeModal(); await loadShops(true); }catch(e){ toast(e.message); } }
async function updateShopStatus(id,status){ try{ await safeUpdate('shops',id,{status,updated_at:new Date().toISOString()}); await loadShops(true); }catch(e){ toast(e.message); } }
function renderVerifications(){
  const q=(el('verifySearch')?.value||'').toLowerCase(); const status=el('verifyStatus')?.value||'pending';
  const rows=VERIFICATIONS.filter(v => matchesText(v,q) && (status==='all'||(v.status||'pending')===status));
  if(!rows.length){ el('verificationList').innerHTML=`<div class="empty">No verification requests found.</div>`; return; }
  el('verificationList').innerHTML = table(['User','Type','Document','Status','Date','Actions'], rows.map(v => [
    html(v.user_email || v.email || v.user_id || '-'), html(v.type || v.document_type || 'KYC'), v.document_url?`<a target="_blank" href="${html(v.document_url)}">Open document</a>`:html(v.document_number||'-'),
    statusBadge(v.status||'pending'), dateText(v.created_at),
    `<div class="actions"><button class="btn ok small" onclick="updateVerification('${html(v.id)}','approved')">Approve</button><button class="btn danger small" onclick="updateVerification('${html(v.id)}','rejected')">Reject</button></div>`
  ]));
}
async function updateVerification(id,status){ try{ await safeUpdate('verifications',id,{status,updated_at:new Date().toISOString()}); await loadVerifications(true); }catch(e){ toast(e.message); } }

/* ---------------- Finance / Pricing / Invoices ---------------- */
function renderPayments(){
  const q=(el('paymentSearch')?.value||'').toLowerCase(); const status=el('paymentStatus')?.value||'all'; const gateway=el('paymentGateway')?.value||'all';
  const rows=PAYMENTS.filter(p => matchesText(p,q) && (status==='all'||String(p.status||'').toLowerCase()===status) && (gateway==='all'||String(p.gateway||p.provider||'').toLowerCase().includes(gateway)));
  if(!rows.length){ el('paymentsList').innerHTML=`<div class="empty">No payment logs found.</div>`; return; }
  el('paymentsList').innerHTML = table(['Reference','User','Gateway','Amount','Status','Date'], rows.map(p => [
    html(p.reference || p.order_id || p.id), html(p.user_email || p.email || p.user_id || '-'), html(p.gateway || p.provider || '-'),
    html(money(p.amount || p.total || p.price)), statusBadge(p.status || 'pending'), dateText(p.created_at || p.paid_at)
  ]));
}
function renderPricing(){
  if(!PRICING.length){ el('pricingList').innerHTML=`<div class="empty">No pricing plans found.</div>`; return; }
  el('pricingList').innerHTML = table(['Plan','Type','Price','Duration','Actions'], PRICING.map(p => [
    `<b>${html(p.name || p.title)}</b>`, html(p.type || 'promotion'), html(money(p.price)), html((p.duration_days || p.duration || '-') + ' days'),
    `<div class="actions"><button class="btn small" onclick="editPlan('${html(p.id)}')">Edit</button><button class="btn danger small" onclick="deletePlan('${html(p.id)}')">Delete</button></div>`
  ]));
}
function editPlan(id){ const p=PRICING.find(x=>String(x.id)===String(id)); if(!p) return; el('planId').value=p.id; el('planName').value=p.name||p.title||''; el('planType').value=p.type||'promotion'; el('planPrice').value=p.price||''; el('planDuration').value=p.duration_days||p.duration||''; }
async function savePlan(){ try{ const id=el('planId').value; const payload={name:el('planName').value,type:el('planType').value,price:Number(el('planPrice').value||0),duration_days:Number(el('planDuration').value||0),is_active:true,updated_at:new Date().toISOString()}; if(id) await safeUpdate('pricing_plans',id,payload); else await safeInsert('pricing_plans',payload); await loadPricing(true); ['planId','planName','planPrice','planDuration'].forEach(id=>el(id).value=''); }catch(e){ toast(e.message); } }
async function deletePlan(id){ if(!confirm('Delete this plan?')) return; try{ await safeDelete('pricing_plans',id); await loadPricing(true); }catch(e){ toast(e.message); } }
function renderInvoices(){
  if(!INVOICES.length){ el('invoicesList').innerHTML=`<div class="empty">No invoices found.</div>`; return; }
  el('invoicesList').innerHTML = table(['Invoice','User','Amount','Status','Date'], INVOICES.map(i => [
    html(i.invoice_no || i.number || i.id), html(i.user_email || i.email || i.user_id || '-'), html(money(i.amount || i.total)), statusBadge(i.status || 'pending'), dateText(i.created_at)
  ]));
}

/* ---------------- Locations / Custom Fields ---------------- */
function renderLocations(){
  const distRows = DISTRICTS.map(d => `<div class="listing-card" style="padding:12px;margin-bottom:8px"><b>${html(d.name)}</b><div class="actions" style="margin-top:8px"><button class="btn danger small" onclick="deleteDistrict('${html(d.id)}')">Delete</button></div></div>`).join('') || `<div class="empty">No districts found.</div>`;
  const cityRows = CITIES.map(c => `<div class="listing-card" style="padding:12px;margin-bottom:8px"><b>${html(c.name)}</b><br><span class="small">${html(catDistrictName(c.district_id))}</span><div class="actions" style="margin-top:8px"><button class="btn danger small" onclick="deleteCity('${html(c.id)}')">Delete</button></div></div>`).join('') || `<div class="empty">No cities found.</div>`;
  if(el('districtsList')) el('districtsList').innerHTML = distRows;
  if(el('citiesList')) el('citiesList').innerHTML = cityRows;
  const select=el('cityDistrict');
  if(select) select.innerHTML = DISTRICTS.map(d=>`<option value="${html(d.id)}">${html(d.name)}</option>`).join('');
}
function catDistrictName(id){ return DISTRICTS.find(d=>String(d.id)===String(id))?.name || '-'; }
async function addDistrict(){ if(!requirePermission('can_manage_cities')) return; try{ await safeInsert('districts',{name:el('districtName').value,slug:slug(el('districtName').value),is_active:true}); el('districtName').value=''; await loadLocations(true); }catch(e){ toast(e.message); } }
async function addCity(){ if(!requirePermission('can_manage_cities')) return; try{ await safeInsert('cities',{name:el('cityName').value,slug:slug(el('cityName').value),district_id:el('cityDistrict').value,is_active:true}); el('cityName').value=''; await loadLocations(true); }catch(e){ toast(e.message); } }
async function deleteDistrict(id){ if(!confirm('Delete this district?')) return; try{ await safeDelete('districts',id); await loadLocations(true); }catch(e){ toast(e.message); } }
async function deleteCity(id){ if(!confirm('Delete this city?')) return; try{ await safeDelete('cities',id); await loadLocations(true); }catch(e){ toast(e.message); } }
function renderCustomFields(){
  fillCategorySelect('fieldCategory', true);
  if(!CUSTOM_FIELDS.length){ el('fieldsList').innerHTML=`<div class="empty">No custom fields found.</div>`; return; }
  el('fieldsList').innerHTML = table(['Category','Field','Type','Options','Actions'], CUSTOM_FIELDS.map(f => [
    html(catNameById(f.category_id)), `<b>${html(f.label || f.name)}</b>`, html(f.type || f.field_type || 'text'), html((f.options || '').toString().slice(0,60)),
    `<div class="actions"><button class="btn small" onclick="editCustomField('${html(f.id)}')">Edit</button><button class="btn danger small" onclick="deleteCustomField('${html(f.id)}')">Delete</button></div>`
  ]));
}
function editCustomField(id){ const f=CUSTOM_FIELDS.find(x=>String(x.id)===String(id)); if(!f)return; el('fieldId').value=f.id; el('fieldCategory').value=f.category_id||'all'; el('fieldLabel').value=f.label||f.name||''; el('fieldType').value=f.type||f.field_type||'text'; el('fieldOptions').value=Array.isArray(f.options)?f.options.join('\n'):(f.options||''); }
async function saveCustomField(){ try{ const id=el('fieldId').value; const payload={category_id:el('fieldCategory').value==='all'?null:el('fieldCategory').value,label:el('fieldLabel').value,name:el('fieldLabel').value,type:el('fieldType').value,options:el('fieldOptions').value.split('\n').map(x=>x.trim()).filter(Boolean),is_active:true,updated_at:new Date().toISOString()}; if(id) await safeUpdate('custom_fields',id,payload); else await safeInsert('custom_fields',payload); await loadCustomFields(true); ['fieldId','fieldLabel','fieldOptions'].forEach(id=>el(id).value=''); }catch(e){ toast(e.message); } }
async function deleteCustomField(id){ if(!confirm('Delete this field?')) return; try{ await safeDelete('custom_fields',id); await loadCustomFields(true); }catch(e){ toast(e.message); } }

/* ---------------- Staff Roles ---------------- */
function renderRolesReference(){
  if(!el('rolesReference')) return;
  el('rolesReference').innerHTML = table(['Role','Access','Responsibilities'], Object.entries(ROLE_PRESETS).map(([k,r]) => [html(r.label), html(r.access), html(r.description)]));
}
function renderStaffPerms(){
  if(!el('staffPerms')) return;
  el('staffPerms').innerHTML = Object.entries(PERMISSIONS).map(([key,label]) => `<label><input type="checkbox" id="perm_${key}"> ${html(label)}</label>`).join('');
}
function setStaffPreset(type){
  renderStaffPerms();
  const set = (key,val) => { const n=el('perm_'+key); if(n) n.checked=val; };
  Object.keys(PERMISSIONS).forEach(k=>set(k,false));
  if(type==='full'){ Object.keys(PERMISSIONS).forEach(k=>set(k,true)); el('staffRole').value='admin'; }
  if(type==='moderator'){ ['can_view_ads','can_approve_ads','can_edit_ads'].forEach(k=>set(k,true)); el('staffRole').value='moderator'; }
  if(type==='support'){ ['can_view_users','can_approve_users','can_view_ads'].forEach(k=>set(k,true)); el('staffRole').value='support'; }
}
function staffPayload(){
  const payload={email:el('staffEmail').value.trim().toLowerCase(),role:el('staffRole').value,is_active:true};
  Object.keys(PERMISSIONS).forEach(k => payload[k]=!!el('perm_'+k)?.checked);
  return payload;
}
function renderStaff(){
  renderRolesReference(); renderStaffPerms();
  if(!can('can_manage_moderators')){ el('staffList').innerHTML=`<div class="empty">You do not have permission to manage staff.</div>`; return; }
  if(!STAFF.length){ el('staffList').innerHTML=`<div class="empty">No staff accounts found.</div>`; return; }
  el('staffList').innerHTML = STAFF.map(s => `<div class="listing-card" style="padding:14px;margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;gap:12px"><div><b>${html(s.email)}</b><br><span class="small">${html(s.role || 'staff')}</span></div>${statusBadge(s.is_active===false?'disabled':'active')}</div>
    <div class="chips" style="margin:12px 0">${Object.entries(PERMISSIONS).map(([k,l])=>`<span class="chip ${s[k]?'':'off'}">${s[k]?'✓':'○'} ${html(l)}</span>`).join('')}</div>
    <div class="actions"><button class="btn small" onclick="editStaff('${html(s.id)}')">Edit</button><button class="btn warn small" onclick="toggleStaff('${html(s.id)}',${s.is_active!==false})">${s.is_active===false?'Enable':'Disable'}</button><button class="btn danger small" onclick="deleteStaff('${html(s.id)}','${html(s.email)}')">Remove</button></div>
  </div>`).join('');
}
function editStaff(id){
  const s=STAFF.find(x=>String(x.id)===String(id)); if(!s) return;
  el('staffEmail').value=s.email||''; el('staffRole').value=s.role||'moderator';
  renderStaffPerms(); Object.keys(PERMISSIONS).forEach(k => { if(el('perm_'+k)) el('perm_'+k).checked=!!s[k]; });
  el('staffEmail').dataset.id=id;
}
async function saveStaff(){
  if(!requirePermission('can_manage_moderators')) return;
  const payload=staffPayload();
  if(!payload.email){ toast('Email required.'); return; }
  try{
    try{
      const rpcPayload = {
        staff_email: payload.email, staff_role: payload.role,
        p_can_view_users:payload.can_view_users, p_can_approve_users:payload.can_approve_users,
        p_can_view_ads:payload.can_view_ads, p_can_approve_ads:payload.can_approve_ads,
        p_can_edit_ads:payload.can_edit_ads, p_can_delete_ads:payload.can_delete_ads,
        p_can_manage_categories:payload.can_manage_categories, p_can_manage_cities:payload.can_manage_cities,
        p_can_manage_moderators:payload.can_manage_moderators
      };
      const {error}=await supabaseClient.rpc('add_staff_by_email', rpcPayload);
      if(error) throw error;
    }catch(rpcError){
      await supabaseClient.from('staff_permissions').upsert(payload,{onConflict:'email'});
    }
    el('staffEmail').value=''; delete el('staffEmail').dataset.id; renderStaffPerms(); await loadStaff(true);
  }catch(e){ toast(e.message); }
}
async function toggleStaff(id,active){ if(!requirePermission('can_manage_moderators')) return; const s=STAFF.find(x=>String(x.id)===String(id)); if(s && isMainAdminEmail(s.email)){ toast('The main admin account cannot be disabled.'); return; } try{ await safeUpdate('staff_permissions',id,{is_active:!active}); await loadStaff(true); }catch(e){toast(e.message);} }
async function deleteStaff(id,email){ if(!requirePermission('can_manage_moderators')) return; if(isMainAdminEmail(email)){ toast('The main admin account cannot be removed.'); return; } if(!confirm(`Remove staff permissions for ${email}?`)) return; try{ await safeDelete('staff_permissions',id); await loadStaff(true); }catch(e){toast(e.message);} }

/* ---------------- Settings + Banners ---------------- */
function settingValue(key){ return SETTINGS[key] || ''; }
function fillSettingsForms(){
  const pairs = {
    seoTitle:'seo_title', seoDescription:'seo_description', seoKeywords:'seo_keywords',
    ogTitle:'og_title', ogImage:'og_image', smsProvider:'sms_provider', smsSender:'sms_sender', otpExpiryMinutes:'otp_expiry_minutes',
    otpTemplate:'otp_sms_template', paymentProvider:'payment_provider', merchantId:'merchant_id', paymentSecret:'payment_secret'
  };
  Object.entries(pairs).forEach(([id,key]) => { if(el(id)) el(id).value = settingValue(key); });
  const checked=(id,key,def=true)=>{ if(el(id)) el(id).checked = settingValue(key)==='' ? def : !['false','0','off','disabled'].includes(String(settingValue(key)).toLowerCase()); };

  checked('smsOtpEnabled','sms_otp_enabled'); checked('smsRegisterOtp','sms_otp_register_enabled'); checked('smsPasswordOtp','sms_otp_password_change_enabled'); checked('smsAdPhoneOtp','sms_otp_ad_phone_enabled');
  fillVehicleFinanceSettingsForm();
  bindVehicleFinanceSettingsInputs();
}
async function saveSetting(key,value){
  SETTINGS[key] = String(value ?? '');
  setLocalSetting(key, value);
  try{
    if(typeof supabaseClient !== 'undefined'){
      const {error} = await supabaseClient.from('site_settings').upsert({key,value:String(value ?? ''),updated_at:new Date().toISOString()},{onConflict:'key'});
      if(error) throw error;
    }
  }catch(e){ console.warn('Setting saved locally only:', key, e.message || e); }
}
async function saveSeo(){ await saveSetting('seo_title',el('seoTitle').value); await saveSetting('seo_description',el('seoDescription').value); await saveSetting('seo_keywords',el('seoKeywords').value); toast('SEO settings saved.'); }
async function saveOpenGraph(){ await saveSetting('og_title',el('ogTitle').value); await saveSetting('og_image',el('ogImage').value); toast('Open Graph settings saved.'); }

async function saveOtpControls(){
  const pairs={sms_otp_enabled:'smsOtpEnabled',sms_otp_register_enabled:'smsRegisterOtp',sms_otp_password_change_enabled:'smsPasswordOtp',sms_otp_ad_phone_enabled:'smsAdPhoneOtp'};
  for(const [key,id] of Object.entries(pairs)) await saveSetting(key,el(id)?.checked?'true':'false');
  toast('OTP controls saved.');
}

async function saveApiSettings(){
  await saveSetting('sms_provider',el('smsProvider').value || 'Text.lk');
  await saveSetting('sms_sender',el('smsSender').value || 'EHEMEHE');
  await saveSetting('otp_expiry_minutes',el('otpExpiryMinutes').value || '5');
  await saveSetting('otp_sms_template',el('otpTemplate').value || 'Your ehemehe.lk verification code is {{code}}. Do not share this code.');
  toast('SMS settings saved.');
}
async function sendAdminTestOtp(){
  const phone=(el('smsTestPhone')?.value||'').trim();
  if(!phone){ toast('Enter a test phone number.'); return; }
  try{
    const res=await fetch('/api/request-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,purpose:'admin_test'})});
    const data=await res.json();
    if(!res.ok || data.ok===false) throw new Error(data.message || 'SMS test failed.');
    toast('Test OTP sent successfully.');
  }catch(e){ toast(e.message); }
}
async function savePaymentSettings(){ await saveSetting('payment_provider',el('paymentProvider').value); await saveSetting('merchant_id',el('merchantId').value); await saveSetting('payment_secret',el('paymentSecret').value); toast('Payment settings saved.'); }
function renderBanners(){
  if(!BANNERS.length){ el('bannersList').innerHTML=`<div class="empty">No banners found.</div>`; return; }
  el('bannersList').innerHTML = BANNERS.map(b => `<div class="listing-card"><div class="listing-thumb">${b.image_url?`<img src="${html(b.image_url)}">`:'<div class="noimg">AD</div>'}</div><div class="listing-body"><div class="listing-title">${html(b.title||'Untitled banner')}</div><div class="listing-meta"><span>${html(b.placement||'-')}</span><span>${statusBadge(b.status||'active')}</span></div><div class="actions"><button class="btn small" onclick="editBanner('${html(b.id)}')">Edit</button><button class="btn danger small" onclick="deleteBanner('${html(b.id)}')">Delete</button></div></div></div>`).join('');
}
function showBannerPreview(src){
  const wrap=el('bannerPreviewWrap'), img=el('bannerPreview');
  if(!wrap||!img) return;
  if(src){ img.src=src; wrap.style.display='block'; }
  else { img.removeAttribute('src'); wrap.style.display='none'; }
}
function clearBannerImage(){
  if(el('bannerImage')) el('bannerImage').value='';
  if(el('bannerFile')) el('bannerFile').value='';
  showBannerPreview('');
}
async function handleBannerFile(event){
  const file=event?.target?.files?.[0];
  if(!file) return;
  if(!/^image\/(jpeg|png|webp)$/i.test(file.type)){ toast('Please select a JPG, PNG, or WebP image.'); clearBannerImage(); return; }
  if(file.size>12*1024*1024){ toast('Image must be smaller than 12MB.'); clearBannerImage(); return; }
  try{
    const dataUrl=await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(reader.result);
      reader.onerror=reject;
      reader.readAsDataURL(file);
    });
    const image=await new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=reject;
      img.src=dataUrl;
    });
    const maxWidth=1600;
    const scale=Math.min(1,maxWidth/image.width);
    const width=Math.max(1,Math.round(image.width*scale));
    const height=Math.max(1,Math.round(image.height*scale));
    const canvas=document.createElement('canvas');
    canvas.width=width; canvas.height=height;
    const ctx=canvas.getContext('2d');
    ctx.drawImage(image,0,0,width,height);
    const compressed=canvas.toDataURL('image/webp',0.84);
    el('bannerImage').value=compressed;
    showBannerPreview(compressed);
  }catch(e){
    toast('Could not process this image.');
    clearBannerImage();
  }
}
function editBanner(id){
  const b=BANNERS.find(x=>String(x.id)===String(id));
  if(!b) return;
  el('bannerId').value=b.id;
  el('bannerTitle').value=b.title||'';
  el('bannerImage').value=b.image_url||'';
  el('bannerUrl').value=b.target_url||b.url||'';
  el('bannerPlacement').value=b.placement||'home_mobile_between_filters_ads';
  if(el('bannerFile')) el('bannerFile').value='';
  showBannerPreview(b.image_url||'');
  window.scrollTo({top:0,behavior:'smooth'});
}
async function saveBanner(){
  try{
    const id=el('bannerId').value;
    const image=el('bannerImage').value;
    if(!image){ toast('Please select a banner image.'); return; }
    const payload={
      title:el('bannerTitle').value,
      image_url:image,
      target_url:el('bannerUrl').value,
      placement:el('bannerPlacement').value,
      status:'active',
      is_active:true,
      updated_at:new Date().toISOString()
    };
    if(id) await safeUpdate('banner_ads',id,payload);
    else await safeInsert('banner_ads',payload);
    ['bannerId','bannerTitle','bannerImage','bannerUrl'].forEach(key=>{ if(el(key)) el(key).value=''; });
    if(el('bannerFile')) el('bannerFile').value='';
    el('bannerPlacement').value='home_mobile_between_filters_ads';
    showBannerPreview('');
    await loadBanners(true);
    toast('Banner saved.');
  }catch(e){ toast(e.message); }
}
async function deleteBanner(id){
  if(!confirm('Delete this banner?')) return;
  try{
    await safeDelete('banner_ads',id);
    BANNERS=BANNERS.filter(b=>String(b.id)!==String(id));
    renderBanners();
    toast('Banner deleted.');
  }catch(e){ toast(e.message); }
}


/* ---------------- Ad Promotions Final Patch ---------------- */
const AD_PROMOTIONS_KEY = 'ehemeheAdPromotions';
const BANNER_ADS_KEY = 'ehemeheBannerAds';
function localRead(key, fallback=[]){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) || fallback; } catch(e){ return fallback; } }
function localWrite(key, value){ localStorage.setItem(key, JSON.stringify(value || [])); }
function addDaysISO(days){ const d = new Date(); d.setDate(d.getDate() + Math.max(1, Number(days || 1))); return d.toISOString(); }
function isActiveWindow(row){
  if(!row) return false;
  if(row.is_active === false || row.is_enabled === false || String(row.status || 'active').toLowerCase() === 'disabled') return false;
  const end = row.end_at || row.expires_at;
  if(!end) return true;
  const t = new Date(end).getTime();
  return !Number.isFinite(t) || t >= Date.now();
}
function categoryOfAd(ad){ return String(ad?.category_id || ad?.categoryId || ad?.categories?.id || ad?.categories?.slug || '').toLowerCase(); }
function adTitleById(id){ const ad = ADS.find(a => String(a.id) === String(id) || String(a.static_id) === String(id).replace(/^static-/, '')); return ad?.title || id || '-'; }
function categoryNameByValue(value){ const v=String(value||'').toLowerCase(); const c=CATEGORIES.find(x=>[x.id,x.slug,x.name].map(y=>String(y||'').toLowerCase()).includes(v)); return c?.name || titleFromId(value || 'All categories'); }

async function loadPromotions(render=true){
  let rows = await safeSelect('ad_promotions','*',{order:'created_at',ascending:false});
  const localRows = localRead(AD_PROMOTIONS_KEY, []);
  const merged = [...rows, ...localRows];
  const seen = new Set();
  AD_PROMOTIONS = merged.filter(p => { const key=String(p.id || `${p.ad_id}|${p.end_at}`); if(seen.has(key)) return false; seen.add(key); return true; });
  if(render) renderPromotions();
}

async function loadBanners(render=true){
  let rows = await safeSelect('banner_ads','*',{order:'created_at',ascending:false});
  if(!rows.length) rows = await safeSelect('banners','*',{order:'created_at',ascending:false});
  const localRows = localRead(BANNER_ADS_KEY, []);
  const merged = [...rows, ...localRows];
  const seen = new Set();
  BANNERS = merged.filter(b => { const key=String(b.id || b.title || b.image_url || Math.random()); if(seen.has(key)) return false; seen.add(key); return true; });
  if(render){ renderBanners(); renderPromoBanners(); }
}

function promotedAds(){ return ADS.filter(a => a.is_promoted || a.promoted || a.is_featured || a.featured || a.promotion_type || activeTopPromotionForAdminAd(a)); }
function activeTopPromotionForAdminAd(ad){ return AD_PROMOTIONS.find(p => String(p.promotion_type || 'top').toLowerCase() === 'top' && isActiveWindow(p) && (String(p.ad_id) === String(ad.id) || String(p.static_id) === String(ad.static_id))); }
function refreshPromotionsSection(){ loadAds(false).then(()=>loadPromotions(false)).then(()=>loadBanners(false)).then(renderPromotions); }
function renderPromotions(){ fillPromotionSelects(); renderTopPromotions(); renderPromoBanners(); }
function fillPromotionSelects(){
  const adSel = el('topPromoAd');
  if(adSel){
    const current = adSel.value;
    adSel.innerHTML = ADS.map(a => `<option value="${html(a.id)}">${html(a.title)} — ${html(adCategoryName(a))}</option>`).join('');
    if(current && [...adSel.options].some(o=>o.value===current)) adSel.value=current;
    adSel.onchange = () => { const ad=ADS.find(x=>String(x.id)===String(adSel.value)); if(ad && el('topPromoCategory')) el('topPromoCategory').value = categoryOfAd(ad) || 'all'; };
  }
  const catSel = el('topPromoCategory');
  if(catSel){
    const current = catSel.value;
    catSel.innerHTML = '<option value="all">Auto / All categories</option>' + CATEGORIES.map(c => `<option value="${html(String(c.id || c.slug || c.name).toLowerCase())}">${html(c.name)}</option>`).join('');
    if(current && [...catSel.options].some(o=>o.value===current)) catSel.value=current;
    else { const ad=ADS.find(x=>String(x.id)===String(adSel?.value)); if(ad) catSel.value=categoryOfAd(ad)||'all'; }
  }
}
async function saveTopAdPromotion(){
  if(!requirePermission('can_edit_ads')) return;
  const ad=ADS.find(a=>String(a.id)===String(el('topPromoAd')?.value));
  if(!ad){ toast('Select an ad first.'); return; }
  const days=Math.max(1,Number(el('topPromoDays')?.value||1));
  const now=new Date().toISOString();
  const payload={id:el('topPromoId')?.value||`top_${Date.now()}`,promotion_type:'top',ad_id:String(ad.id),static_id:ad.static_id||null,category_id:el('topPromoCategory')?.value==='all'?(categoryOfAd(ad)||null):el('topPromoCategory')?.value,days,start_at:now,end_at:addDaysISO(days),is_active:!!el('topPromoEnabled')?.checked,created_at:now,updated_at:now};
  try{ if(typeof supabaseClient!=='undefined'){ const {error}=await supabaseClient.from('ad_promotions').upsert(payload,{onConflict:'id'}); if(error) throw error; await loadPromotions(true); } else throw new Error('No Supabase'); }
  catch(e){ const rows=localRead(AD_PROMOTIONS_KEY,[]).filter(x=>String(x.id)!==String(payload.id)); rows.unshift(payload); localWrite(AD_PROMOTIONS_KEY,rows); await loadPromotions(true); }
  toast('Top Ad saved.');
}
function renderTopPromotions(){
  const target=el('topPromotionsList') || el('promotionsList'); if(!target) return;
  const rows=AD_PROMOTIONS.filter(p=>String(p.promotion_type||'top').toLowerCase()==='top');
  if(!rows.length){ target.innerHTML='<div class="empty">No Top Ads configured.</div>'; return; }
  target.innerHTML=table(['Ad','Category','Schedule','Status','Actions'], rows.map(p=>[
    html(adTitleById(p.ad_id||p.static_id)), html(categoryNameByValue(p.category_id)), `${dateText(p.start_at)} → ${dateText(p.end_at)}<br><span class="small">${html(p.days || '-')} days</span>`, statusBadge(isActiveWindow(p)?'active':'expired'),
    `<div class="actions"><button class="btn small" onclick="editTopPromotion('${html(p.id)}')">Edit</button><button class="btn warn small" onclick="toggleTopPromotion('${html(p.id)}')">${p.is_active===false?'Enable':'Disable'}</button><button class="btn danger small" onclick="deleteTopPromotion('${html(p.id)}')">Delete</button></div>`
  ]));
}
function editTopPromotion(id){ const p=AD_PROMOTIONS.find(x=>String(x.id)===String(id)); if(!p)return; fillPromotionSelects(); el('topPromoId').value=p.id; if(el('topPromoAd')) el('topPromoAd').value=p.ad_id||`static-${p.static_id}`; if(el('topPromoCategory')) el('topPromoCategory').value=p.category_id||'all'; if(el('topPromoDays')) el('topPromoDays').value=p.days||7; if(el('topPromoEnabled')) el('topPromoEnabled').checked=p.is_active!==false; }
async function toggleTopPromotion(id){ const rows=AD_PROMOTIONS.map(p=>String(p.id)===String(id)?{...p,is_active:p.is_active===false?true:false,updated_at:new Date().toISOString()}:p); const p=rows.find(x=>String(x.id)===String(id)); try{ if(p && typeof supabaseClient!=='undefined') await supabaseClient.from('ad_promotions').upsert(p,{onConflict:'id'}); }catch(e){} localWrite(AD_PROMOTIONS_KEY,rows); AD_PROMOTIONS=rows; renderPromotions(); }
async function deleteTopPromotion(id){ if(!confirm('Delete this Top Ad promotion?')) return; try{ if(typeof supabaseClient!=='undefined') await supabaseClient.from('ad_promotions').delete().eq('id',id); }catch(e){} const rows=AD_PROMOTIONS.filter(p=>String(p.id)!==String(id)); localWrite(AD_PROMOTIONS_KEY,rows); AD_PROMOTIONS=rows; renderPromotions(); }

function renderPromoBanners(){
  const target=el('promoBannersList'); if(!target) return;
  if(!BANNERS.length){ target.innerHTML='<div class="empty">No banner ads configured.</div>'; return; }
  target.innerHTML=table(['Banner','Image','Schedule','Status','Actions'], BANNERS.map(b=>[
    `<b>${html(b.title||'Untitled banner')}</b><br><span class="small">${html(b.target_url||b.url||'-')}</span>`, b.image_url?`<img class="ad-img" src="${html(b.image_url)}">`:'-', `${dateText(b.start_at)} → ${dateText(b.end_at)}<br><span class="small">${html(b.days||'-')} days</span>`, statusBadge(isActiveWindow(b)?'active':'expired'),
    `<div class="actions"><button class="btn small" onclick="editPromoBanner('${html(b.id)}')">Edit</button><button class="btn warn small" onclick="togglePromoBanner('${html(b.id)}')">${b.is_enabled===false?'Enable':'Disable'}</button><button class="btn danger small" onclick="deleteBanner('${html(b.id)}')">Delete</button></div>`
  ]));
}
function editPromoBanner(id){ const b=BANNERS.find(x=>String(x.id)===String(id)); if(!b)return; if(el('promoBannerId'))el('promoBannerId').value=b.id; if(el('promoBannerEnabled'))el('promoBannerEnabled').checked=b.is_enabled!==false && b.status!=='disabled'; if(el('promoBannerTitle'))el('promoBannerTitle').value=b.title||''; if(el('promoBannerImage'))el('promoBannerImage').value=b.image_url||''; if(el('promoBannerUrl'))el('promoBannerUrl').value=b.target_url||b.url||''; if(el('promoBannerDays'))el('promoBannerDays').value=b.days||7; }
async function savePromoBanner(){
  if(!requirePermission('can_edit_ads')) return;
  const days=Math.max(1,Number(el('promoBannerDays')?.value||1)); const now=new Date().toISOString();
  const payload={id:el('promoBannerId')?.value||`banner_${Date.now()}`,title:el('promoBannerTitle')?.value||'Banner Ad',image_url:el('promoBannerImage')?.value||'',target_url:el('promoBannerUrl')?.value||'/',placement:'home_top',days,start_at:now,end_at:addDaysISO(days),status:el('promoBannerEnabled')?.checked?'active':'disabled',is_enabled:!!el('promoBannerEnabled')?.checked,created_at:now,updated_at:now};
  if(!payload.image_url){ toast('Banner image URL required.'); return; }
  try{ if(typeof supabaseClient!=='undefined'){ const {error}=await supabaseClient.from('banner_ads').upsert(payload,{onConflict:'id'}); if(error) throw error; await loadBanners(true); } else throw new Error('No Supabase'); }
  catch(e){ const rows=localRead(BANNER_ADS_KEY,[]).filter(x=>String(x.id)!==String(payload.id)); rows.unshift(payload); localWrite(BANNER_ADS_KEY,rows); await loadBanners(true); }
  toast('Banner saved.');
}
async function togglePromoBanner(id){ const rows=BANNERS.map(b=>String(b.id)===String(id)?{...b,is_enabled:b.is_enabled===false?true:false,status:b.is_enabled===false?'active':'disabled',updated_at:new Date().toISOString()}:b); const b=rows.find(x=>String(x.id)===String(id)); try{ if(b && typeof supabaseClient!=='undefined') await supabaseClient.from('banner_ads').upsert(b,{onConflict:'id'}); }catch(e){} localWrite(BANNER_ADS_KEY,rows); BANNERS=rows; renderBanners(); renderPromoBanners(); }
function renderBanners(){
  if(!el('bannersList')) { renderPromoBanners(); return; }
  if(!BANNERS.length){ el('bannersList').innerHTML='<div class="empty">No banners found.</div>'; renderPromoBanners(); return; }
  renderPromoBanners();
  el('bannersList').innerHTML=BANNERS.map(b=>`<div class="listing-card"><div class="listing-thumb">${b.image_url?`<img src="${html(b.image_url)}">`:'<div class="noimg">AD</div>'}</div><div class="listing-body"><div class="listing-title">${html(b.title||'Untitled banner')}</div><div class="listing-meta"><span>${html(b.placement||'-')}</span><span>${statusBadge(b.status||'active')}</span></div><div class="actions"><button class="btn small" onclick="editBanner('${html(b.id)}')">Edit</button><button class="btn danger small" onclick="deleteBanner('${html(b.id)}')">Delete</button></div></div></div>`).join('');
}
function editBanner(id){ const b=BANNERS.find(x=>String(x.id)===String(id)); if(!b)return; if(el('bannerId'))el('bannerId').value=b.id; if(el('bannerTitle'))el('bannerTitle').value=b.title||''; if(el('bannerImage'))el('bannerImage').value=b.image_url||''; if(el('bannerUrl'))el('bannerUrl').value=b.target_url||b.url||''; if(el('bannerPlacement'))el('bannerPlacement').value=b.placement||'home_top'; }
async function saveBanner(){ const days=30; const now=new Date().toISOString(); const id=el('bannerId')?.value||`banner_${Date.now()}`; const payload={id,title:el('bannerTitle')?.value||'Banner Ad',image_url:el('bannerImage')?.value||'',target_url:el('bannerUrl')?.value||'/',placement:el('bannerPlacement')?.value||'home_top',status:'active',is_enabled:true,days,start_at:now,end_at:addDaysISO(days),updated_at:now,created_at:now}; try{ if(typeof supabaseClient!=='undefined'){ const {error}=await supabaseClient.from('banner_ads').upsert(payload,{onConflict:'id'}); if(error) throw error; } else throw new Error('No Supabase'); }catch(e){ const rows=localRead(BANNER_ADS_KEY,[]).filter(x=>String(x.id)!==String(id)); rows.unshift(payload); localWrite(BANNER_ADS_KEY,rows); } ['bannerId','bannerTitle','bannerImage','bannerUrl'].forEach(id=>{ if(el(id)) el(id).value=''; }); await loadBanners(true); }
async function deleteBanner(id){ if(!confirm('Delete this banner?')) return; try{ if(typeof supabaseClient!=='undefined') await supabaseClient.from('banner_ads').delete().eq('id',id); }catch(e){} const rows=localRead(BANNER_ADS_KEY,[]).filter(x=>String(x.id)!==String(id)); localWrite(BANNER_ADS_KEY,rows); BANNERS=BANNERS.filter(x=>String(x.id)!==String(id)); renderBanners(); renderPromoBanners(); }

checkSession();