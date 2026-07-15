let ADS = [], CATEGORIES = [], DISTRICTS = [], CITIES = [];
let USING_FALLBACK_ADS = false;

const el = (id) => document.getElementById(id);
const esc = (v) => String(v ?? '')
  .replaceAll('&','&amp;')
  .replaceAll('<','&lt;')
  .replaceAll('>','&gt;')
  .replaceAll('"','&quot;')
  .replaceAll("'",'&#039;');

const FALLBACK_CATEGORIES = [
  {id:'vehicles', name:'Vehicles'},
  {id:'cars', name:'Cars', parent_id:'vehicles'},
  {id:'property', name:'Property'},
  {id:'electronics', name:'Electronics'},
  {id:'mobiles', name:'Mobile Phones'},
  {id:'animals-pets', name:'Animals & Pets'},
  {id:'jobs', name:'Jobs'},
  {id:'education', name:'Education'}
];

const FALLBACK_DISTRICTS = [
  {id:'colombo', name:'Colombo'},
  {id:'gampaha', name:'Gampaha'},
  {id:'kandy', name:'Kandy'},
  {id:'galle', name:'Galle'},
  {id:'matara', name:'Matara'},
  {id:'kalutara', name:'Kalutara'}
];

const FALLBACK_CITIES = [
  {id:'colombo-city', name:'Colombo City', district_id:'colombo'},
  {id:'dehiwala', name:'Dehiwala', district_id:'colombo'},
  {id:'maharagama', name:'Maharagama', district_id:'colombo'},
  {id:'negombo', name:'Negombo', district_id:'gampaha'},
  {id:'gampaha-city', name:'Gampaha City', district_id:'gampaha'},
  {id:'kandy-city', name:'Kandy City', district_id:'kandy'},
  {id:'peradeniya', name:'Peradeniya', district_id:'kandy'},
  {id:'galle-city', name:'Galle City', district_id:'galle'},
  {id:'matara-city', name:'Matara City', district_id:'matara'},
  {id:'kalutara-city', name:'Kalutara City', district_id:'kalutara'}
];

const FALLBACK_ADS = [
  {
    id:'1', title:'2020 Toyota Prius Hybrid - Low Mileage', price:'8500000', category_id:'cars',
    city_id:'colombo-city', status:'approved', condition:'Used', promoted:true, featured:true,
    image_url:'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=900&auto=format&fit=crop',
    description:'Excellent condition Toyota Prius Hybrid with full service history and low mileage.',
    phone:'077 123 4567', created_at:new Date(Date.now()-86400000).toISOString(),
    categories:{name:'Cars'}, cities:{id:'colombo-city', name:'Colombo', district_id:'colombo'}
  },
  {
    id:'2', title:'Modern 3-Bedroom House in Kandy', price:'45000000', category_id:'property',
    city_id:'kandy-city', status:'approved', condition:'New', featured:true,
    image_url:'https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=900&auto=format&fit=crop',
    description:'Luxury modern house with parking, garden and peaceful neighbourhood in Kandy.',
    phone:'077 234 5678', created_at:new Date().toISOString(),
    categories:{name:'Property'}, cities:{id:'kandy-city', name:'Kandy', district_id:'kandy'}
  },
  {
    id:'3', title:'iPhone 15 Pro Max 256GB - Space Black', price:'520000', category_id:'mobiles',
    city_id:'colombo-city', status:'approved', condition:'New', promoted:true, featured:true,
    image_url:'https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=900&auto=format&fit=crop',
    description:'Brand new sealed iPhone 15 Pro Max 256GB with Apple warranty.',
    phone:'077 345 6789', created_at:new Date().toISOString(),
    categories:{name:'Mobile Phones'}, cities:{id:'colombo-city', name:'Colombo', district_id:'colombo'}
  },
  {
    id:'4', title:'Samsung 65" QLED 4K Smart TV', price:'485000', category_id:'electronics',
    city_id:'gampaha-city', status:'approved', condition:'New', featured:true,
    image_url:'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=900&auto=format&fit=crop',
    description:'Samsung QLED 4K Smart TV with built-in apps, excellent picture quality.',
    phone:'077 456 7890', created_at:new Date(Date.now()-3*86400000).toISOString(),
    categories:{name:'Electronics'}, cities:{id:'gampaha-city', name:'Gampaha', district_id:'gampaha'}
  },
  {
    id:'5', title:'Golden Retriever Puppies - 3 Months', price:'85000', category_id:'animals-pets',
    city_id:'colombo-city', status:'approved', condition:'New', featured:true,
    image_url:'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=900&auto=format&fit=crop',
    description:'Healthy Golden Retriever puppies, vaccinated and ready for a loving home.',
    phone:'077 567 8901', created_at:new Date().toISOString(),
    categories:{name:'Animals & Pets'}, cities:{id:'colombo-city', name:'Colombo', district_id:'colombo'}
  },
  {
    id:'6', title:'Software Engineer - Remote Position', price:'', category_id:'jobs',
    city_id:'colombo-city', status:'approved', condition:'', promoted:true, featured:true,
    image_url:'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=900&auto=format&fit=crop',
    description:'Remote software engineering job opportunity for experienced developers.',
    phone:'077 678 9012', created_at:new Date().toISOString(),
    categories:{name:'Jobs'}, cities:{id:'colombo-city', name:'Colombo', district_id:'colombo'}
  },
  {
    id:'7', title:'A-Level Physics Tuition - Online', price:'', category_id:'education',
    city_id:'peradeniya', status:'approved', condition:'', featured:true,
    image_url:'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=900&auto=format&fit=crop',
    description:'Individual and group classes for A/L Physics with online support.',
    phone:'077 789 0123', created_at:new Date().toISOString(),
    categories:{name:'Education'}, cities:{id:'peradeniya', name:'Peradeniya', district_id:'kandy'}
  },
  {
    id:'8', title:'Used Laptop - Core i5, 8GB RAM', price:'95000', category_id:'electronics',
    city_id:'galle-city', status:'approved', condition:'Used', featured:true,
    image_url:'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=900&auto=format&fit=crop',
    description:'Clean used laptop in good working condition. Suitable for office and study.',
    phone:'077 890 1234', created_at:new Date().toISOString(),
    categories:{name:'Electronics'}, cities:{id:'galle-city', name:'Galle', district_id:'galle'}
  }
];

function money(value){
  if(value === null || value === undefined || value === '') return 'Price on request';
  const raw = String(value).replace(/[^\d.]/g,'');
  if(!raw) return String(value);
  return 'LKR ' + Number(raw).toLocaleString('en-US');
}

function getImage(ad){
  if(ad.image_url) return ad.image_url;
  if(Array.isArray(ad.images) && ad.images[0]) return ad.images[0];
  if(typeof ad.images === 'string'){
    try{
      const parsed = JSON.parse(ad.images);
      if(Array.isArray(parsed) && parsed[0]) return parsed[0];
    }catch(e){}
    return ad.images;
  }
  return '';
}

function getCategoryName(ad){
  return ad.categories?.name || ad.category_name || ad.category || '';
}

function getCityName(ad){
  return ad.cities?.name || ad.city_name || ad.city || ad.location || '';
}

function getDistrictId(ad){
  return String(ad.cities?.district_id || ad.district_id || '').toLowerCase();
}

function normalizeAd(ad){
  return {
    ...ad,
    id: String(ad.id ?? ad.slug ?? cryptoRandomId()),
    title: ad.title || ad.name || 'Untitled ad',
    price: ad.price ?? ad.amount ?? '',
    description: ad.description || ad.details || '',
    category_id: String(ad.category_id || ad.categoryId || ad.categories?.id || ad.category || '').toLowerCase(),
    city_id: String(ad.city_id || ad.cityId || ad.cities?.id || ad.city || '').toLowerCase(),
    phone: ad.phone || ad.contact_phone || ad.mobile || '',
    contact_phones: (()=>{let c=ad.custom_fields||{};if(typeof c==='string'){try{c=JSON.parse(c)}catch(_){c={}}}const p=ad.contact_phones||c.contact_phones||c.verified_contact_phones||[];return Array.from(new Set([ad.phone||ad.contact_phone||ad.mobile||'',...(Array.isArray(p)?p:[p])].filter(Boolean)));})(),
    status: ad.status || 'approved'
  };
}

function cryptoRandomId(){
  return 'ad-' + Math.random().toString(36).slice(2);
}

async function init(){
  setLoading();
  await Promise.allSettled([loadLookups(), loadAds()]);
  if(!CATEGORIES.length) CATEGORIES = FALLBACK_CATEGORIES;
  if(!DISTRICTS.length) DISTRICTS = FALLBACK_DISTRICTS;
  if(!CITIES.length) CITIES = FALLBACK_CITIES;
  if(!ADS.length){
    ADS = FALLBACK_ADS.map(normalizeAd);
    USING_FALLBACK_ADS = true;
  }
  populateFilters();
  attachEvents();
  renderAds();
}

async function loadLookups(){
  if(typeof supabaseClient === 'undefined') return;
  const [cats, districts, cities] = await Promise.all([
    supabaseClient.from('categories').select('*').eq('is_active', true).order('name'),
    supabaseClient.from('districts').select('*').eq('is_active', true).order('name'),
    supabaseClient.from('cities').select('*').eq('is_active', true).order('name')
  ]);
  if(!cats.error && cats.data?.length) CATEGORIES = cats.data;
  if(!districts.error && districts.data?.length) DISTRICTS = districts.data;
  if(!cities.error && cities.data?.length) CITIES = cities.data;
}

async function loadAds(){
  if(typeof supabaseClient === 'undefined') return;

  let result = await supabaseClient
    .from('ads')
    .select('id,title,description,price,category_id,city_id,status,condition,image_url,created_at,featured,promoted,phone,custom_fields')
    .eq('status','approved')
    .order('created_at', { ascending:false })
    .limit(120);

  if(!result.error && result.data?.length){
    ADS = result.data.map(normalizeAd);
  }
}

function populateFilters(){
  const categorySelect = el('category');
  const locationSelect = el('location');

  categorySelect.innerHTML = '<option value="all">All categories</option>' +
    CATEGORIES.map(c => `<option value="${esc(String(c.id).toLowerCase())}">${esc(c.name)}</option>`).join('');

  let locHtml = '<option value="all">All of Sri Lanka</option>';
  DISTRICTS.forEach(d => {
    const dId = String(d.id).toLowerCase();
    locHtml += `<option value="district:${esc(dId)}">All ads in ${esc(d.name)}</option>`;
    const cities = CITIES.filter(c => String(c.district_id).toLowerCase() === dId);
    if(cities.length){
      locHtml += `<optgroup label="${esc(d.name)}">`;
      cities.forEach(c => {
        locHtml += `<option value="city:${esc(String(c.id).toLowerCase())}">${esc(c.name)}</option>`;
      });
      locHtml += '</optgroup>';
    }
  });
  locationSelect.innerHTML = locHtml;

  applyUrlFilters();
  updateStats();
}

function applyUrlFilters(){
  const params = new URLSearchParams(window.location.search);
  if(params.get('q')) el('q').value = params.get('q');
  if(params.get('category')) el('category').value = params.get('category');
  if(params.get('location')) el('location').value = params.get('location');
}

function attachEvents(){
  el('q').addEventListener('input', renderAds);
  el('category').addEventListener('change', renderAds);
  el('location').addEventListener('change', renderAds);
  el('searchBtn').addEventListener('click', (e) => { e.preventDefault(); renderAds(true); });
  el('q').addEventListener('keydown', (e) => {
    if(e.key === 'Enter'){ e.preventDefault(); renderAds(true); }
  });
}

function updateStats(){
  el('statApproved').textContent = ADS.length;
  el('statCategories').textContent = CATEGORIES.length;
  el('statLocations').textContent = DISTRICTS.length;
}

function setLoading(){
  el('ads').innerHTML = '<div class="loading">Loading approved ads...</div>';
  el('resultCount').textContent = 'Loading...';
}

function adMatches(ad){
  const q = (el('q').value || '').trim().toLowerCase();
  const cat = el('category').value;
  const loc = el('location').value;

  const adText = JSON.stringify(ad).toLowerCase();
  const searchOk = !q || adText.includes(q);

  const adCat = String(ad.category_id || ad.categories?.id || '').toLowerCase();
  const categoryOk = cat === 'all' || adCat === cat || getCategoryName(ad).toLowerCase() === cat;

  let locationOk = true;
  if(loc !== 'all'){
    const [kind, value] = loc.split(':');
    if(kind === 'district'){
      const dId = String(value || '').toLowerCase();
      locationOk = getDistrictId(ad) === dId || adText.includes(dId);
    }
    if(kind === 'city'){
      const cId = String(value || '').toLowerCase();
      locationOk = String(ad.city_id || ad.cities?.id || '').toLowerCase() === cId || adText.includes(cId);
    }
  }

  return searchOk && categoryOk && locationOk;
}

function renderAds(force=false){
  const rows = ADS.filter(adMatches);
  const active = hasActiveFilters();

  el('resultTitle').textContent = active ? 'Search results' : 'Latest approved ads';
  el('resultSub').textContent = rows.length
    ? (USING_FALLBACK_ADS ? 'Preview listings are showing because no approved Supabase ads were found.' : 'Approved listings from database.')
    : 'Try changing search, category or location filters.';
  el('resultCount').textContent = `${rows.length} ads found`;

  el('ads').innerHTML = rows.length ? rows.map(renderCard).join('') : `
    <div class="empty">
      <strong>No approved ads found</strong>
      Supabase database එකේ approved ads නැත්නම් මෙතන හිස්ව පෙනෙයි. Admin panel එකෙන් ad එක approve කරලා නැවත refresh කරන්න.
    </div>`;

  const params = new URLSearchParams();
  if(el('q').value.trim()) params.set('q', el('q').value.trim());
  if(el('category').value !== 'all') params.set('category', el('category').value);
  if(el('location').value !== 'all') params.set('location', el('location').value);
  const url = params.toString() ? `/browse?${params.toString()}` : '/browse';
  history.replaceState(null, '', url);
}

function hasActiveFilters(){
  return !!(el('q').value.trim() || el('category').value !== 'all' || el('location').value !== 'all');
}

function renderCard(ad){
  const img = getImage(ad);
  const link = `/ad/${encodeURIComponent(ad.id)}`;
  const created = ad.created_at ? new Date(ad.created_at) : null;
  const dateText = created && !isNaN(created) ? created.toLocaleDateString('en-GB', {day:'numeric', month:'short'}) : 'Today';
  const condition = ad.condition || ad.item_condition || '';
  const promoted = ad.promoted || ad.is_promoted;
  const featured = ad.featured || ad.is_featured || true;

  return `
    <article class="card">
      <a class="thumb ${img ? '' : 'no-img'}" href="${link}">
        ${img ? `<img src="${esc(img)}" alt="${esc(ad.title)}" onerror="this.parentElement.classList.add('no-img');this.remove();">` : 'e'}
        <div class="badges">
          ${featured ? '<span class="badge featured">Featured</span>' : '<span></span>'}
          ${promoted ? '<span class="badge promoted">Promoted</span>' : '<span class="badge status">Approved</span>'}
        </div>
        <button class="heart" type="button" aria-label="Save">♡</button>
      </a>
      <div class="card-body">
        <h3 class="title">${esc(ad.title)}</h3>
        <div class="price">${esc(money(ad.price))}</div>
        <div class="meta">
          <span>📍 ${esc(getCityName(ad) || 'Sri Lanka')}</span>
          <span>🗓 ${esc(dateText)}</span>
          ${condition ? `<span>🏷 ${esc(condition)}</span>` : ''}
        </div>
        <p class="desc">${esc((ad.description || '').slice(0, 150))}</p>
        <div class="card-actions">
          <a class="details" href="${link}">View details</a>
          <button type="button" onclick="callSeller('${esc(ad.phone || '')}')">Call</button>
        </div>
      </div>
    </article>
  `;
}

function callSeller(phone){
  if(!phone){ alert('Phone number not available'); return; }
  location.href = 'tel:' + phone.replace(/[^\d+]/g,'');
}

init();
